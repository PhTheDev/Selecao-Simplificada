import pytest

from selection.application.models import Application
from selection.selectionprocess.services import SelectionProcessService


@pytest.mark.django_db
def test_select_winners_uses_global_metric_rule_and_persists_rounded_average_score(
    admin_user,
    selection_process,
    application_factory,
    evaluation_factory,
):
    # Arrange
    app_first = application_factory()
    app_second = application_factory()

    # Mantem regra global prevista:
    # app_first => 81.00
    # app_second => 82.00
    evaluation_factory(app_first, school_records_score=70, portfolio_score=50, interview_score=50)

    selection_process.weight_school_records = 80
    selection_process.weight_portfolio = 20
    selection_process.weight_interview = 0
    selection_process.number_vacancies = 1
    selection_process.save(
        update_fields=[
            "weight_school_records",
            "weight_portfolio",
            "weight_interview",
            "number_vacancies",
        ]
    )
    evaluation_factory(app_second, school_records_score=80, portfolio_score=90, interview_score=0)

    service = SelectionProcessService()

    # Act
    winners = service.select_winners(selection_process.id, admin_user)

    # Assert
    assert [winner.id for winner in winners] == [app_second.id]
    app_first.refresh_from_db()
    app_second.refresh_from_db()
    assert float(app_second.average_score) == 82.00
    assert app_second.status == "approved"
    assert app_first.status != "approved"


@pytest.mark.django_db
def test_select_winners_keeps_process_without_essay_working(
    admin_user,
    selection_process,
    application_factory,
    evaluation_factory,
):
    # Arrange
    selection_process.has_essay = False
    selection_process.weight_essay = 0
    selection_process.number_vacancies = 1
    selection_process.save(update_fields=["has_essay", "weight_essay", "number_vacancies"])

    app = application_factory()
    evaluation_factory(app, school_records_score=70, portfolio_score=60, interview_score=90, essay_score=None)
    service = SelectionProcessService()

    # Act
    winners = service.select_winners(selection_process.id, admin_user)

    # Assert
    assert len(winners) == 1
    assert winners[0].id == app.id
    assert float(Application.objects.get(id=app.id).average_score) > 0


@pytest.mark.django_db
def test_select_winners_does_not_crash_when_stage2_total_score_is_none(
    admin_user,
    selection_process,
    application_factory,
    evaluation_factory,
):
    # Arrange
    app = application_factory()
    # Sem notas da etapa 2 => total_score da etapa 2 fica None.
    evaluation_factory(app, school_records_score=85, portfolio_score=80, interview_score=None, essay_score=None)
    service = SelectionProcessService()

    # Act
    winners = service.select_winners(selection_process.id, admin_user)

    # Assert
    assert len(winners) == 1
    assert winners[0].id == app.id
    app.refresh_from_db()
    assert app.status == "approved"
