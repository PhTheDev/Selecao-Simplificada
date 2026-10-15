import pytest
from rest_framework.exceptions import ValidationError

from selection.application.choices import Status
from selection.application.services import ApplicationService


@pytest.mark.django_db
class TestStage1RejectionForMissingScoreDocuments:
    def test_rejects_when_portfolio_missing_and_required_for_score(
        self,
        selection_process,
        application_factory,
        admin_user,
    ):
        selection_process.include_portfolio_in_score = True
        selection_process.save(update_fields=["include_portfolio_in_score"])

        app = application_factory()
        app.portfolio_link = None
        app.save(update_fields=["portfolio_link"])

        service = ApplicationService()
        payload = {
            "identity_document_valid": True,
            "school_records_valid": True,
            "vitae_curriculum_valid": True,
            "portfolio_link_valid": False,
            "portfolio_link_rejection_reason": "Não colocou portfólio",
        }

        updated = service.create_or_update_stage1_evaluation(app, payload, admin_user)

        assert updated.status == Status.REJECTED

    def test_does_not_auto_reject_when_portfolio_present_but_rejected(
        self,
        selection_process,
        application_factory,
        admin_user,
    ):
        selection_process.include_portfolio_in_score = True
        selection_process.save(update_fields=["include_portfolio_in_score"])

        app = application_factory(status=Status.PENDING)

        service = ApplicationService()
        payload = {
            "identity_document_valid": True,
            "school_records_valid": True,
            "vitae_curriculum_valid": True,
            "portfolio_link_valid": False,
            "portfolio_link_rejection_reason": "Portfólio inadequado",
        }

        updated = service.create_or_update_stage1_evaluation(app, payload, admin_user)

        assert updated.status == Status.PENDING

    def test_rejects_when_certificates_missing_and_required_for_score(
        self,
        selection_process,
        application_factory,
        admin_user,
    ):
        selection_process.include_certificates_in_score = True
        selection_process.save(update_fields=["include_certificates_in_score"])

        app = application_factory()
        app.course_certificates = None
        app.save(update_fields=["course_certificates"])

        service = ApplicationService()
        payload = {
            "identity_document_valid": True,
            "school_records_valid": True,
            "vitae_curriculum_valid": True,
            "course_certificates_valid": False,
            "course_certificates_rejection_reason": "Não enviou certificados",
        }

        updated = service.create_or_update_stage1_evaluation(app, payload, admin_user)

        assert updated.status == Status.REJECTED

    def test_does_not_auto_reject_when_certificates_present_but_rejected(
        self,
        selection_process,
        application_factory,
        admin_user,
    ):
        selection_process.include_certificates_in_score = True
        selection_process.save(update_fields=["include_certificates_in_score"])

        app = application_factory(status=Status.PENDING)

        service = ApplicationService()
        payload = {
            "identity_document_valid": True,
            "school_records_valid": True,
            "vitae_curriculum_valid": True,
            "course_certificates_valid": False,
            "course_certificates_rejection_reason": "Certificados inválidos",
        }

        updated = service.create_or_update_stage1_evaluation(app, payload, admin_user)

        assert updated.status == Status.PENDING

    def test_requires_rejection_reason_when_portfolio_missing_and_required_for_score(
        self,
        selection_process,
        application_factory,
        admin_user,
    ):
        selection_process.include_portfolio_in_score = True
        selection_process.save(update_fields=["include_portfolio_in_score"])

        app = application_factory()
        app.portfolio_link = None
        app.save(update_fields=["portfolio_link"])

        service = ApplicationService()
        payload = {
            "identity_document_valid": True,
            "school_records_valid": True,
            "vitae_curriculum_valid": True,
            "portfolio_link_valid": False,
            "portfolio_link_rejection_reason": "",
        }

        with pytest.raises(ValidationError):
            service.create_or_update_stage1_evaluation(app, payload, admin_user)
