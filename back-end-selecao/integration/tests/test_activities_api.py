import datetime as dt

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient

from administrator.models import AdministratorProfile
from integration.models import IntegrationActivity, IntegrationToken
from selection.application.models import Application
from selection.application.services import ApplicationService
from selection.evaluation.models import Stage1Evaluation, Stage2Evaluation
from selection.selectionprocess.models import SelectionProcess


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def sgi_token(db):
    return IntegrationToken.objects.create(
        name="Integracao teste",
        token="test-sgi-integration-token",
        is_active=True,
    )


@pytest.fixture
def admin_with_matricula(db):
    user = User.objects.create_user(
        username="sgi_admin",
        email="sgi_admin@example.com",
        password="Admin123!@#",
        first_name="Admin",
        last_name="Externo",
        is_staff=True,
    )
    AdministratorProfile.objects.create(
        user=user,
        role="super_admin",
        matricula="133755",
        is_active=True,
    )
    return user


@pytest.fixture
def second_evaluator(db):
    user = User.objects.create_user(
        username="evaluator2",
        email="evaluator2@example.com",
        password="Admin123!@#",
        first_name="Maria",
        last_name="Avaliadora",
        is_staff=True,
    )
    AdministratorProfile.objects.create(
        user=user,
        role="super_admin",
        matricula="133756",
        is_active=True,
    )
    return user


@pytest.fixture
def admin_without_matricula(db):
    user = User.objects.create_user(
        username="sem_matricula",
        email="sem@example.com",
        password="Admin123!@#",
        is_staff=True,
    )
    AdministratorProfile.objects.create(
        user=user,
        role="super_admin",
        matricula=None,
        is_active=True,
    )
    return user


@pytest.fixture
def selection_process_with_creator(db, admin_with_matricula):
    return SelectionProcess.objects.create(
        title="Estágio 2025",
        course="Administração",
        slug="estagio-2025",
        beginning_date=dt.date(2026, 1, 1),
        ending_date=dt.date(2026, 1, 31),
        period_accepted="1-8",
        bout="M",
        weekly_workload="30h",
        status="in_analysis",
        analysis_stage="analysis_completed",
        has_interview=True,
        has_essay=False,
        include_curriculum_in_score=False,
        include_portfolio_in_score=False,
        include_certificates_in_score=False,
        weight_curriculum=0,
        weight_school_records=80,
        weight_certificates=0,
        weight_portfolio=0,
        weight_interview=20,
        weight_essay=0,
        created_by=admin_with_matricula,
    )


def _auth_headers(token: str | None = None):
    value = token or "test-sgi-integration-token"
    return {"HTTP_AUTHORIZATION": f"Bearer {value}"}


@pytest.mark.django_db
def test_integration_activities_requires_token(api_client):
    response = api_client.get(reverse("integration-activities"))
    assert response.status_code in (401, 403)
    assert "detail" in response.data


@pytest.mark.django_db
def test_integration_activities_rejects_invalid_token(api_client):
    response = api_client.get(reverse("integration-activities"), **_auth_headers("invalid"))
    assert response.status_code in (401, 403)
    assert "detail" in response.data


@pytest.mark.django_db
def test_integration_activities_returns_process_creation(api_client, selection_process_with_creator):
    response = api_client.get(reverse("integration-activities"), **_auth_headers())
    assert response.status_code == 200

    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["user"]["matricula"] == "133755"
    assert payload[0]["activities"][0]["activity"] == "Criação do processo seletivo Estágio 2025"


@pytest.mark.django_db
def test_integration_activities_omits_users_without_matricula(
    api_client,
    selection_process_with_creator,
    admin_without_matricula,
):
    selection_process_with_creator.created_by = admin_without_matricula
    selection_process_with_creator.save(update_fields=["created_by"])

    response = api_client.get(reverse("integration-activities"), **_auth_headers())
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.django_db
def test_integration_activities_returns_analysis_with_multiple_evaluators(
    api_client,
    selection_process_with_creator,
    admin_with_matricula,
    second_evaluator,
    candidate_factory,
):
    candidate = candidate_factory()
    application = Application.objects.create(
        candidate=candidate,
        selection_process=selection_process_with_creator,
        status="pending",
    )
    Stage1Evaluation.objects.create(
        application=application,
        identity_document_valid=True,
        school_records_valid=True,
        vitae_curriculum_valid=True,
        evaluated_by=admin_with_matricula,
    )
    Stage2Evaluation.objects.create(
        application=application,
        interview_score=8,
        evaluated_by=second_evaluator,
    )

    service = ApplicationService()
    service.generate_ranking_and_set_winners(selection_process_with_creator, admin_with_matricula)

    response = api_client.get(reverse("integration-activities"), **_auth_headers())
    assert response.status_code == 200

    payload = response.json()
    matriculas = {entry["user"]["matricula"] for entry in payload}
    assert matriculas == {"133755", "133756"}

    analysis_entries = [
        activity
        for entry in payload
        for activity in entry["activities"]
        if activity["activity"].startswith("Análise do processo seletivo")
    ]
    assert len(analysis_entries) == 2


@pytest.mark.django_db
def test_generate_winners_does_not_duplicate_analysis_activity(
    selection_process_with_creator,
    admin_with_matricula,
    candidate_factory,
):
    candidate = candidate_factory()
    application = Application.objects.create(
        candidate=candidate,
        selection_process=selection_process_with_creator,
        status="pending",
    )
    Stage1Evaluation.objects.create(
        application=application,
        identity_document_valid=True,
        school_records_valid=True,
        vitae_curriculum_valid=True,
        evaluated_by=admin_with_matricula,
    )
    Stage2Evaluation.objects.create(
        application=application,
        interview_score=8,
        evaluated_by=admin_with_matricula,
    )

    service = ApplicationService()
    service.generate_ranking_and_set_winners(selection_process_with_creator, admin_with_matricula)
    service.generate_ranking_and_set_winners(selection_process_with_creator, admin_with_matricula)

    assert IntegrationActivity.objects.filter(
        selection_process=selection_process_with_creator
    ).count() == 1


@pytest.mark.django_db
def test_integration_activities_supports_since_filter(api_client, selection_process_with_creator):
    future = (dt.date.today() + dt.timedelta(days=30)).isoformat()
    response = api_client.get(
        reverse("integration-activities"),
        {"since": future},
        **_auth_headers(),
    )
    assert response.status_code == 200
    assert response.json() == []
