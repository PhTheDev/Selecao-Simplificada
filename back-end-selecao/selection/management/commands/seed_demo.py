"""Cria dados de demonstração para testar o sistema localmente.

Uso:
    python manage.py seed_demo           # cria o que ainda não existe
    python manage.py seed_demo --reset   # apaga os dados demo e recria

Só toca em dados marcados como demo: e-mails @demo.test, slugs "demo-*" e o
usuário admin "admin.demo". Nada além disso é alterado ou apagado.
"""
import io
import random
from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from PIL import Image, ImageDraw, ImageFont

from administrator.choices import AdministratorRole
from administrator.models import AdministratorProfile
from selection.application.choices import Status as AppStatus
from selection.application.choices import WinnerStatus
from selection.application.models import Application
from selection.application.services import ApplicationService
from selection.candidate.models import Candidate
from selection.evaluation.models import Stage1Evaluation, Stage2Evaluation
from selection.selectionprocess.cache_utils import bump_selection_process_cache_version
from selection.selectionprocess.models import NoticeDocument, SelectionProcess

DEMO_DOMAIN = "demo.test"
DEMO_SLUG_PREFIX = "demo-"
ADMIN_USERNAME = "admin.demo"
ADMIN_PASSWORD = "Admin@123"
CANDIDATE_PASSWORD = "Senha@123"

CANDIDATES = [
    ("Ana Beatriz Souza", "ana.souza"),
    ("Bruno Henrique Lima", "bruno.lima"),
    ("Carla Mendes Oliveira", "carla.oliveira"),
    ("Diego Ferreira Costa", "diego.costa"),
    ("Eduarda Nogueira Alves", "eduarda.alves"),
    ("Felipe Araújo Ramos", "felipe.ramos"),
    ("Gabriela Martins Rocha", "gabriela.rocha"),
    ("Henrique Duarte Pires", "henrique.pires"),  # e-mail NÃO verificado (testa o aviso de login)
]
UNVERIFIED_INDEX = 7

# Pesos globais: a soma dos ativos precisa ser exatamente 100 (validado em SelectionProcess.clean).
W_FULL = dict(weight_curriculum=20, weight_school_records=20, weight_interview=40, weight_essay=20)
W_NO_ESSAY_PORTFOLIO = dict(
    has_essay=False, include_portfolio_in_score=True,
    weight_curriculum=20, weight_school_records=20, weight_portfolio=20, weight_interview=40,
)


def _processes(today):
    d = lambda n: today + timedelta(days=n)  # noqa: E731
    base = dict(period_accepted="Todos os períodos", bout="M", weekly_workload="30h", local="Sede")
    return [
        dict(
            slug="demo-dev-software", title="Estágio em Desenvolvimento de Software",
            subtitle="Atue em produtos web com mentoria da equipe de engenharia",
            course="Ciência da Computação", beginning_date=d(-10), ending_date=d(20),
            status="in_application", number_vacancies=3, salary="1500.00", local="Remoto",
            applicants=[0, 1, 2], **W_FULL, **{k: v for k, v in base.items() if k != "local"},
        ),
        dict(
            slug="demo-design-produto", title="Estágio em Design de Produto",
            subtitle="Pesquisa, prototipação e design de interfaces",
            course="Design", beginning_date=d(-25), ending_date=d(3),  # expirando (<= 7 dias)
            status="in_application", number_vacancies=2, salary="1300.00", bout="T",
            applicants=[0, 3], **W_NO_ESSAY_PORTFOLIO,
            **{k: v for k, v in base.items() if k not in ("bout",)},
        ),
        dict(
            slug="demo-analise-dados", title="Estágio em Análise de Dados",
            subtitle="Dashboards, SQL e Python aplicados ao negócio",
            course="Estatística", beginning_date=d(10), ending_date=d(40),  # em breve
            status="created", number_vacancies=1, salary="1400.00", applicants=[], **W_FULL, **base,
        ),
        dict(
            slug="demo-suporte-ti", title="Estágio em Suporte de TI",
            subtitle="Atendimento e infraestrutura — etapa 1 em andamento",
            course="Sistemas de Informação", beginning_date=d(-40), ending_date=d(-5),
            status="in_analysis", analysis_stage="stage1_documents", number_vacancies=2,
            salary="1100.00", applicants=[0, 1, 2, 3, 4], stage1_done=3, **W_FULL, **base,
        ),
        dict(
            slug="demo-marketing", title="Estágio em Marketing Digital",
            subtitle="Conteúdo, mídia paga e métricas — etapa 2 (entrevistas)",
            course="Publicidade", beginning_date=d(-50), ending_date=d(-12),
            status="in_analysis", analysis_stage="stage2_interview", number_vacancies=2,
            salary="1200.00", applicants=[1, 2, 3, 4, 5], stage1_done=5, stage2_done=2,
            reject_index=4, **W_FULL, **base,
        ),
        dict(
            slug="demo-redes", title="Estágio em Redes e Infraestrutura",
            subtitle="Processo finalizado, com ranking e vencedores definidos",
            course="Engenharia da Computação", beginning_date=d(-90), ending_date=d(-60),
            status="in_analysis", analysis_stage="analysis_completed", final_status="finished",
            number_vacancies=2, salary="1250.00", applicants=[0, 1, 2, 3, 4],
            stage1_done=5, stage2_done=5, **W_FULL, **base,
        ),
    ]


def _pdf(text: str) -> bytes:
    stream = f"BT /F1 14 Tf 20 60 Td ({text}) Tj ET".encode()
    return (
        b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 320 120]/Contents 4 0 R"
        b"/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
        + b"4 0 obj<</Length " + str(len(stream)).encode() + b">>stream\n" + stream + b"\nendstream endobj\n"
        b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
        b"trailer<</Root 1 0 R>>\n%%EOF"
    )


def _banner(title: str) -> ContentFile:
    """Banner 1200x675 no tema escuro/lima do portal."""
    w, h = 1200, 675
    img = Image.new("RGB", (w, h), "#050507")
    draw = ImageDraw.Draw(img)
    for y in range(h):  # degradê vertical sutil
        c = int(5 + 14 * y / h)
        draw.line([(0, y), (w, y)], fill=(c, c, c + 4))
    draw.rectangle([60, 60, 72, h - 60], fill="#ccff00")
    draw.text((110, 90), "SELEÇÃO SIMPLIFICADA", fill="#ccff00", font=ImageFont.load_default(size=28))
    # quebra o título em linhas de ~22 caracteres
    words, lines, cur = title.upper().split(), [], ""
    for word in words:
        if len(cur) + len(word) + 1 > 22 and cur:
            lines.append(cur)
            cur = word
        else:
            cur = f"{cur} {word}".strip()
    lines.append(cur)
    font = ImageFont.load_default(size=72)
    for i, line in enumerate(lines):
        draw.text((110, 220 + i * 90), line, fill="#f4f4f5", font=font)
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return ContentFile(buf.getvalue())


class Command(BaseCommand):
    help = "Cria usuários, processos seletivos, inscrições e avaliações de demonstração."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Apaga os dados demo antes de recriar.")

    @transaction.atomic
    def handle(self, *args, **opts):
        if opts["reset"]:
            self._reset()

        rng = random.Random(42)  # notas determinísticas entre execuções
        today = timezone.localdate()
        admin = self._admin()
        candidates = self._candidates()

        for spec in _processes(today):
            self._process(spec, admin, candidates, rng)

        bump_selection_process_cache_version()
        self._summary()

    # ------------------------------------------------------------------ reset
    def _reset(self):
        SelectionProcess.objects.filter(slug__startswith=DEMO_SLUG_PREFIX).delete()
        User.objects.filter(email__endswith=f"@{DEMO_DOMAIN}").delete()  # cascata: Candidate/Admin
        Candidate.objects.filter(email__endswith=f"@{DEMO_DOMAIN}").delete()
        self.stdout.write("Dados demo anteriores removidos.")

    # ------------------------------------------------------------------ admin
    def _admin(self) -> User:
        user, created = User.objects.get_or_create(
            username=ADMIN_USERNAME,
            defaults=dict(email=f"admin@{DEMO_DOMAIN}", first_name="Admin", last_name="Demo",
                          is_staff=True, is_superuser=True),
        )
        if created:
            user.set_password(ADMIN_PASSWORD)
            user.save()
        AdministratorProfile.objects.get_or_create(
            user=user,
            defaults=dict(role=AdministratorRole.SUPER_ADMIN, matricula="100001", department="Coordenação (demo)"),
        )
        return user

    # ------------------------------------------------------------- candidates
    def _candidates(self) -> list[Candidate]:
        pwd = make_password(CANDIDATE_PASSWORD)
        out = []
        for i, (name, local) in enumerate(CANDIDATES):
            cand, created = Candidate.objects.get_or_create(
                email=f"{local}@{DEMO_DOMAIN}",
                defaults=dict(
                    name=name, password=pwd, email_verified=(i != UNVERIFIED_INDEX),
                    cpf=f"9000000{i + 1:04d}", gender="F" if name.split()[0][-1] == "a" else "M",
                    phone=f"119999900{i + 1:02d}", college="Universidade Demo", period="N",
                    semester=str(3 + i % 6), cep="01310100", address="Avenida Paulista, 1000",
                    complement="Apto 12", neighborhood="Bela Vista", city="São Paulo", uf="SP",
                ),
            )
            if created and i != UNVERIFIED_INDEX:
                cand.create_user_account()
            out.append(cand)
        return out

    # -------------------------------------------------------------- processes
    def _process(self, spec, admin, candidates, rng):
        spec = dict(spec)  # não muta o catálogo
        applicants = spec.pop("applicants")
        stage1_done = spec.pop("stage1_done", 0)
        stage2_done = spec.pop("stage2_done", 0)
        reject_index = spec.pop("reject_index", None)
        final_status = spec.pop("final_status", None)
        slug = spec.pop("slug")

        process = SelectionProcess.objects.filter(slug=slug).first()
        if process:
            self.stdout.write(f"= {slug} já existe (use --reset para recriar)")
            return

        process = SelectionProcess(
            slug=slug, created_by=admin, is_active=True,
            description=f"{spec['title']}. Vaga de demonstração para testes do portal.",
            requirements="Cursando graduação na área\nDisponibilidade de 30h semanais\nBoa comunicação",
            benefits="Bolsa-auxílio\nVale-transporte\nRecesso remunerado",
            **spec,
        )
        if spec["status"] == "in_analysis":
            process.analysis_start_date = timezone.now() - timedelta(days=5)
        process.process_banner.save(f"{slug}.png", _banner(spec["title"]), save=False)
        process.save()
        NoticeDocument.objects.create(
            selection_process=process, name="Edital completo", order=0,
            file=ContentFile(_pdf("Edital de demonstracao"), name=f"edital-{slug}.pdf"),
        )

        apps = [self._application(candidates[i], process) for i in applicants]

        for n, app in enumerate(apps[:stage1_done]):
            self._stage1(app, admin, rng, rejected=(n == reject_index and reject_index is not None))
        eligible = [a for a in apps[:stage1_done] if a.status != AppStatus.REJECTED]
        for app in eligible[:stage2_done]:
            self._stage2(app, process, admin, rng)

        if final_status:
            ApplicationService().generate_ranking_and_set_winners(process, admin)
            winners = list(process.enrollments.filter(is_winner=True).order_by("rank_position"))
            if winners:  # 1º aceitou, demais seguem como convocados/pendentes
                winners[0].winner_status = WinnerStatus.ACCEPTED
                winners[0].save(update_fields=["winner_status"])
            process.status = final_status
            process.results_published_at = timezone.now() - timedelta(days=50)
            process.save()

        self.stdout.write(self.style.SUCCESS(f"+ {slug}: {len(apps)} inscrições ({process.status})"))

    def _application(self, candidate, process) -> Application:
        doc = lambda label: ContentFile(_pdf(f"{label} - {candidate.name}"), name=f"{label}.pdf")  # noqa: E731
        return Application.objects.create(
            candidate=candidate, selection_process=process, status=AppStatus.PENDING,
            identity_document=doc("identidade"), school_records=doc("historico"),
            vitae_curriculum=doc("curriculo"), frequency_statement=doc("frequencia"),
            portfolio_link=("https://exemplo.demo/portfolio" if process.include_portfolio_in_score else None),
        )

    def _stage1(self, app, admin, rng, rejected):
        score = lambda: round(rng.uniform(5.5, 10), 1)  # noqa: E731
        ev = Stage1Evaluation(
            application=app, evaluated_by=admin,
            identity_document_valid=not rejected, school_records_valid=True, vitae_curriculum_valid=True,
            frequency_statement_valid=True,
            portfolio_link_valid=True if app.selection_process.include_portfolio_in_score else None,
            identity_document_rejection_reason="Documento ilegível (demo)." if rejected else None,
            curriculum_score=score(), school_records_score=score(),
            portfolio_score=score() if app.selection_process.include_portfolio_in_score else None,
            notes="Avaliação gerada pelo seed de demonstração.",
        )
        ev.save()
        if rejected:  # mesma regra de ApplicationService._update_application_status_based_on_stage1
            app.status = AppStatus.REJECTED
            app.save(update_fields=["status"])

    def _stage2(self, app, process, admin, rng):
        Stage2Evaluation(
            application=app, evaluated_by=admin,
            interview_score=round(rng.uniform(5.5, 10), 1),
            essay_score=round(rng.uniform(5.5, 10), 1) if process.has_essay else None,
            interview_notes="Boa comunicação e domínio técnico (demo).",
        ).save()

    # ---------------------------------------------------------------- summary
    def _summary(self):
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Dados de demonstração prontos."))
        self.stdout.write(f"  Admin:      {ADMIN_USERNAME} / {ADMIN_PASSWORD}   (/auth/login-admin)")
        self.stdout.write(f"  Candidatos: <e-mail>@{DEMO_DOMAIN} / {CANDIDATE_PASSWORD}   (/auth/login-candidato)")
        for name, local in CANDIDATES:
            flag = "  [e-mail NÃO verificado]" if local == CANDIDATES[UNVERIFIED_INDEX][1] else ""
            self.stdout.write(f"    {local}@{DEMO_DOMAIN}{flag}")
