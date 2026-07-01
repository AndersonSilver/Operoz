import { Plus, X } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { Input } from "@operoz/ui";

type Props = {
  value: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
};

export function DueDateThresholds({ value, onChange, disabled }: Props) {
  const { t } = useTranslation();

  const updateAt = (index: number, raw: string) => {
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 0) return;
    const next = [...value];
    next[index] = parsed;
    onChange(next.sort((a, b) => b - a));
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addThreshold = () => {
    onChange([...value, 1].sort((a, b) => b - a));
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-11 text-tertiary">{t("alert.form.thresholds_days_hint")}</p>
      <div className="flex flex-wrap gap-2">
        {value.map((days, index) => (
          <div key={`${days}-${index}`} className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              value={String(days)}
              disabled={disabled}
              onChange={(e) => updateAt(index, e.target.value)}
              className="w-16 text-center"
            />
            <span className="text-11 text-secondary">{t("alert.form.days")}</span>
            {!disabled && (
              <button
                type="button"
                className="rounded-sm p-0.5 text-tertiary hover:bg-layer-transparent-hover hover:text-primary"
                onClick={() => removeAt(index)}
                aria-label={t("alert.form.remove_threshold")}
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            )}
          </div>
        ))}
        {!disabled && (
          <Button variant="secondary" size="sm" onClick={addThreshold} className="h-8">
            <Plus size={14} strokeWidth={1.75} />
            {t("alert.form.add_threshold")}
          </Button>
        )}
      </div>
    </div>
  );
}
