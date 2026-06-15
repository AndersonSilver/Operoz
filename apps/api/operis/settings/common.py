"""Global Settings"""

# Python imports
import ipaddress
import logging
import os
from urllib.parse import urlparse
from urllib.parse import urljoin

# Third party imports
import dj_database_url

# Django imports
from django.core.management.utils import get_random_secret_key
from corsheaders.defaults import default_headers


# Module imports
from operis.utils.url import is_valid_url


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Secret Key
SECRET_KEY = os.environ.get("SECRET_KEY", get_random_secret_key())

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = int(os.environ.get("DEBUG", "0"))

# Self-hosted mode
IS_SELF_MANAGED = True

# Webhook IP allowlist — comma-separated IPs or CIDR ranges that are allowed as
# webhook targets even if they resolve to private networks.
# Example: "10.0.0.0/8,192.168.1.0/24,172.16.0.5"
_webhook_allowed_ips_raw = os.environ.get("WEBHOOK_ALLOWED_IPS", "")
WEBHOOK_ALLOWED_IPS = []
_logger = logging.getLogger("operis")
for _cidr in _webhook_allowed_ips_raw.split(","):
    _cidr = _cidr.strip()
    if not _cidr:
        continue
    try:
        WEBHOOK_ALLOWED_IPS.append(ipaddress.ip_network(_cidr, strict=False))
    except ValueError:
        _logger.warning("WEBHOOK_ALLOWED_IPS: skipping invalid entry %r", _cidr)

# Allowed Hosts
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")

# Application definition
INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.staticfiles",
    # Inhouse apps
    "operis.analytics",
    "operis.app",
    "operis.space",
    "operis.bgtasks",
    "operis.db",
    "operis.utils",
    "operis.web",
    "operis.middleware",
    "operis.license",
    "operis.api",
    "operis.authentication",
    # Third-party things
    "rest_framework",
    "corsheaders",
    "django_celery_beat",
    "pgvector.django",
]

# Middlewares
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "operis.authentication.middleware.session.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "crum.CurrentRequestUserMiddleware",
    "django.middleware.gzip.GZipMiddleware",
    "operis.middleware.request_body_size.RequestBodySizeLimitMiddleware",
    "operis.middleware.logger.APITokenLogMiddleware",
    "operis.middleware.logger.RequestLoggerMiddleware",
]

# Rest Framework settings
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework.authentication.SessionAuthentication",),
    "DEFAULT_THROTTLE_CLASSES": ("rest_framework.throttling.AnonRateThrottle",),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/minute",
        "asset_id": "5/minute",
    },
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend",),
    "EXCEPTION_HANDLER": "operis.authentication.adapter.exception.auth_exception_handler",
    # Preserve original Django URL parameter names (pk) instead of converting to 'id'
    "SCHEMA_COERCE_PATH_PK": False,
}

# Django Auth Backend
AUTHENTICATION_BACKENDS = ("django.contrib.auth.backends.ModelBackend",)  # default

# Root Urls
ROOT_URLCONF = "operis.urls"

# Templates
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": ["templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]


# CORS Settings
CORS_ALLOW_CREDENTIALS = True
cors_origins_raw = os.environ.get("CORS_ALLOWED_ORIGINS", "")
# filter out empty strings
cors_allowed_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]
if cors_allowed_origins:
    CORS_ALLOWED_ORIGINS = cors_allowed_origins
    secure_origins = False if [origin for origin in cors_allowed_origins if "http:" in origin] else True
else:
    CORS_ALLOW_ALL_ORIGINS = True
    secure_origins = False

CORS_ALLOW_HEADERS = [*default_headers, "X-API-Key"]

# Application Settings
WSGI_APPLICATION = "operis.wsgi.application"
ASGI_APPLICATION = "operis.asgi.application"

# Django Sites
SITE_ID = 1

# User Model
AUTH_USER_MODEL = "db.User"

# Database
if bool(os.environ.get("DATABASE_URL")):
    # Parse database configuration from $DATABASE_URL
    DATABASES = {"default": dj_database_url.config()}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB"),
            "USER": os.environ.get("POSTGRES_USER"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD"),
            "HOST": os.environ.get("POSTGRES_HOST"),
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
        }
    }

if os.environ.get("USE_PGBOUNCER", "0") == "1":
    for _db in DATABASES.values():
        _db["CONN_MAX_AGE"] = 0
        _db["DISABLE_SERVER_SIDE_CURSORS"] = True
        _db.setdefault("OPTIONS", {})
        _db["OPTIONS"]["connect_timeout"] = 10


if os.environ.get("ENABLE_READ_REPLICA", "0") == "1":
    if bool(os.environ.get("DATABASE_READ_REPLICA_URL")):
        # Parse database configuration from $DATABASE_URL
        DATABASES["replica"] = dj_database_url.parse(os.environ.get("DATABASE_READ_REPLICA_URL"))
    else:
        DATABASES["replica"] = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_READ_REPLICA_DB"),
            "USER": os.environ.get("POSTGRES_READ_REPLICA_USER"),
            "PASSWORD": os.environ.get("POSTGRES_READ_REPLICA_PASSWORD"),
            "HOST": os.environ.get("POSTGRES_READ_REPLICA_HOST"),
            "PORT": os.environ.get("POSTGRES_READ_REPLICA_PORT", "5432"),
        }

    # Database Routers
    DATABASE_ROUTERS = ["operis.utils.core.dbrouters.ReadReplicaRouter"]
    # Add middleware at the end for read replica routing
    MIDDLEWARE.append("operis.middleware.db_routing.ReadReplicaRoutingMiddleware")


# Redis Config
REDIS_URL = os.environ.get("REDIS_URL")
REDIS_SSL = REDIS_URL and "rediss" in REDIS_URL

if REDIS_SSL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "CONNECTION_POOL_KWARGS": {"ssl_cert_reqs": False},
            },
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        }
    }

# Password validations
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Password reset time the number of seconds the uniquely generated uid will be valid
PASSWORD_RESET_TIMEOUT = 3600

# Static files (CSS, JavaScript, Images)
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "static-assets", "collected-static")
STATICFILES_DIRS = (os.path.join(BASE_DIR, "static"),)

# Media Settings
MEDIA_ROOT = "mediafiles"
MEDIA_URL = "/media/"

# Internationalization
LANGUAGE_CODE = "pt-br"
USE_I18N = True
USE_L10N = True

# Timezones
USE_TZ = True
TIME_ZONE = "UTC"

# Default Auto Field
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Email settings
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

# Storage Settings
# Use Minio settings
USE_MINIO = int(os.environ.get("USE_MINIO", 0)) == 1

STORAGES = {"staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"}}
STORAGES["default"] = {"BACKEND": "operis.settings.storage.S3Storage"}
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "access-key")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "secret-key")
AWS_STORAGE_BUCKET_NAME = os.environ.get("AWS_S3_BUCKET_NAME", "uploads")
AWS_REGION = os.environ.get("AWS_REGION", "")
AWS_DEFAULT_ACL = "public-read"
AWS_QUERYSTRING_AUTH = False
AWS_S3_FILE_OVERWRITE = False
AWS_S3_ENDPOINT_URL = os.environ.get("AWS_S3_ENDPOINT_URL", None) or os.environ.get("MINIO_ENDPOINT_URL", None)
if AWS_S3_ENDPOINT_URL and USE_MINIO:
    # Optional browser-reachable MinIO URL (local dev without reverse proxy on the API port).
    _public_minio = os.environ.get("MINIO_PUBLIC_ENDPOINT_URL", "").strip()
    parsed_url = urlparse(_public_minio if _public_minio else os.environ.get("WEB_URL", "http://localhost"))
    AWS_S3_CUSTOM_DOMAIN = f"{parsed_url.netloc}/{AWS_STORAGE_BUCKET_NAME}"
    AWS_S3_URL_PROTOCOL = f"{parsed_url.scheme}:"

# RabbitMQ connection settings
RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = os.environ.get("RABBITMQ_PORT", "5672")
RABBITMQ_USER = os.environ.get("RABBITMQ_USER", "guest")
RABBITMQ_PASSWORD = os.environ.get("RABBITMQ_PASSWORD", "guest")
RABBITMQ_VHOST = os.environ.get("RABBITMQ_VHOST", "/")
AMQP_URL = os.environ.get("AMQP_URL")

# Celery Configuration
if AMQP_URL:
    CELERY_BROKER_URL = AMQP_URL
else:
    CELERY_BROKER_URL = f"amqp://{RABBITMQ_USER}:{RABBITMQ_PASSWORD}@{RABBITMQ_HOST}:{RABBITMQ_PORT}/{RABBITMQ_VHOST}"

CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["application/json"]

# Board automation — fila dedicada e limites operacionais
AUTOMATION_CELERY_QUEUE = os.environ.get("AUTOMATION_CELERY_QUEUE", "automation")
AUTOMATION_EMAIL_CELERY_QUEUE = os.environ.get("AUTOMATION_EMAIL_CELERY_QUEUE", "automation_email")
ASSISTANT_CELERY_QUEUE = os.environ.get("ASSISTANT_CELERY_QUEUE", "assistant")
ASSISTANT_CHAT_CELERY_QUEUE = os.environ.get("ASSISTANT_CHAT_CELERY_QUEUE", "assistant-chat")
AUTOMATION_WORKER_CONCURRENCY = int(os.environ.get("AUTOMATION_WORKER_CONCURRENCY", "4"))
AUTOMATION_EMAIL_WORKER_CONCURRENCY = int(os.environ.get("AUTOMATION_EMAIL_WORKER_CONCURRENCY", "2"))
CLIENT_360_HEALTH_SCORE_DISPLAY_DEFAULT = os.environ.get("CLIENT_360_HEALTH_SCORE_DISPLAY_DEFAULT", "0")

ASSISTANT_RAG_ENABLED = os.environ.get("ASSISTANT_RAG_ENABLED", "1")
ASSISTANT_HISTORY_SUMMARIZE_AFTER = int(os.environ.get("ASSISTANT_HISTORY_SUMMARIZE_AFTER", "14"))
ASSISTANT_HISTORY_KEEP_RECENT = int(os.environ.get("ASSISTANT_HISTORY_KEEP_RECENT", "8"))
ASSISTANT_EMBEDDING_CACHE_TTL = int(os.environ.get("ASSISTANT_EMBEDDING_CACHE_TTL", str(60 * 60 * 24 * 7)))
ASSISTANT_ORCHESTRATOR_ENABLED = os.environ.get("ASSISTANT_ORCHESTRATOR_ENABLED", "0")
ASSISTANT_DAILY_TOKEN_BUDGET = int(os.environ.get("ASSISTANT_DAILY_TOKEN_BUDGET", "200000"))
ASSISTANT_BUDGET_ALERT_RATIO = float(os.environ.get("ASSISTANT_BUDGET_ALERT_RATIO", "0.8"))
ASSISTANT_RAG_TOP_K = int(os.environ.get("ASSISTANT_RAG_TOP_K", "5"))
ASSISTANT_RAG_CANDIDATE_LIMIT = int(os.environ.get("ASSISTANT_RAG_CANDIDATE_LIMIT", "30"))
ASSISTANT_RAG_RRF_K = int(os.environ.get("ASSISTANT_RAG_RRF_K", "60"))
ASSISTANT_RAG_QUERY_EMBEDDING_CACHE_TTL = int(os.environ.get("ASSISTANT_RAG_QUERY_EMBEDDING_CACHE_TTL", str(60 * 10)))
ASSISTANT_RAG_RESULTS_CACHE_TTL = int(os.environ.get("ASSISTANT_RAG_RESULTS_CACHE_TTL", str(60 * 3)))
ASSISTANT_RAG_HNSW_EF_SEARCH = int(os.environ.get("ASSISTANT_RAG_HNSW_EF_SEARCH", "40"))
ASSISTANT_SUMMARY_SYNC = os.environ.get("ASSISTANT_SUMMARY_SYNC", "0")
ASSISTANT_DEFER_NONCRITICAL = os.environ.get("ASSISTANT_DEFER_NONCRITICAL", "1")
ASSISTANT_MAX_CONCURRENT_LLM = int(os.environ.get("ASSISTANT_MAX_CONCURRENT_LLM", "40"))
ASSISTANT_MAX_ACTIVE_CHATS_PER_USER = int(os.environ.get("ASSISTANT_MAX_ACTIVE_CHATS_PER_USER", "2"))
ASSISTANT_FAIR_QUEUE_AVG_SECONDS = int(os.environ.get("ASSISTANT_FAIR_QUEUE_AVG_SECONDS", "15"))
ASSISTANT_LLM_WAIT_TIMEOUT_SECONDS = int(os.environ.get("ASSISTANT_LLM_WAIT_TIMEOUT_SECONDS", "600"))
ASSISTANT_LLM_KEY_FAILURE_THRESHOLD = int(os.environ.get("ASSISTANT_LLM_KEY_FAILURE_THRESHOLD", "3"))
ASSISTANT_LLM_KEY_OPEN_SECONDS = int(os.environ.get("ASSISTANT_LLM_KEY_OPEN_SECONDS", "120"))
ASSISTANT_DEGRADED_QUEUE_THRESHOLD = int(os.environ.get("ASSISTANT_DEGRADED_QUEUE_THRESHOLD", "10"))
ASSISTANT_DEGRADED_BUDGET_RATIO = float(os.environ.get("ASSISTANT_DEGRADED_BUDGET_RATIO", "0.9"))
ASSISTANT_CHAT_QUEUE_ALERT_THRESHOLD = int(os.environ.get("ASSISTANT_CHAT_QUEUE_ALERT_THRESHOLD", "100"))
ASSISTANT_CHAT_STREAM_IDLE_SECONDS = int(os.environ.get("ASSISTANT_CHAT_STREAM_IDLE_SECONDS", "90"))
ASSISTANT_CHAT_JOB_STALE_SECONDS = int(os.environ.get("ASSISTANT_CHAT_JOB_STALE_SECONDS", "900"))
ASSISTANT_ALERT_STALE_JOBS = int(os.environ.get("ASSISTANT_ALERT_STALE_JOBS", "1"))
ASSISTANT_METRICS_TOKEN = os.environ.get("ASSISTANT_METRICS_TOKEN", "")
ASSISTANT_ALERT_P95_FIRST_TOKEN_MS = int(os.environ.get("ASSISTANT_ALERT_P95_FIRST_TOKEN_MS", "3000"))
ASSISTANT_ALERT_ERROR_RATE = float(os.environ.get("ASSISTANT_ALERT_ERROR_RATE", "0.05"))
ASSISTANT_REQUIRE_SESSION_SCOPE = os.environ.get("ASSISTANT_REQUIRE_SESSION_SCOPE", "1")
LLM_MODEL_FALLBACK = os.environ.get("LLM_MODEL_FALLBACK", "")
AUTOMATION_MAX_RUNS_PER_BOARD_PER_HOUR = int(os.environ.get("AUTOMATION_MAX_RUNS_PER_BOARD_PER_HOUR", "500"))
AUTOMATION_MAX_RUNS_PER_WORKSPACE_PER_HOUR = int(
    os.environ.get("AUTOMATION_MAX_RUNS_PER_WORKSPACE_PER_HOUR", "5000")
)
_AUTOMATION_WORKSPACE_OVERRIDES_RAW = os.environ.get("AUTOMATION_MAX_RUNS_PER_WORKSPACE_OVERRIDES", "{}")
try:
    import json as _json

    AUTOMATION_MAX_RUNS_PER_WORKSPACE_OVERRIDES = {
        str(k): int(v) for k, v in _json.loads(_AUTOMATION_WORKSPACE_OVERRIDES_RAW).items()
    }
except (ValueError, TypeError):
    AUTOMATION_MAX_RUNS_PER_WORKSPACE_OVERRIDES = {}
AUTOMATION_CIRCUIT_FAILURE_THRESHOLD = int(os.environ.get("AUTOMATION_CIRCUIT_FAILURE_THRESHOLD", "10"))
AUTOMATION_CIRCUIT_OPEN_SECONDS = int(os.environ.get("AUTOMATION_CIRCUIT_OPEN_SECONDS", "300"))

try:
    from kombu import Exchange, Queue

    CELERY_TASK_QUEUES = (
        Queue("celery", Exchange("celery"), routing_key="celery"),
        Queue(AUTOMATION_CELERY_QUEUE, Exchange(AUTOMATION_CELERY_QUEUE), routing_key=AUTOMATION_CELERY_QUEUE),
        Queue(
            AUTOMATION_EMAIL_CELERY_QUEUE,
            Exchange(AUTOMATION_EMAIL_CELERY_QUEUE),
            routing_key=AUTOMATION_EMAIL_CELERY_QUEUE,
        ),
        Queue(ASSISTANT_CELERY_QUEUE, Exchange(ASSISTANT_CELERY_QUEUE), routing_key=ASSISTANT_CELERY_QUEUE),
        Queue(
            ASSISTANT_CHAT_CELERY_QUEUE,
            Exchange(ASSISTANT_CHAT_CELERY_QUEUE),
            routing_key=ASSISTANT_CHAT_CELERY_QUEUE,
        ),
    )
except ImportError:
    CELERY_TASK_QUEUES = None

CELERY_TASK_ROUTES = {
    "operis.bgtasks.automation_task.run_board_automation": {"queue": AUTOMATION_CELERY_QUEUE},
    "operis.bgtasks.automation_task.enqueue_automation_outbox": {"queue": AUTOMATION_CELERY_QUEUE},
    "operis.bgtasks.automation_task.flush_stale_automation_outbox": {"queue": AUTOMATION_CELERY_QUEUE},
    "operis.bgtasks.automation_email_task.send_automation_email_task": {
        "queue": AUTOMATION_EMAIL_CELERY_QUEUE,
    },
    "operis.bgtasks.assistant_index_task.index_entity_task": {"queue": ASSISTANT_CELERY_QUEUE},
    "operis.bgtasks.assistant_chat_task.run_assistant_chat_job_task": {"queue": ASSISTANT_CHAT_CELERY_QUEUE},
    "operis.bgtasks.assistant_deferred_task.log_assistant_action_task": {"queue": ASSISTANT_CELERY_QUEUE},
    "operis.bgtasks.assistant_deferred_task.record_assistant_response_task": {"queue": ASSISTANT_CELERY_QUEUE},
    "operis.bgtasks.assistant_deferred_task.summarize_session_task": {"queue": ASSISTANT_CELERY_QUEUE},
}


CELERY_IMPORTS = (
    # scheduled tasks
    "operis.bgtasks.automation_task",
    "operis.bgtasks.automation_email_task",
    "operis.bgtasks.assistant_index_task",
    "operis.bgtasks.assistant_chat_task",
    "operis.bgtasks.assistant_deferred_task",
    "operis.bgtasks.issue_automation_task",
    "operis.bgtasks.jira_ops_sync_task",
    "operis.bgtasks.exporter_expired_task",
    "operis.bgtasks.file_asset_task",
    "operis.bgtasks.email_notification_task",
    "operis.bgtasks.cleanup_task",
    "operis.bgtasks.client_360_health_snapshot_task",
    "operis.bgtasks.client_360_weekly_briefing_task",
    "operis.bgtasks.client_360_status_report_reminder_task",
    "operis.license.bgtasks.tracer",
    # management tasks
    "operis.bgtasks.dummy_data_task",
    # issue version tasks
    "operis.bgtasks.issue_version_sync",
    "operis.bgtasks.issue_description_version_sync",
)

FILE_SIZE_LIMIT = int(os.environ.get("FILE_SIZE_LIMIT", 5242880))

# Unsplash Access key
UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY")
# Github Access Token
GITHUB_ACCESS_TOKEN = os.environ.get("GITHUB_ACCESS_TOKEN", False)

# Jira OPS → Operis (fallback legado; preferir configuração por workspace)
JIRA_OPS_CLOUD_ID = os.environ.get("JIRA_OPS_CLOUD_ID", "")
JIRA_OPS_EMAIL = os.environ.get("JIRA_OPS_EMAIL", "")
JIRA_OPS_API_TOKEN = os.environ.get("JIRA_OPS_API_TOKEN", "")
JIRA_OPS_PROJECT_KEY = os.environ.get("JIRA_OPS_PROJECT_KEY", "OPS")
JIRA_OPS_BOARD_SLUG = os.environ.get("JIRA_OPS_BOARD_SLUG", "squad-as-a-service")
JIRA_OPS_START_DATE_FIELD = os.environ.get("JIRA_OPS_START_DATE_FIELD", "")

# OAuth Atlassian (login na UI — Configurações → Jira OPS)
ATLASSIAN_OAUTH_CLIENT_ID = os.environ.get("ATLASSIAN_OAUTH_CLIENT_ID", "")
ATLASSIAN_OAUTH_CLIENT_SECRET = os.environ.get("ATLASSIAN_OAUTH_CLIENT_SECRET", "")
ATLASSIAN_OAUTH_REDIRECT_URI = os.environ.get("ATLASSIAN_OAUTH_REDIRECT_URI", "")

# Analytics
ANALYTICS_SECRET_KEY = os.environ.get("ANALYTICS_SECRET_KEY", False)
ANALYTICS_BASE_API = os.environ.get("ANALYTICS_BASE_API", False)

# Posthog settings
POSTHOG_API_KEY = os.environ.get("POSTHOG_API_KEY", False)
POSTHOG_HOST = os.environ.get("POSTHOG_HOST", False)

# Skip environment variable configuration
SKIP_ENV_VAR = os.environ.get("SKIP_ENV_VAR", "1") == "1"

DATA_UPLOAD_MAX_MEMORY_SIZE = int(os.environ.get("FILE_SIZE_LIMIT", 5242880))

# Cookie Settings
SESSION_COOKIE_SECURE = secure_origins
SESSION_COOKIE_HTTPONLY = True
SESSION_ENGINE = "operis.db.models.session"
SESSION_COOKIE_AGE = int(os.environ.get("SESSION_COOKIE_AGE", 604800))
SESSION_COOKIE_NAME = os.environ.get("SESSION_COOKIE_NAME", "session-id")
SESSION_COOKIE_DOMAIN = os.environ.get("COOKIE_DOMAIN", None)
SESSION_SAVE_EVERY_REQUEST = os.environ.get("SESSION_SAVE_EVERY_REQUEST", "0") == "1"

# Admin Cookie
ADMIN_SESSION_COOKIE_NAME = "admin-session-id"
ADMIN_SESSION_COOKIE_AGE = int(os.environ.get("ADMIN_SESSION_COOKIE_AGE", 3600))

# CSRF cookies
CSRF_COOKIE_SECURE = secure_origins
CSRF_COOKIE_HTTPONLY = True
CSRF_TRUSTED_ORIGINS = cors_allowed_origins
CSRF_COOKIE_DOMAIN = os.environ.get("COOKIE_DOMAIN", None)
CSRF_FAILURE_VIEW = "operis.authentication.views.common.csrf_failure"

######  Base URLs ######

# Admin Base URL
ADMIN_BASE_URL = os.environ.get("ADMIN_BASE_URL", None)
if ADMIN_BASE_URL and not is_valid_url(ADMIN_BASE_URL):
    ADMIN_BASE_URL = None
ADMIN_BASE_PATH = os.environ.get("ADMIN_BASE_PATH", "/god-mode/")

# Space Base URL
SPACE_BASE_URL = os.environ.get("SPACE_BASE_URL", None)
if SPACE_BASE_URL and not is_valid_url(SPACE_BASE_URL):
    SPACE_BASE_URL = None
SPACE_BASE_PATH = os.environ.get("SPACE_BASE_PATH", "/spaces/")

# App Base URL
APP_BASE_URL = os.environ.get("APP_BASE_URL", None)
if APP_BASE_URL and not is_valid_url(APP_BASE_URL):
    APP_BASE_URL = None
APP_BASE_PATH = os.environ.get("APP_BASE_PATH", "/")

# Live Base URL
LIVE_BASE_URL = os.environ.get("LIVE_BASE_URL", None)
if LIVE_BASE_URL and not is_valid_url(LIVE_BASE_URL):
    LIVE_BASE_URL = None
LIVE_BASE_PATH = os.environ.get("LIVE_BASE_PATH", "/live/")

LIVE_URL = urljoin(LIVE_BASE_URL, LIVE_BASE_PATH) if LIVE_BASE_URL else None

# WEB URL
WEB_URL = os.environ.get("WEB_URL")

HARD_DELETE_AFTER_DAYS = int(os.environ.get("HARD_DELETE_AFTER_DAYS", 60))

# Instance Changelog URL
INSTANCE_CHANGELOG_URL = os.environ.get("INSTANCE_CHANGELOG_URL", "")

ATTACHMENT_MIME_TYPES = [
    # Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg+xml",
    "image/webp",
    "image/tiff",
    "image/bmp",
    # Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/markdown",
    "application/rtf",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.presentation",
    "application/vnd.oasis.opendocument.graphics",
    # Microsoft Visio
    "application/vnd.visio",
    # Netpbm format
    "image/x-portable-graymap",
    "image/x-portable-bitmap",
    "image/x-portable-pixmap",
    # Open Office Bae
    "application/vnd.oasis.opendocument.database",
    # Audio
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/midi",
    "audio/x-midi",
    "audio/aac",
    "audio/flac",
    "audio/x-m4a",
    # Video
    "video/mp4",
    "video/mpeg",
    "video/ogg",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    # Archives
    "application/zip",
    "application/x-rar",
    "application/x-rar-compressed",
    "application/x-tar",
    "application/gzip",
    "application/x-zip",
    "application/x-zip-compressed",
    "application/x-7z-compressed",
    "application/x-compressed",
    "application/x-compressed-tar",
    "application/x-compressed-tar-gz",
    "application/x-compressed-tar-bz2",
    "application/x-compressed-tar-zip",
    "application/x-compressed-tar-7z",
    "application/x-compressed-tar-rar",
    "application/x-compressed-tar-zip",
    # 3D Models
    "model/gltf-binary",
    "model/gltf+json",
    "application/octet-stream",  # for .obj files, but be cautious
    # Fonts
    "font/ttf",
    "font/otf",
    "font/woff",
    "font/woff2",
    # Other
    "text/css",
    "text/javascript",
    "application/json",
    "text/xml",
    "text/html",
    "application/xhtml+xml",
    "text/csv",
    "application/xml",
    # SQL
    "application/x-sql",
    # Gzip
    "application/x-gzip",
    # Markdown
    "text/markdown",
]

# Seed directory path
SEED_DIR = os.path.join(BASE_DIR, "seeds")

ENABLE_DRF_SPECTACULAR = os.environ.get("ENABLE_DRF_SPECTACULAR", "0") == "1"

if ENABLE_DRF_SPECTACULAR:
    REST_FRAMEWORK["DEFAULT_SCHEMA_CLASS"] = "drf_spectacular.openapi.AutoSchema"
    INSTALLED_APPS.append("drf_spectacular")
    from .openapi import SPECTACULAR_SETTINGS  # noqa: F401

# MongoDB Settings
MONGO_DB_URL = os.environ.get("MONGO_DB_URL", False)
MONGO_DB_DATABASE = os.environ.get("MONGO_DB_DATABASE", False)
