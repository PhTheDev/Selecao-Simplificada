from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .application.models import Application
from .selectionprocess.cache_utils import bump_selection_process_cache_version


@receiver(post_save, sender=Application)
@receiver(post_delete, sender=Application)
def bump_selection_process_cache_on_enrollment_change(sender, **kwargs):
    """Nova/remoção de inscrição altera `enrollments_count` exposto na API."""
    bump_selection_process_cache_version()
