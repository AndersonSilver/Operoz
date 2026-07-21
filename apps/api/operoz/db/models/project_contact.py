from django.db import models

from .base import BaseModel


class ProjectContactCategory(models.TextChoices):
    RESPONSIBLE = "responsible", "Responsável"
    STAKEHOLDER = "stakeholder", "Stakeholder"


class ProjectContact(BaseModel):
    """Contato externo de um projeto (equipe responsável ou stakeholder do cliente)."""

    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="contacts")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="project_contacts")
    category = models.CharField(max_length=16, choices=ProjectContactCategory.choices)
    full_name = models.CharField(max_length=255, verbose_name="Nome completo")
    email = models.EmailField(blank=True, default="")
    role = models.CharField(max_length=255, blank=True, default="", verbose_name="Cargo")
    whatsapp = models.CharField(max_length=32, blank=True, default="")
    is_lead = models.BooleanField(default=False)
    sort_order = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Project Contact"
        verbose_name_plural = "Project Contacts"
        db_table = "project_contacts"
        ordering = ("category", "sort_order", "created_at")

    def save(self, *args, **kwargs):
        if self._state.adding:
            last = ProjectContact.objects.filter(project=self.project, category=self.category).aggregate(
                largest=models.Max("sort_order")
            )["largest"]
            if last is not None:
                self.sort_order = last + 10000

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.category}) <{self.project_id}>"
