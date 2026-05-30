from __future__ import annotations

import base64
import json
import urllib.error
import urllib.request
from typing import Any

from .workspace_config import JiraOpsCredentials

DEFAULT_FIELDS = ["summary", "description", "status", "issuetype", "parent", "priority"]


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

    def _request(self, method: str, path: str, body: dict | None = None) -> dict[str, Any]:
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
        fields = fields or DEFAULT_FIELDS
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
