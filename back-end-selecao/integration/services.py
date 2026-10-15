from collections import defaultdict
from datetime import datetime, time

from django.contrib.auth.models import User
from django.utils import timezone

from integration.models import ActivityType, IntegrationActivity
from selection.selectionprocess.models import SelectionProcess


def _parse_date_param(value: str | None, *, end_of_day: bool = False) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None

    moment = time.max if end_of_day else time.min
    dt = datetime.combine(parsed, moment)
    if timezone.is_naive(dt):
        return timezone.make_aware(dt, timezone.get_current_timezone())
    return dt


def _user_has_matricula(user: User) -> bool:
    profile = getattr(user, "administrator_profile", None)
    return bool(profile and (profile.matricula or "").strip())


def _serialize_user(user: User) -> dict:
    profile = user.administrator_profile
    return {
        "id": user.id,
        "matricula": profile.matricula,
        "email": user.email,
        "name": user.get_full_name() or user.username,
    }


def _activity_in_range(created_at, since_dt, until_dt) -> bool:
    if since_dt and created_at < since_dt:
        return False
    if until_dt and created_at > until_dt:
        return False
    return True


def build_activities_by_user(since: str | None = None, until: str | None = None) -> list[dict]:
    since_dt = _parse_date_param(since)
    until_dt = _parse_date_param(until, end_of_day=True)

    grouped: dict[int, dict] = defaultdict(lambda: {"user": None, "activities": []})

    processes = (
        SelectionProcess.objects.filter(created_by__isnull=False)
        .select_related("created_by", "created_by__administrator_profile")
    )
    for process in processes:
        user = process.created_by
        if not user or not _user_has_matricula(user):
            continue
        created_at = process.created_at
        if not _activity_in_range(created_at, since_dt, until_dt):
            continue

        entry = grouped[user.id]
        entry["user"] = _serialize_user(user)
        entry["activities"].append({
            "activity": f"Criação do processo seletivo {process.title}",
            "created_at": timezone.localtime(created_at).isoformat(),
        })

    integration_qs = (
        IntegrationActivity.objects.filter(activity_type=ActivityType.PROCESS_ANALYSIS)
        .select_related("selection_process")
        .prefetch_related("users", "users__administrator_profile")
    )
    for integration_activity in integration_qs:
        created_at = integration_activity.created_at
        if not _activity_in_range(created_at, since_dt, until_dt):
            continue

        for user in integration_activity.users.all():
            if not _user_has_matricula(user):
                continue

            entry = grouped[user.id]
            entry["user"] = _serialize_user(user)
            entry["activities"].append({
                "activity": integration_activity.activity,
                "created_at": timezone.localtime(created_at).isoformat(),
            })

    result = []
    for data in grouped.values():
        if not data["user"] or not data["activities"]:
            continue
        data["activities"].sort(key=lambda item: item["created_at"])
        result.append(data)

    result.sort(key=lambda item: item["user"]["matricula"])
    return result


def record_process_analysis_activity(process, user_ids: set[int]) -> IntegrationActivity:
    activity, _created = IntegrationActivity.objects.update_or_create(
        selection_process=process,
        activity_type=ActivityType.PROCESS_ANALYSIS,
        defaults={
            "activity": f"Análise do processo seletivo {process.title}",
        },
    )
    activity.users.set(User.objects.filter(id__in=user_ids))
    IntegrationActivity.objects.filter(pk=activity.pk).update(created_at=timezone.now())
    activity.refresh_from_db()
    return activity
