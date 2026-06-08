import { useState } from "react";
import { AlertOctagon, Copy, RefreshCw, Skull, Workflow } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { IBoardAutomationDeadLetter, IBoardAutomationRule } from "@operis/types";
import { EModalPosition, EModalWidth, ModalCore, cn } from "@operis/ui";
import { renderFormattedDate } from "@operis/utils";
import { AutomationListHero } from "./automation-list-hero";
import "./automation-list.css";
import "./automation-ops.css";

type Props = {
  entries: IBoardAutomationDeadLetter[];
  rules: IBoardAutomationRule[];
  refreshing: boolean;
  onRefresh: () => void;
};

export function AutomationDeadLetterPanel(props: Props) {
  const { entries, rules, refreshing, onRefresh } = props;
  const { t } = useTranslation();
  const [detail, setDetail] = useState<IBoardAutomationDeadLetter | null>(null);

  const resolveRuleName = (ruleId: string | null) => {
    if (!ruleId) return t("boards.settings.automation.ops.dead_letters.unknown_rule");
    return rules.find((rule) => rule.id === ruleId)?.name ?? ruleId.slice(0, 8);
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <ModalCore
        isOpen={detail !== null}
        handleClose={() => setDetail(null)}
        position={EModalPosition.CENTER}
        width={EModalWidth.XXXL}
      >
        {detail && (
          <div className="flex max-h-[85vh] flex-col">
            <div className="border-b border-subtle px-5 py-4">
              <p className="text-11 font-medium uppercase tracking-wide text-tertiary">
                {t("boards.settings.automation.ops.dead_letters.detail_badge")}
              </p>
              <h3 className="mt-1 text-16 font-semibold text-primary">{resolveRuleName(detail.rule_id)}</h3>
              <p className="mt-1 font-mono text-11 text-placeholder">{detail.event_id}</p>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <div className="rounded-lg border border-danger-subtle bg-danger-subtle/25 p-4">
                <p className="text-11 font-semibold uppercase tracking-wide text-danger-primary">
                  {t("boards.settings.automation.ops.dead_letters.error_label")}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-13 leading-relaxed text-primary">
                  {detail.error_message || "—"}
                </p>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-subtle bg-layer-1 p-3">
                  <dt className="text-10 uppercase tracking-wide text-tertiary">
                    {t("boards.settings.automation.ops.dead_letters.retries")}
                  </dt>
                  <dd className="mt-1 text-14 font-semibold text-primary">{detail.retry_count}</dd>
                </div>
                <div className="rounded-lg border border-subtle bg-layer-1 p-3">
                  <dt className="text-10 uppercase tracking-wide text-tertiary">
                    {t("boards.settings.automation.ops.dead_letters.when")}
                  </dt>
                  <dd className="mt-1 text-14 font-semibold text-primary">
                    {renderFormattedDate(detail.created_at)}
                  </dd>
                </div>
              </dl>

              {detail.celery_task_id && (
                <div className="rounded-lg border border-subtle bg-surface-1 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-11 text-tertiary">{t("boards.settings.automation.ops.dead_letters.task_id")}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      prependIcon={<Copy className="size-3" />}
                      onClick={() => copyText(detail.celery_task_id)}
                    >
                      {t("copy_link")}
                    </Button>
                  </div>
                  <p className="mt-1 break-all font-mono text-12 text-secondary">{detail.celery_task_id}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </ModalCore>

      <div className="space-y-6">
        <AutomationListHero
          icon={Skull}
          title={t("boards.settings.automation.ops.dead_letters.hero_title")}
          description={t("boards.settings.automation.ops.dead_letters.hero_description")}
          createLabel={t("boards.settings.automation.ops.dead_letters.refresh")}
          creating={refreshing}
          onCreate={onRefresh}
          showIllustration={false}
          accentClass="text-danger-primary bg-danger-subtle"
          gradientClass="from-danger-subtle/35"
          highlights={[
            {
              label: t("boards.settings.automation.ops.dead_letters.count_badge", { count: entries.length }),
              icon: AlertOctagon,
              tone: "warning",
            },
          ]}
        />

        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            disabled={refreshing}
            onClick={onRefresh}
            prependIcon={<RefreshCw className={cn(refreshing && "animate-spin")} />}
          >
            {refreshing ? t("loading") : t("boards.settings.automation.ops.dead_letters.refresh")}
          </Button>
        </div>

        {entries.length === 0 ? (
          <section className="flex flex-col items-center justify-center rounded-xl border border-dashed border-subtle bg-layer-1 px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl border border-subtle bg-success-subtle text-success-primary">
              <Skull className="size-6" strokeWidth={1.5} />
            </span>
            <h3 className="mt-4 text-15 font-semibold text-primary">
              {t("boards.settings.automation.ops.dead_letters.empty_title")}
            </h3>
            <p className="mt-2 max-w-md text-13 leading-relaxed text-tertiary">
              {t("boards.settings.automation.ops.dead_letters.empty_description")}
            </p>
          </section>
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.map((entry) => (
              <li key={entry.id}>
                <article className="automation-ops-dlq-card p-4 transition-colors hover:border-danger-primary/35">
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-danger-subtle bg-danger-subtle text-danger-primary">
                      <AlertOctagon className="size-4" strokeWidth={1.75} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Workflow className="size-3.5 text-tertiary" />
                        <p className="text-14 font-semibold text-primary">{resolveRuleName(entry.rule_id)}</p>
                        <span className="rounded-full bg-layer-2 px-2 py-0.5 text-10 text-tertiary">
                          {t("boards.settings.automation.ops.dead_letters.retries_short", {
                            count: entry.retry_count,
                          })}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-13 text-secondary">{entry.error_message}</p>
                      <p className="mt-2 text-11 text-placeholder">
                        {renderFormattedDate(entry.created_at)} · {entry.event_id.slice(0, 12)}…
                      </p>
                    </div>

                    <Button variant="secondary" size="sm" onClick={() => setDetail(entry)}>
                      {t("boards.settings.automation.ops.dead_letters.view_details")}
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
