import os
import uuid

import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from pytest_django.fixtures import django_db_setup

from operis.db.models import User, Workspace, WorkspaceMember
from operis.db.models.api import APIToken
from operis.license.models import Instance


def _patch_pgvector_test_db() -> None:
    """Enable pgvector before schema sync (--nomigrations) in pytest."""
    from django.db.backends.postgresql.creation import DatabaseCreation

    if getattr(DatabaseCreation, "_operis_pgvector_patched", False):
        return

    def create_test_db(self, verbosity=1, autoclobber=False, serialize=True, keepdb=False):
        from django.apps import apps
        from django.conf import settings
        from django.core.management import call_command

        test_database_name = self._get_test_db_name()

        if verbosity >= 1:
            action = "Using existing" if keepdb else "Creating"
            self.log(
                "%s test database for alias %s..."
                % (action, self._get_database_display_str(verbosity, test_database_name))
            )

        self._create_test_db(verbosity, autoclobber, keepdb)
        self.connection.close()
        settings.DATABASES[self.connection.alias]["NAME"] = test_database_name
        self.connection.settings_dict["NAME"] = test_database_name

        with self.connection.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")

        try:
            if self.connection.settings_dict["TEST"]["MIGRATE"] is False:
                old_migration_modules = settings.MIGRATION_MODULES
                settings.MIGRATION_MODULES = {app.label: None for app in apps.get_app_configs()}
            call_command(
                "migrate",
                verbosity=max(verbosity - 1, 0),
                interactive=False,
                database=self.connection.alias,
                run_syncdb=True,
            )
        finally:
            if self.connection.settings_dict["TEST"]["MIGRATE"] is False:
                settings.MIGRATION_MODULES = old_migration_modules

        if serialize:
            self.connection._test_serialized_contents = self.serialize_db_to_string()

        call_command("createcachetable", database=self.connection.alias)
        self.connection.ensure_connection()

        if os.environ.get("RUNNING_DJANGOS_TEST_SUITE") == "true":
            self.mark_expected_failures_and_skips()

        return test_database_name

    DatabaseCreation.create_test_db = create_test_db
    DatabaseCreation._operis_pgvector_patched = True


def pytest_configure(config):
    _patch_pgvector_test_db()


@pytest.fixture(scope="session")
def django_db_setup(django_db_setup):  # noqa: F811
    """Set up the Django database for the test session"""
    pass


@pytest.fixture
def api_client():
    """Return an unauthenticated API client"""
    return APIClient()


@pytest.fixture(autouse=True)
def stub_assistant_embeddings(monkeypatch, request):
    """Evita chamadas OpenAI reais quando indexação eager dispara durante setup de testes."""
    if "no_stub_embeddings" in request.keywords:
        return

    def _fake_embed(texts, *, use_cache=True):
        normalized = [(t or "").strip() for t in texts]
        if not normalized or not any(normalized):
            return [[] for _ in normalized]
        return [[0.0] * 1536 for _ in normalized]

    monkeypatch.setattr("operis.assistant.embeddings.embed_texts", _fake_embed)
    monkeypatch.setattr("operis.assistant.indexing.embed_texts", _fake_embed)


@pytest.fixture
def mute_assistant_auto_index(monkeypatch):
    """Silencia fila/indexação automática do assistant durante setup de unit tests."""
    monkeypatch.setattr("operis.assistant.signals.schedule_entity_index", lambda *args, **kwargs: None)


@pytest.fixture
def user_data():
    """Return standard user data for tests"""
    return {
        "email": "test@plane.so",
        "password": "test-password",
        "first_name": "Test",
        "last_name": "User",
    }


@pytest.fixture
def create_user(db, user_data):
    """Create and return a user instance"""
    user = User.objects.create(
        email=user_data["email"],
        first_name=user_data["first_name"],
        last_name=user_data["last_name"],
    )
    user.set_password(user_data["password"])
    user.save()
    return user


@pytest.fixture
def api_token(db, create_user):
    """Create and return an API token for testing the external API"""
    token = APIToken.objects.create(
        user=create_user,
        label="Test API Token",
        token="test-api-token-12345",
    )
    return token


@pytest.fixture
def api_key_client(api_client, api_token):
    """Return an API key authenticated client for external API testing"""
    api_client.credentials(HTTP_X_API_KEY=api_token.token)
    return api_client


@pytest.fixture
def session_client(api_client, create_user):
    """Return a session authenticated API client for app API testing, which is what operis.app uses"""
    api_client.force_authenticate(user=create_user)
    return api_client


@pytest.fixture
def create_bot_user(db):
    """Create and return a bot user instance"""
    from uuid import uuid4

    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"bot-{unique_id}@plane.so",
        username=f"bot_user_{unique_id}",
        first_name="Bot",
        last_name="User",
        is_bot=True,
    )
    user.set_password("bot@123")
    user.save()
    return user


@pytest.fixture
def api_token_data():
    """Return sample API token data for testing"""
    from django.utils import timezone
    from datetime import timedelta

    return {
        "label": "Test API Token",
        "description": "Test description for API token",
        "expired_at": (timezone.now() + timedelta(days=30)).isoformat(),
    }


@pytest.fixture
def create_api_token_for_user(db, create_user):
    """Create and return an API token for a specific user"""
    return APIToken.objects.create(
        label="Test Token",
        description="Test token description",
        user=create_user,
        user_type=0,
    )


@pytest.fixture
def plane_server(live_server):
    """
    Renamed version of live_server fixture to avoid name clashes.
    Returns a live Django server for testing HTTP requests.
    """
    return live_server


@pytest.fixture
def setup_instance(db):
    """Instance configurada — necessária para testes de auth/instance."""
    instance_id = uuid.uuid4() if not Instance.objects.exists() else Instance.objects.first().id
    instance, _ = Instance.objects.update_or_create(
        id=instance_id,
        defaults={
            "instance_name": "Test Instance",
            "instance_id": str(uuid.uuid4()),
            "current_version": "1.3.1",
            "latest_version": "1.3.1",
            "domain": "http://localhost:8000",
            "last_checked_at": timezone.now(),
            "is_setup_done": True,
        },
    )
    return instance


@pytest.fixture
def workspace(create_user):
    """
    Create a new workspace and return the
    corresponding Workspace model instance.
    """
    # Create the workspace using the model
    created_workspace = Workspace.objects.create(
        name="Test Workspace",
        owner=create_user,
        slug="test-workspace",
    )

    WorkspaceMember.objects.create(workspace=created_workspace, member=create_user, role=20)

    return created_workspace


@pytest.fixture
def workspace_board(workspace):
    from operis.db.models import Board

    return Board.objects.create(
        name="Test Board",
        slug="test-board",
        workspace=workspace,
    )
