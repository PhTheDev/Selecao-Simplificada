from django.db import models # type: ignore
from django.utils.translation import gettext_lazy as _ # type: ignore

# Choice para o genero do candidato
class Gender(models.TextChoices):
    MALE = "M", _("Masculino")
    FEMALE = "F", _("Feminino")
    NOT_INFORMED = "I", _("Nao informado")
    OTHER = "O", _("Outro")

# Choice para o periodo do candidato
class Period(models.TextChoices):
    MORNING = "M", _("Matutino")
    AFTERNOON = "T", _("Vespertino")
    NIGHT = "N", _("Noturno")
    INTEGRAL = "I", _("Integral")

# Choice para o semestre do candidato
class Semester(models.TextChoices):
    FIRST = "1", _("1º Semestre")
    SECOND = "2", _("2º Semestre")
    THIRD = "3", _("3º Semestre")
    FOURTH = "4", _("4º Semestre")
    FIFTH = "5", _("5º Semestre")
    SIXTH = "6", _("6º Semestre")
    SEVENTH = "7", _("7º Semestre")
    EIGHTH = "8", _("8º Semestre")
    NINTH = "9", _("9º Semestre")
    TENTH = "10", _("10º Semestre")