import datetime as dt

import pytest
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile

from selection.application.models import Application
from selection.candidate.models import Candidate


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
def application_factory(db, selection_process_with_creator, candidate_factory):
    def _factory(*, candidate=None, status="pending"):
        candidate = candidate or candidate_factory()
        return Application.objects.create(
            candidate=candidate,
            selection_process=selection_process_with_creator,
            status=status,
            identity_document=_dummy_pdf("id.pdf"),
            school_records=_dummy_pdf("school.pdf"),
            vitae_curriculum=_dummy_pdf("cv.pdf"),
        )

    return _factory
