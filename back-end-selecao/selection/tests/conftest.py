import datetime as dt

import pytest
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile

from selection.application.models import Application
from selection.candidate.models import Candidate
from selection.evaluation.models import Stage1Evaluation, Stage2Evaluation
from selection.selectionprocess.models import SelectionProcess


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username="admin",
        email="admin@example.com",
        password="admin123",
        is_staff=True,
    )


@pytest.fixture
def selection_process(db):
    return SelectionProcess.objects.create(
        title="Processo Teste",
        subtitle="Sub",
        description="Descricao",
        course="ADS",
        slug="processo-teste",
        beginning_date=dt.date(2026, 1, 1),
        ending_date=dt.date(2026, 1, 31),
        period_accepted="1-8",
        bout="M",
        weekly_workload="30h",
        salary="1000.00",
        number_vacancies=1,
        local="Cidade Exemplo",
        requirements="Req",
        benefits="Benef",
        status="in_analysis",
        analysis_stage="analysis_completed",
        has_interview=True,
        has_essay=True,
        include_curriculum_in_score=False,
        include_portfolio_in_score=True,
        include_certificates_in_score=False,
        weight_curriculum=0,
        weight_school_records=10,
        weight_certificates=0,
        weight_portfolio=70,
        weight_interview=20,
        weight_essay=0,
    )


@pytest.fixture
def candidate_factory(db):
    counter = {"value": 0}

    def _factory(name_prefix="Candidato"):
        counter["value"] += 1
        idx = counter["value"]
        return Candidate.objects.create(
            name=f"{name_prefix} {idx}",
            email=f"candidate{idx}@example.com",
            email_verified=True,
        )

    return _factory


def _dummy_pdf(name: str):
    return SimpleUploadedFile(name, b"%PDF-1.4 test content", content_type="application/pdf")


@pytest.fixture
def application_factory(db, selection_process, candidate_factory):
    def _factory(*, candidate=None, status="pending"):
        candidate = candidate or candidate_factory()
        return Application.objects.create(
            candidate=candidate,
            selection_process=selection_process,
            status=status,
            identity_document=_dummy_pdf("id.pdf"),
            school_records=_dummy_pdf("school.pdf"),
            vitae_curriculum=_dummy_pdf("cv.pdf"),
            frequency_statement=_dummy_pdf("freq.pdf"),
            course_certificates=_dummy_pdf("cert.pdf"),
            portfolio_link="https://example.com/portfolio",
        )

    return _factory


@pytest.fixture
def evaluation_factory(db):
    def _factory(
        application,
        *,
        school_records_score=None,
        portfolio_score=None,
        interview_score=None,
        essay_score=None,
    ):
        stage1 = Stage1Evaluation.objects.create(
            application=application,
            identity_document_valid=True,
            school_records_valid=True,
            vitae_curriculum_valid=True,
            school_records_score=school_records_score,
            portfolio_score=portfolio_score,
        )
        stage2 = Stage2Evaluation.objects.create(
            application=application,
            interview_score=interview_score,
            essay_score=essay_score,
        )
        return stage1, stage2

    return _factory
