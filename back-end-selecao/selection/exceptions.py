"""
Exceptions customizadas para regras de negócio.
Permite tratamento específico de erros sem acoplar com HTTP.
"""
from rest_framework.exceptions import APIException


class BusinessRuleException(APIException):
    """
    Exceção base para violações de regras de negócio.
    """
    status_code = 400
    default_detail = 'Regra de negócio violada.'
    default_code = 'business_rule_violation'


class ProcessNotInAnalysisException(BusinessRuleException):
    """
    Exceção quando tenta operar em processo que não está em análise.
    """
    default_detail = 'Processo deve estar em análise para esta operação.'


class ProcessAlreadyFinishedException(BusinessRuleException):
    """
    Exceção quando tenta operar em processo já finalizado.
    """
    default_detail = 'Este processo já está finalizado.'


class StageNotCompletedException(BusinessRuleException):
    """
    Exceção quando tenta avançar etapa sem completar a anterior.
    """
    default_detail = 'Etapa anterior não foi concluída para todos os candidatos.'


class CandidateNotFoundException(BusinessRuleException):
    """
    Exceção quando candidato não é encontrado.
    """
    status_code = 404
    default_detail = 'Perfil de candidato não encontrado.'


class EmailNotVerifiedException(BusinessRuleException):
    """
    Exceção quando email não está verificado.
    """
    default_detail = 'Seu email não está verificado. Verifique seu email antes de se candidatar.'


class DuplicateApplicationException(BusinessRuleException):
    """
    Exceção quando candidato já possui aplicação para o processo.
    """
    default_detail = 'Você já possui uma candidatura para este processo.'

