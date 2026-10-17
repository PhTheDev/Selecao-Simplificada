from celery import shared_task
from celery.exceptions import MaxRetriesExceededError
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from .selectionprocess.models import SelectionProcess
from .application.models import Application
import logging
import random
from datetime import timedelta

SMS_TASK_MAX_RETRIES = 5

logger = logging.getLogger(__name__)

@shared_task
def update_selection_process_status():
    """
    Tarefa periódica para atualizar o status dos processos seletivos
    baseado nas datas. Executada automaticamente pelo Celery Beat.
    
    Status automáticos:
    - created -> quando a data de início ainda não chegou
    - in_application -> quando estamos entre beginning_date e ending_date
    - in_analysis -> quando ending_date já passou
    
    Status manual:
    - finished -> apenas quando administrador finaliza o processo
    """
    try:
        logger.info("🚀 Iniciando atualização automática de status dos processos seletivos")
        
        # Busca todos os processos que não estão finalizados e estão ativos
        processes = SelectionProcess.objects.filter(
            is_active=True
        ).exclude(status='finished')
        
        updated_count = 0
        now = timezone.now()
        
        for process in processes:
            try:
                with transaction.atomic():
                    old_status = process.status
                    was_updated = process.update_status_based_on_dates()
                    
                    if was_updated:
                        process.save(update_fields=['status', 'analysis_start_date', 'updated_at'])
                        updated_count += 1
                        
                        # Log da mudança de status
                        logger.info(
                            f"✅ Processo {process.id} ({process.title}) "
                            f"atualizado de '{old_status}' para '{process.status}'"
                        )
                        
                        # Se mudou para "em análise", pode enviar notificação
                        if process.status == 'in_analysis' and old_status == 'in_application':
                            notify_process_entered_analysis.delay(process.id)
                            
            except Exception as e:
                logger.error(f"❌ Erro ao atualizar processo {process.id}: {str(e)}")
                continue
        
        logger.info(f"📊 Atualização concluída: {updated_count} processos atualizados")
        return {
            'success': True,
            'updated_count': updated_count,
            'timestamp': now.isoformat()
        }
        
    except Exception as e:
        logger.error(f"💥 Erro na tarefa de atualização de status: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }

@shared_task
def notify_process_entered_analysis(process_id):
    """
    Notifica administradores quando um processo entra em análise
    """
    try:
        process = SelectionProcess.objects.get(id=process_id)
        
        # Conta quantas inscrições foram recebidas
        enrollment_count = Application.objects.filter(selection_process=process).count()
        
        # Envia email para administradores
        admin_emails = [email for name, email in settings.ADMINS]
        
        subject = f"🔍 Processo seletivo entrou em análise: {process.title}"
        
        html_message = render_to_string('selection/emails/process_in_analysis.html', {
            'process': process,
            'enrollment_count': enrollment_count,
            'analysis_start_date': timezone.now()
        })
        
        send_mail(
            subject=subject,
            message=f"O processo seletivo '{process.title}' entrou em análise. Total de inscrições: {enrollment_count}.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=admin_emails,
            html_message=html_message,
            fail_silently=True
        )
        
        logger.info(f"📧 Notificação de análise enviada para processo: {process.title}")
        
        return {
            'success': True,
            'process_id': process_id,
            'enrollment_count': enrollment_count
        }
        
    except SelectionProcess.DoesNotExist:
        logger.error(f"❌ Processo {process_id} não encontrado para notificação")
        return {'success': False, 'error': 'Processo não encontrado'}
    except Exception as e:
        logger.error(f"❌ Erro na notificação de processo em análise: {str(e)}")
        return {'success': False, 'error': str(e)}


def _sms_retry_countdown(retries: int) -> float:
    """Exponential backoff 2, 4, 8, 16, 32s plus jitter (stays within OTP TTL)."""
    exponent = min(retries + 1, 5)
    return float(2**exponent) + random.uniform(0, 1)


def _fail_sms_audit(audit, verification_id: str, *, error_code: str = "", error_message: str):
    from selection.candidate.models import SMSVerificationStatus
    from selection.candidate.otp import clear_otp

    clear_otp(verification_id)
    audit.status = SMSVerificationStatus.FAILED
    audit.error_code = error_code or ""
    audit.error_message = error_message
    audit.save(update_fields=["status", "error_code", "error_message", "updated_at"])


def _fail_after_retries(exc: Exception, audit, verification_id: str, *, unexpected: bool = False):
    error_code = getattr(exc, "error_code", "") or ""
    if unexpected:
        logger.exception("Unexpected SMS failure verification_id=%s", verification_id)
        _fail_sms_audit(audit, verification_id, error_message="Falha ao enviar SMS.")
        return {"success": False, "error": "send_failure"}
    if getattr(settings, "SMS_DEBUG_EXPOSE_ERRORS", False):
        logger.error(
            "iSend SMS failure verification_id=%s error_code=%s",
            verification_id,
            error_code,
        )
    else:
        logger.error("iSend SMS failure verification_id=%s", verification_id)
    _fail_sms_audit(
        audit,
        verification_id,
        error_code=error_code,
        error_message=str(exc),
    )
    return {"success": False, "error": "isend_failure"}


def _retry_sms_send(
    task,
    exc: Exception,
    audit,
    verification_id: str,
    candidate_id: int,
    phone: str,
    code: str,
    *,
    unexpected: bool = False,
):
    retries = int(getattr(task.request, "retries", 0) or 0)
    max_retries = int(getattr(task, "max_retries", SMS_TASK_MAX_RETRIES) or SMS_TASK_MAX_RETRIES)
    if retries >= max_retries:
        return _fail_after_retries(exc, audit, verification_id, unexpected=unexpected)

    try:
        raise task.retry(
            exc=exc,
            countdown=_sms_retry_countdown(retries),
            args=[verification_id, candidate_id, phone, code],
        )
    except MaxRetriesExceededError:
        return _fail_after_retries(exc, audit, verification_id, unexpected=unexpected)


@shared_task(
    bind=True,
    max_retries=SMS_TASK_MAX_RETRIES,
    acks_late=True,
    reject_on_worker_lost=True,
)
def send_password_reset_sms(
    self,
    verification_id: str,
    candidate_id: int,
    phone: str,
    code: str | None = None,
):
    """
    Generate OTP, store hash in Redis, send SMS via configured gateway, update audit.
    OTP plaintext never touches PostgreSQL or structured logs.
    Retries reuse the same OTP; FAILED/clear happens only on permanent error or exhaustion.
    """
    from selection.candidate.isend import (
        ISendPermanentError,
        ISendServiceError,
        ISendTransientError,
    )
    from selection.candidate.models import SMSVerification, SMSVerificationStatus
    from selection.candidate.otp import generate_otp, get_otp_payload, store_otp
    from selection.candidate.sms import get_sms_gateway

    audit = SMSVerification.objects.filter(verification_id=verification_id).first()
    if not audit:
        logger.warning(
            "SMS audit not found verification_id=%s",
            verification_id,
        )
        return {"success": False, "error": "audit_not_found"}

    if not code:
        code = generate_otp()
        store_otp(verification_id, code, candidate_id)
    elif get_otp_payload(verification_id) is None:
        store_otp(verification_id, code, candidate_id)

    ttl_seconds = int(getattr(settings, "SMS_VERIFICATION_TTL", 300))
    ttl_minutes = max(1, ttl_seconds // 60)
    message = (
        f"Selecao Simplificada: seu codigo de recuperacao e {code}. "
        f"Valido por {ttl_minutes} minutos. Nao compartilhe."
    )

    try:
        from selection.candidate.models import Candidate

        gateway = get_sms_gateway(Candidate.objects.filter(pk=candidate_id).first())
        sms_ctr = gateway.send(phone, message)
        audit.status = SMSVerificationStatus.SENT
        audit.sms_ctr = sms_ctr or ""
        audit.sent_at = timezone.now()
        audit.save(update_fields=["status", "sms_ctr", "sent_at", "updated_at"])
        logger.info(
            "Password reset SMS sent verification_id=%s",
            verification_id,
        )
        return {"success": True, "verification_id": verification_id}
    except ISendPermanentError as exc:
        _fail_sms_audit(
            audit,
            verification_id,
            error_code=exc.error_code or "",
            error_message=str(exc),
        )
        if getattr(settings, "SMS_DEBUG_EXPOSE_ERRORS", False):
            logger.error(
                "iSend SMS permanent failure verification_id=%s error_code=%s",
                verification_id,
                exc.error_code,
            )
        else:
            logger.error("iSend SMS permanent failure verification_id=%s", verification_id)
        return {"success": False, "error": "isend_failure"}
    except ISendTransientError as exc:
        return _retry_sms_send(
            self, exc, audit, verification_id, candidate_id, phone, code
        )
    except ISendServiceError as exc:
        return _retry_sms_send(
            self, exc, audit, verification_id, candidate_id, phone, code
        )
    except Exception as exc:
        return _retry_sms_send(
            self,
            exc,
            audit,
            verification_id,
            candidate_id,
            phone,
            code,
            unexpected=True,
        )