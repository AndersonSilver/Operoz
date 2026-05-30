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
    <form onSubmit={handleFormSubmit} className="space-y-5">
      <div className="flex flex-col gap-3">
        <label htmlFor="email" className="text-13 font-medium text-secondary">
          {t("auth.common.email.label")}
        </label>
        <div
          className={cn(
            "relative flex items-center rounded-lg border bg-layer-1 transition-colors duration-150",
            "border-subtle focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/25",
            !isFocused && Boolean(emailError?.email)
              ? "border-danger-strong focus-within:border-danger-strong focus-within:ring-1 focus-within:ring-danger-primary/30"
              : "hover:bg-layer-2"
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
            className="h-11 w-full rounded-lg border-0 bg-transparent disable-autofill-style placeholder:text-placeholder autofill:bg-transparent focus:bg-transparent active:bg-transparent"
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
        className="h-11 w-full rounded-lg text-body-sm-semibold shadow-sm transition-[transform,box-shadow] hover:shadow-md active:scale-[0.99] disabled:shadow-none"
        size="xl"
        disabled={isButtonDisabled}
      >
        {isSubmitting ? <Spinner height="20px" width="20px" /> : t("common.continue")}
      </Button>
    </form>
  );
});
