import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "@operis/i18n";
import type { TIntakeFormPublic } from "@operis/types";
import { IntakePublicForm } from "@/components/intake/intake-public-form";
import "@/components/intake/intake-public-form.css";

export default function IntakeFormPublicPage() {
  const { anchor } = useParams<{ anchor: string }>();
  const { t } = useTranslation();
  const [form, setForm] = useState<TIntakeFormPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!anchor) return;
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/public/intake-forms/${anchor}/`, {
      credentials: "include",
    })
      .then(async (response) => {
        const contentType = response.headers.get("content-type") ?? "";
        const payload = contentType.includes("application/json")
          ? await response.json()
          : null;
        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "error" in payload
              ? String((payload as { error?: string }).error)
              : t("intake_public_form.unavailable_fallback");
          throw new Error(message);
        }
        if (!payload) {
          throw new Error(t("intake_public_form.invalid_response"));
        }
        setForm(payload as TIntakeFormPublic);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [anchor]);

  return (
    <div className="intake-public-page">
      <div className="intake-public-page-bg" aria-hidden>
        <div className="intake-public-page-vignette" />
        <div className="intake-public-page-top-glow" />
        <div className="intake-public-page-grid" />
        <div className="intake-public-page-beam" />
      </div>

      {loading ? (
        <div className="intake-public-shell">
          <div className="intake-public-loading">
            <span className="intake-public-loading-spinner" aria-hidden />
            <p className="text-13">{t("intake_public_form.loading")}</p>
          </div>
        </div>
      ) : error || !form ? (
        <div className="intake-public-shell">
          <div className="intake-public-state-card">
            <h1 className="text-18 font-semibold text-primary">{t("intake_public_form.unavailable_title")}</h1>
            <p className="mt-2 text-13 text-secondary">
              {error ?? t("intake_public_form.unavailable_fallback")}
            </p>
          </div>
        </div>
      ) : (
        <IntakePublicForm form={form} anchor={anchor!} />
      )}
    </div>
  );
}
