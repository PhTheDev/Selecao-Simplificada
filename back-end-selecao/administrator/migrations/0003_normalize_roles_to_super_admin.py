from django.db import migrations


def normalize_roles_to_super_admin(apps, schema_editor):
    AdministratorProfile = apps.get_model("administrator", "AdministratorProfile")
    AdministratorProfile.objects.exclude(role="super_admin").update(role="super_admin")


class Migration(migrations.Migration):

    dependencies = [
        ("administrator", "0002_alter_administratorprofile_role"),
    ]

    operations = [
        migrations.RunPython(normalize_roles_to_super_admin, migrations.RunPython.noop),
    ]
