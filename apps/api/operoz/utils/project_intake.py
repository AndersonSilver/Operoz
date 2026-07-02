from operoz.db.models import Intake, Project


def get_or_create_default_project_intake(project: Project) -> Intake:
    """Ensure the project has a default Intake container for intake/support tickets."""
    intake = Intake.objects.filter(project=project, is_default=True, deleted_at__isnull=True).first()
    if intake:
        return intake

    intake = Intake.objects.filter(project=project, deleted_at__isnull=True).first()
    if intake:
        if not intake.is_default:
            intake.is_default = True
            intake.save(update_fields=["is_default", "updated_at"])
        return intake

    return Intake.objects.create(
        name=f"{project.name} Intake",
        project=project,
        is_default=True,
    )
