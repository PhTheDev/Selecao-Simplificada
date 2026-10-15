import pytest

from selection.application.models import Application
from selection.application.services import ApplicationService
from selection.application.choices import Status


@pytest.mark.django_db
class TestCalcFinalScore:
    def test_calc_final_score_returns_weighted_global_score_81(
        self,
        selection_process,
        application_factory,
        evaluation_factory,
    ):
        # Arrange
        app = application_factory()
        evaluation_factory(
            app,
            school_records_score=80,
            portfolio_score=90,
            interview_score=50,
            essay_score=None,
        )
        service = ApplicationService()

        # Act
        final_score = service._calc_final_score(app, selection_process)

        # Assert
        assert final_score == pytest.approx(81.0)

    @pytest.mark.parametrize(
        ("school_records_weight", "portfolio_weight", "interview_weight", "school_score", "portfolio_score", "expected"),
        [
            (80, 20, 0, 80, 90, 82.0),
        ],
    )
    def test_calc_final_score_handles_missing_metric_as_zero_and_matches_case_82(
        self,
        selection_process,
        application_factory,
        evaluation_factory,
        school_records_weight,
        portfolio_weight,
        interview_weight,
        school_score,
        portfolio_score,
        expected,
    ):
        # Arrange
        selection_process.weight_school_records = school_records_weight
        selection_process.weight_portfolio = portfolio_weight
        selection_process.weight_interview = interview_weight
        selection_process.save(update_fields=["weight_school_records", "weight_portfolio", "weight_interview"])

        app = application_factory()
        evaluation_factory(
            app,
            school_records_score=school_score,
            portfolio_score=portfolio_score,
            interview_score=None,
        )
        service = ApplicationService()

        # Act
        final_score = service._calc_final_score(app, selection_process)

        # Assert
        assert final_score == pytest.approx(expected)

    def test_calc_final_score_does_not_break_when_process_has_no_essay(
        self,
        selection_process,
        application_factory,
        evaluation_factory,
    ):
        # Arrange
        selection_process.has_essay = False
        selection_process.weight_essay = 0
        selection_process.save(update_fields=["has_essay", "weight_essay"])

        app = application_factory()
        evaluation_factory(app, school_records_score=80, portfolio_score=90, interview_score=50, essay_score=99)
        service = ApplicationService()

        # Act
        final_score = service._calc_final_score(app, selection_process)

        # Assert
        assert final_score == pytest.approx(81.0)


@pytest.mark.django_db
class TestGenerateRankingAndSetWinners:
    def test_generate_ranking_orders_by_final_score_and_persists_average_score(
        self,
        admin_user,
        selection_process,
        application_factory,
        evaluation_factory,
    ):
        # Arrange
        app_top = application_factory(status=Status.PENDING)
        app_second = application_factory(status=Status.PENDING)
        app_last = application_factory(status=Status.PENDING)

        evaluation_factory(app_top, school_records_score=80, portfolio_score=90, interview_score=50)      # 81.00
        evaluation_factory(app_second, school_records_score=80, portfolio_score=90, interview_score=40)   # 79.00
        evaluation_factory(app_last, school_records_score=50, portfolio_score=50, interview_score=50)     # 50.00

        selection_process.number_vacancies = 2
        selection_process.save(update_fields=["number_vacancies"])

        service = ApplicationService()

        # Act
        service.generate_ranking_and_set_winners(selection_process, admin_user)

        # Assert
        ranked = list(
            Application.objects.filter(selection_process=selection_process).order_by("rank_position")
        )
        assert [app.id for app in ranked] == [app_top.id, app_second.id, app_last.id]
        assert [float(app.average_score) for app in ranked] == [81.00, 79.00, 50.00]
        assert [app.is_winner for app in ranked] == [True, True, False]
