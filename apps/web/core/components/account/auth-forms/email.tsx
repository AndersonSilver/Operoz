import type { FormEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
// icons
import { CircleAlert, XCircle } from "lucide-react";
// plane imports
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { IEmailCheckData } from "@operis/types";
import { Input, Spinner } from "@operis/ui";
import { cn, checkEmailValidity } from "@operis/utils";
// helpers
type TAuthEmailForm = {
  defaultEmail: string;
  onSubmit: (data: IEmailCheckData) => Promise<void>;
};

export const AuthEmailForm = observer(function AuthEmailForm(props: TAuthEmailForm) {
  const { onSubmit, defaultEmail } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  // plane hooks
  const { t } = useTranslation();
  const emailError = useMemo(
    () => (email && !checkEmailValidity(email) ? { email: "auth.common.email.errors.invalid" } : undefined),
    [email]
  );

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const payload: IEmailCheckData = {
      email: email,
    };
    await onSubmit(payload);
    setIsSubmitting(false);
  };

  const isButtonDisabled = email.length === 0 || Boolean(emailError?.email) || isSubmitting;

  const [isFocused, setIsFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="flex flex-col gap-2.5">
        <label htmlFor="email" className="text-12 font-medium tracking-[0.04em] text-tertiary uppercase">
          {t("auth.common.email.label")}
        </label>
        <div
          className={cn(
            "relative flex items-center rounded-xl border bg-layer-1/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200",
            "focus-within:border-accent-primary/60 border-white/[0.08] focus-within:bg-layer-1 focus-within:shadow-[0_0_0_3px_rgba(94,106,210,0.15)] dark:border-white/[0.06]",
            !isFocused && Boolean(emailError?.email)
              ? "border-danger-strong focus-within:border-danger-strong focus-within:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]"
              : "hover:border-white/[0.12] hover:bg-layer-2/80"
          )}
          onFocus={() => {
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
        >
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.common.email.placeholder")}
            className="text-15 h-12 w-full rounded-xl border-0 bg-transparent px-4 disable-autofill-style placeholder:text-placeholder/80 autofill:bg-transparent focus:bg-transparent active:bg-transparent"
            autoComplete="off"
            autoFocus
            ref={inputRef}
          />
          {email.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setEmail("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 grid size-5 place-items-center"
              aria-label={t("aria_labels.auth_forms.clear_email")}
              tabIndex={-1}
            >
              <XCircle className="size-5 stroke-placeholder" />
            </button>
          )}
        </div>
        {emailError?.email && !isFocused && (
          <p className="flex items-center gap-1 px-0.5 text-11 text-danger-primary">
            <CircleAlert height={12} width={12} />
            {t(emailError.email)}
          </p>
        )}
      </div>
      <Button
        type="submit"
        variant="primary"
        className="h-12 w-full rounded-xl text-body-sm-semibold shadow-[0_8px_28px_-8px_rgba(94,106,210,0.55)] transition-all duration-200 hover:shadow-[0_12px_32px_-8px_rgba(94,106,210,0.65)] active:scale-[0.98] disabled:scale-100 disabled:opacity-45 disabled:shadow-none"
        size="xl"
        disabled={isButtonDisabled}
      >
        {isSubmitting ? <Spinner height="20px" width="20px" /> : t("common.continue")}
      </Button>
    </form>
  );
});
