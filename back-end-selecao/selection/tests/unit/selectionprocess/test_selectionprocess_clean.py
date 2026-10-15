import datetime as dt

import pytest
from django.core.exceptions import ValidationError

from selection.selectionprocess.models import SelectionProcess


def _base_process_kwargs():
    return {
        "title": "Processo clean",
        "subtitle": "Sub",
        "description": "Descricao",
        "course": "ADS",
        "slug": "processo-clean",
        "beginning_date": dt.date(2026, 1, 1),
        "ending_date": dt.date(2026, 1, 31),
        "period_accepted": "1-8",
        "bout": "M",
        "weekly_workload": "30h",
        "salary": "1000.00",
        "number_vacancies": 1,
        "local": "Cidade Exemplo",
        "requirements": "Req",
        "benefits": "Benef",
        "status": "created",
        "analysis_stage": "stage1_documents",
    }


@pytest.mark.django_db
def test_clean_passes_when_sum_of_active_global_weights_is_100():
    # Arrange
    process = SelectionProcess(
        **_base_process_kwargs(),
        include_curriculum_in_score=False,
        include_portfolio_in_score=True,
        include_certificates_in_score=False,
        has_interview=True,
        has_essay=True,
        weight_curriculum=0,
        weight_school_records=10,
        weight_portfolio=70,
        weight_interview=20,
        weight_essay=0,
        weight_certificates=0,
    )

    # Act / Assert
    process.full_clean()  # nao deve levantar erro


@pytest.mark.django_db
def test_clean_fails_when_sum_of_active_global_weights_is_not_100():
    # Arrange
    process = SelectionProcess(
        **_base_process_kwargs(),
        include_curriculum_in_score=True,
        include_portfolio_in_score=False,
        include_certificates_in_score=False,
        has_interview=True,
        has_essay=True,
        weight_curriculum=20,
        weight_school_records=20,
        weight_portfolio=0,
        weight_interview=20,
        weight_essay=20,
        weight_certificates=0,
    )

    # Act / Assert
    with pytest.raises(ValidationError):
        process.full_clean()


@pytest.mark.django_db
def test_clean_sets_essay_weight_to_zero_when_has_essay_is_false():
    # Arrange
    process = SelectionProcess(
        **_base_process_kwargs(),
        include_curriculum_in_score=False,
        include_portfolio_in_score=True,
        include_certificates_in_score=False,
        has_interview=True,
        has_essay=False,
        weight_curriculum=0,
        weight_school_records=40,
        weight_portfolio=30,
        weight_interview=30,
        weight_essay=40,
        weight_certificates=0,
    )

    # Act
    process.full_clean()

    # Assert
    assert process.weight_essay == 0
