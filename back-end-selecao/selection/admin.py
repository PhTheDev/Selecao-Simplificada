from django.contrib import admin
from .application.models import Application
from .candidate.models import PasswordResetToken
from .evaluation.models import Stage1Evaluation, Stage2Evaluation
from .selectionprocess.models import NoticeDocument, SelectionProcess

@admin.register(SelectionProcess)
class SelectionProcessAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "slug", "status", "is_active", "created_at")
    list_filter = ("is_active", "status", "has_interview", "has_essay", "created_at")
    search_fields = ("title", "subtitle", "slug", "course", "local")
    readonly_fields = ("created_at", "updated_at")


@admin.register(NoticeDocument)
class NoticeDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "selection_process", "order", "uploaded_at")
    list_filter = ("uploaded_at",)
    search_fields = ("name", "selection_process__title", "selection_process__slug")
    autocomplete_fields = ("selection_process",)
    readonly_fields = ("uploaded_at",)


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "candidate",
        "selection_process",
        "status",
        "is_winner",
        "winner_status",
        "created_at",
    )
    list_filter = ("status", "is_winner", "winner_status", "created_at")
    search_fields = (
        "candidate__name",
        "candidate__email",
        "selection_process__title",
        "selection_process__slug",
    )
    raw_id_fields = ("candidate", "selection_process", "winner_updated_by")
    readonly_fields = ("created_at", "updated_at", "application_date", "winner_updated_at")


@admin.register(Stage1Evaluation)
class Stage1EvaluationAdmin(admin.ModelAdmin):
    list_display = ("id", "application", "total_score", "evaluated_at", "created_at")
    list_filter = ("evaluated_at", "created_at")
    search_fields = (
        "application__candidate__name",
        "application__candidate__email",
        "application__selection_process__title",
    )
    autocomplete_fields = ("application",)
    readonly_fields = ("created_at", "updated_at", "evaluated_at")


@admin.register(Stage2Evaluation)
class Stage2EvaluationAdmin(admin.ModelAdmin):
    list_display = ("id", "application", "total_score", "evaluated_at", "created_at")
    list_filter = ("evaluated_at", "created_at")
    search_fields = (
        "application__candidate__name",
        "application__candidate__email",
        "application__selection_process__title",
    )
    autocomplete_fields = ("application",)
    readonly_fields = ("created_at", "updated_at", "evaluated_at")


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ("id", "candidate", "used", "expires_at", "created_at")
    list_filter = ("used", "created_at", "expires_at")
    search_fields = ("candidate__name", "candidate__email")
    raw_id_fields = ("candidate",)
    readonly_fields = ("token", "created_at", "updated_at")

