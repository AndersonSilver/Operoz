import pytest

from operoz.utils.user_display import is_auto_generated_display_name, user_display_label


class _User:
    def __init__(self, *, display_name="", first_name="", last_name="", email=""):
        self.display_name = display_name
        self.first_name = first_name
        self.last_name = last_name
        self.email = email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


@pytest.mark.unit
def test_user_display_label_prefers_full_name_over_email_handle():
    user = _User(
        display_name="andersonsilver18",
        first_name="Anderson",
        last_name="Silveira",
        email="andersonsilver18@gmail.com",
    )
    assert user_display_label(user) == "Anderson Silveira"


@pytest.mark.unit
def test_user_display_label_keeps_custom_display_name():
    user = _User(
        display_name="Andy",
        first_name="Anderson",
        last_name="Silveira",
        email="andersonsilver18@gmail.com",
    )
    assert user_display_label(user) == "Andy"


@pytest.mark.unit
def test_is_auto_generated_display_name():
    assert is_auto_generated_display_name("andersonsilver18", "andersonsilver18@gmail.com") is True
    assert is_auto_generated_display_name("Andy", "andersonsilver18@gmail.com") is False
