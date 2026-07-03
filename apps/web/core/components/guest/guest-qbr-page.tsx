"use client";

import DOMPurify from "dompurify";
import useSWR from "swr";
import { useTranslation } from "@operoz/i18n";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { fetchGuestQbr } from "@/services/guest-qbr.service";

type Props = {
  token: string;
};

export function GuestQbrPage({ token }: Props) {
  const { t } = useTranslation();
  const { data, error, isLoading } = useSWR(token ? `GUEST_QBR_${token}` : null, () => fetchGuestQbr(token), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-layer-1">
        <LogoSpinner />
      </div>
    );
  }

  if (error) {
    const status = (error as { status?: number }).status;
    const message =
      status === 410
        ? t("boards.client_360.guest_link_expired")
        : status === 403
          ? t("boards.client_360.guest_link_revoked")
          : t("boards.client_360.guest_link_error");

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-layer-1 px-6 text-center">
        <p className="text-16 font-semibold text-primary">{t("boards.client_360.guest_link_title")}</p>
        <p className="max-w-md text-13 text-tertiary">{message}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-layer-1">
      <header className="border-b border-subtle bg-layer-2 px-6 py-4">
        <p className="text-11 font-medium tracking-wide text-accent-primary uppercase">Operoz Visão 360</p>
        <h1 className="mt-1 text-18 font-semibold text-primary">{data.title}</h1>
        <p className="mt-1 text-12 text-tertiary">
          {data.workspace_name} · {t("boards.client_360.guest_link_readonly")}
        </p>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        {data.chart_warnings?.length ? (
          <div className="mb-6 rounded-md border border-warning-subtle bg-warning-subtle/20 px-4 py-3 text-12 text-secondary">
            {data.chart_warnings.join(" ")}
          </div>
        ) : null}
        <article
          className="prose-sm max-w-none text-primary prose [&_h1]:text-18 [&_h2]:mt-6 [&_h2]:text-14 [&_table]:text-12"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.html) }}
        />
        <p className="mt-10 text-11 text-tertiary">{t("boards.client_360.guest_link_footer")}</p>
      </main>
    </div>
  );
}
