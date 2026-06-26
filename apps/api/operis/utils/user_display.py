from __future__ import annotations

from operis.db.models import User


def is_auto_generated_display_name(display_name: str | None, email: str | None) -> bool:
    """True quando display_name é só o handle do e-mail (default do User.save)."""
    if not display_name or not email:
        return False
    handle = email.split("@")[0].strip().lower()
    return display_name.strip().lower() == handle


def user_display_label(user) -> str:
    """Nome legível para alertas, exports e integrações."""
    if user is None:
        return "—"

    display = (getattr(user, "display_name", None) or "").strip()
    full = (getattr(user, "full_name", None) or "").strip()
    if not full:
        first = (getattr(user, "first_name", None) or "").strip()
        last = (getattr(user, "last_name", None) or "").strip()
        full = f"{first} {last}".strip()

    email = (getattr(user, "email", None) or "").strip()

    if full and is_auto_generated_display_name(display, email):
        return full
    if display:
        return display
    if full:
        return full
    return email or "—"


def display_name_from_identity(*, first_name: str = "", last_name: str = "", email: str | None = None) -> str:
    """Nome inicial para signup OAuth — prioriza nome completo do IdP."""
    full = f"{first_name} {last_name}".strip()
    if full:
        return full
    if email:
        return User.get_display_name(email)
    return ""
