from django.urls import path

from integration.views import integration_activities

urlpatterns = [
    path("activities/", integration_activities, name="integration-activities"),
]
