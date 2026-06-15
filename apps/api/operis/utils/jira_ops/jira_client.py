from __future__ import annotations

import base64
import json
import logging
import urllib.error
import urllib.request
from typing import Any

from .jira_custom_fields import jira_custom_field_search_ids, resolve_jira_custom_field_ids
from .jira_dates import jira_search_date_fields_for_client, register_jira_date_fields, score_start_date_field_name
from .workspace_config import JiraOpsCredentials

logger = logging.getLogger(__name__)

BASE_SEARCH_FIELDS = ["summary", "description", "status", "issuetype", "parent", "priority", "attachment"]

DUE_DATE_NAME_HINTS = (
    "due date",
    "data limite",
    "data de vencimento",
    "vencimento",
    "deadline",
    "due",
)


class JiraOpsClient:
    def __init__(self, credentials: JiraOpsCredentials) -> None:
        if not credentials.is_complete():
            raise ValueError("Credenciais Jira OPS incompletas")
        self.cloud_id = credentials.cloud_id
        self.email = credentials.email
        self.api_token = credentials.api_token
        self.project_key = credentials.project_key

        if credentials.auth_mode == "oauth":
            authorization = f"Bearer {credentials.api_token}"
        else:
            auth = base64.b64encode(f"{self.email}:{self.api_token}".encode()).decode()
            authorization = f"Basic {auth}"
        self._headers = {
            "Authorization": authorization,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        self._base_url = f"https://api.atlassian.com/ex/jira/{self.cloud_id}/rest/api/3"

        self._field_metadata = self._load_field_metadata()
        self._start_date_field, self._due_date_field, self._all_date_field_ids = self._resolve_date_field_ids(
            self._field_metadata
        )
        self.custom_import_field_ids = resolve_jira_custom_field_ids(self._field_metadata)
        register_jira_date_fields(
            self.cloud_id,
            self._start_date_field,
            self._due_date_field,
            all_date_field_ids=self._all_date_field_ids,
        )
        self._search_fields = self._build_search_fields()

    def _load_field_metadata(self) -> list[dict]:
        try:
            payload = self._request("GET", "/field")
            return payload if isinstance(payload, list) else payload.get("fields", [])
        except Exception as exc:
            logger.warning("Jira field metadata unavailable: %s", exc)
            return []

    def _build_search_fields(self) -> list[str]:
        extra = jira_search_date_fields_for_client(self.cloud_id)
        extra.extend(jira_custom_field_search_ids(self.custom_import_field_ids))
        return list(dict.fromkeys(BASE_SEARCH_FIELDS + extra))

    def _resolve_date_field_ids(self, fields: list[dict]) -> tuple[str | None, str, list[str]]:
        if not fields:
            return None, "duedate", []

        start_id: str | None = None
        start_score = -1
        due_id = "duedate"
        all_date_field_ids: list[str] = []

        for field in fields:
            if not isinstance(field, dict):
                continue
            schema = field.get("schema") or {}
            if schema.get("type") not in {"date", "datetime"}:
                continue
            field_id = (field.get("id") or "").strip()
            if not field_id:
                continue
            all_date_field_ids.append(field_id)
            name = (field.get("name") or "").lower()
            if field_id == "duedate" or any(hint in name for hint in DUE_DATE_NAME_HINTS):
                due_id = field_id
                continue
            score = score_start_date_field_name(field.get("name") or "")
            if score > start_score:
                start_score = score
                start_id = field_id

        return start_id, due_id, all_date_field_ids

    def download_attachment(self, attachment: dict[str, Any]) -> tuple[bytes, str]:
        content_url = (attachment.get("content") or "").strip()
        if not content_url:
            raise ValueError("Attachment content URL missing")
        mime = (attachment.get("mimeType") or "application/octet-stream").strip()
        req = urllib.request.Request(content_url, headers=self._headers, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                return resp.read(), mime
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Jira attachment download failed -> {exc.code}: {detail}") from exc

    def _request(self, method: str, path: str, body: dict | None = None) -> Any:
        url = f"{self._base_url}{path}"
        data = json.dumps(body).encode("utf-8") if body is not None else None
        req = urllib.request.Request(url, data=data, headers=self._headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Jira API {method} {path} -> {exc.code}: {detail}") from exc

    def search_all(self, jql: str, fields: list[str] | None = None, page_size: int = 100) -> list[dict]:
        fields = fields or self._search_fields
        issues: list[dict] = []
        next_token: str | None = None

        while True:
            body: dict[str, Any] = {"jql": jql, "maxResults": page_size, "fields": fields}
            if next_token:
                body["nextPageToken"] = next_token
            payload = self._request("POST", "/search/jql", body)
            issues.extend(payload.get("issues", []))
            if payload.get("isLast", True):
                break
            next_token = payload.get("nextPageToken")
            if not next_token:
                break
        return issues

    def fetch_epics(self) -> list[dict]:
        jql = f'project = {self.project_key} AND issuetype = Projeto'
        return self.search_all(jql)

    def fetch_issues(self) -> list[dict]:
        jql = f'project = {self.project_key} AND issuetype != Projeto'
        return self.search_all(jql)
