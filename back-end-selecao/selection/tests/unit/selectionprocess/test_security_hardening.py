import datetime as dt

import pytest
from django.contrib.auth.models import User
from django.core.exceptions import ImproperlyConfigured
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from core.settings import _resolve_db_password
from selection.application.models import Application
from selection.application.serializers import ApplicationSerializer
from selection.candidate.models import Candidate
from selection.selectionprocess.models import NoticeDocument, SelectionProcess


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_enrollments_requires_admin(api_client, selection_process, application_factory):
    application_factory()
    url = f"/api/selection/selection-processes/{selection_process.slug}/enrollments/"

    anon = api_client.get(url)
    assert anon.status_code in (401, 403)

    user = User.objects.create_user(username="cand", password="x", is_staff=False)
    api_client.force_authenticate(user=user)
    forbidden = api_client.get(url)
    assert forbidden.status_code == 403


@pytest.mark.django_db
def test_enrollments_ok_for_staff(api_client, admin_user, selection_process, application_factory):
    application_factory()
    url = f"/api/selection/selection-processes/{selection_process.slug}/enrollments/"
    api_client.force_authenticate(user=admin_user)
    response = api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) >= 1


@pytest.mark.django_db
def test_winners_requires_admin(api_client, selection_process, application_factory):
    application_factory(status="approved")
    url = f"/api/selection/selection-processes/{selection_process.id}/winners/"

    anon = api_client.get(url)
    assert anon.status_code in (401, 403)

    user = User.objects.create_user(username="cand2", password="x", is_staff=False)
    api_client.force_authenticate(user=user)
    forbidden = api_client.get(url)
    assert forbidden.status_code == 403


@pytest.mark.django_db
def test_winners_ok_for_staff(api_client, admin_user, selection_process, application_factory):
    application_factory(status="approved")
    url = f"/api/selection/selection-processes/{selection_process.id}/winners/"
    api_client.force_authenticate(user=admin_user)
    response = api_client.get(url)
    assert response.status_code == 200
    assert response.data["count"] >= 1


@pytest.mark.django_db
def test_media_public_notice_docs_anonymous(api_client, tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path
    relative = "notice_docs/2026/edital.pdf"
    default_storage.save(relative, ContentFile(b"%PDF public"))
    response = api_client.get(f"/media/{relative}")
    assert response.status_code == 200


@pytest.mark.django_db
def test_media_private_candidate_doc_forbidden_anonymous(api_client, tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path
    relative = "candidate_1/identity_documents/id.pdf"
    default_storage.save(relative, ContentFile(b"%PDF private"))
    response = api_client.get(f"/media/{relative}")
    assert response.status_code == 403


@pytest.mark.django_db
def test_media_private_candidate_doc_ok_for_staff(api_client, admin_user, tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path
    relative = "candidate_99/identity_documents/id.pdf"
    default_storage.save(relative, ContentFile(b"%PDF private"))
    api_client.force_authenticate(user=admin_user)
    response = api_client.get(f"/media/{relative}")
    assert response.status_code == 200


@pytest.mark.django_db
def test_portfolio_link_rejects_javascript_scheme():
    from rest_framework.exceptions import ValidationError

    ser = ApplicationSerializer()
    with pytest.raises(ValidationError) as exc:
        ser.validate({"portfolio_link": "javascript:alert(document.cookie)"})
    assert "portfolio_link" in exc.value.detail


@pytest.mark.django_db
def test_portfolio_link_accepts_https():
    ser = ApplicationSerializer()
    result = ser.validate({"portfolio_link": "https://portfolio.example.com/me"})
    assert result["portfolio_link"] == "https://portfolio.example.com/me"


def _process_kwargs(*, slug: str, is_active: bool = True) -> dict:
    return {
        "title": f"Processo {slug}",
        "subtitle": "Sub",
        "description": "Descricao",
        "course": "ADS",
        "slug": slug,
        "beginning_date": dt.date(2026, 1, 1),
        "ending_date": dt.date(2026, 1, 31),
        "period_accepted": "1-8",
        "bout": "M",
        "weekly_workload": "30h",
        "salary": "1000.00",
        "number_vacancies": 1,
        "local": "Goiania",
        "requirements": "Req",
        "benefits": "Benef",
        "status": "in_analysis",
        "analysis_stage": "analysis_completed",
        "has_interview": True,
        "has_essay": True,
        "include_curriculum_in_score": False,
        "include_portfolio_in_score": True,
        "include_certificates_in_score": False,
        "weight_curriculum": 0,
        "weight_school_records": 10,
        "weight_certificates": 0,
        "weight_portfolio": 70,
        "weight_interview": 20,
        "weight_essay": 0,
        "is_active": is_active,
    }


def _list_ids(response):
    data = response.data
    if isinstance(data, dict) and "results" in data:
        return {item["id"] for item in data["results"]}
    return {item["id"] for item in data}


@pytest.mark.django_db
def test_notice_documents_hides_inactive_process_for_anonymous(api_client, selection_process):
    inactive = SelectionProcess.objects.create(**_process_kwargs(slug="proc-inativo", is_active=False))
    active_doc = NoticeDocument.objects.create(
        selection_process=selection_process,
        file=SimpleUploadedFile("ativo.pdf", b"%PDF active"),
        name="Edital ativo",
    )
    inactive_doc = NoticeDocument.objects.create(
        selection_process=inactive,
        file=SimpleUploadedFile("inativo.pdf", b"%PDF inactive"),
        name="Edital inativo",
    )

    response = api_client.get("/api/selection/notice-documents/")
    assert response.status_code == 200
    ids = _list_ids(response)
    assert active_doc.id in ids
    assert inactive_doc.id not in ids


@pytest.mark.django_db
def test_notice_documents_staff_sees_inactive_process(api_client, admin_user, selection_process):
    inactive = SelectionProcess.objects.create(**_process_kwargs(slug="proc-inativo-staff", is_active=False))
    inactive_doc = NoticeDocument.objects.create(
        selection_process=inactive,
        file=SimpleUploadedFile("inativo-staff.pdf", b"%PDF inactive"),
        name="Edital inativo staff",
    )

    api_client.force_authenticate(user=admin_user)
    response = api_client.get("/api/selection/notice-documents/")
    assert response.status_code == 200
    assert inactive_doc.id in _list_ids(response)


@pytest.mark.django_db
def test_patch_application_cannot_change_selection_process(
    api_client, selection_process, application_factory, candidate_factory
):
    candidate = candidate_factory()
    candidate.create_user_account()
    application = application_factory(candidate=candidate)
    other_process = SelectionProcess.objects.create(**_process_kwargs(slug="outro-processo"))

    original_process_id = application.selection_process_id
    api_client.force_authenticate(user=candidate.user)
    response = api_client.patch(
        f"/api/selection/applications/{application.id}/",
        {
            "selection_process_id": other_process.id,
            "portfolio_link": "https://example.com/updated",
        },
        format="json",
    )

    assert response.status_code == 200
    application.refresh_from_db()
    assert application.selection_process_id == original_process_id
    assert application.portfolio_link == "https://example.com/updated"


def test_resolve_db_password_rejects_insecure_when_not_debug():
    with pytest.raises(ImproperlyConfigured):
        _resolve_db_password(False, "selecao-local_pass")
    with pytest.raises(ImproperlyConfigured):
        _resolve_db_password(False, "")
    with pytest.raises(ImproperlyConfigured):
        _resolve_db_password(False, None)


def test_resolve_db_password_allows_lab_default_when_debug():
    assert _resolve_db_password(True, "") == "selecao-local_pass"
    assert _resolve_db_password(True, None) == "selecao-local_pass"
