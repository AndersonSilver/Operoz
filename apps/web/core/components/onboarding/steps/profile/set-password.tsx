import { useState, useCallback, useMemo } from "react";
import { LockIcon, ChevronDownIcon } from "@operoz/propel/icons";
import { useTranslation } from "@operoz/i18n";
import { PasswordInput, PasswordStrengthIndicator } from "@operoz/ui";
import { cn } from "@operoz/utils";

interface PasswordState {
  password: string;
  confirmPassword: string;
}

interface SetPasswordRootProps {
  onPasswordChange?: (password: string) => void;
  onConfirmPasswordChange?: (confirmPassword: string) => void;
  disabled?: boolean;
}

export function SetPasswordRoot({ onPasswordChange, onConfirmPasswordChange, disabled = false }: SetPasswordRootProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [passwordState, setPasswordState] = useState<PasswordState>({
    password: "",
    confirmPassword: "",
  });

  const handleToggleExpand = useCallback(() => {
    if (disabled) return;
    setIsExpanded((prev) => !prev);
  }, [disabled]);

  const handlePasswordChange = useCallback(
    (field: keyof PasswordState, value: string) => {
      setPasswordState((prev) => {
        const newState = { ...prev, [field]: value };

        if (field === "password" && onPasswordChange) {
          onPasswordChange(value);
        }
        if (field === "confirmPassword" && onConfirmPasswordChange) {
          onConfirmPasswordChange(value);
        }

        return newState;
      });
    },
    [onPasswordChange, onConfirmPasswordChange]
  );

  const isPasswordValid = useMemo(() => {
    const { password, confirmPassword } = passwordState;
    return password.length >= 8 && password === confirmPassword;
  }, [passwordState]);

  const hasPasswordMismatch = useMemo(() => {
    const { password, confirmPassword } = passwordState;
    return confirmPassword.length > 0 && password !== confirmPassword;
  }, [passwordState]);

  const chevronIconClasses = useMemo(
    () => `size-4 text-placeholder transition-transform duration-150 ${isExpanded ? "rotate-180" : "rotate-0"}`,
    [isExpanded]
  );

  const expandedContentClasses = useMemo(
    () =>
      cn(
        "flex flex-col gap-4 overflow-hidden px-3 transition-all duration-150",
        isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      ),
    [isExpanded]
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-surface-2">
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 text-13",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          isExpanded && "pb-1"
        )}
        onClick={handleToggleExpand}
      >
        <div className="flex items-center gap-1 text-tertiary">
          <LockIcon className="size-3" />
          <span className="font-medium">{t("onboarding.password.set_password")}</span>
          <span>({t("onboarding.password.optional")})</span>
        </div>
        <ChevronDownIcon className={chevronIconClasses} />
      </div>

      <div className={expandedContentClasses}>
        <div className="flex flex-col gap-2 pt-1">
          <PasswordInput
            id="password"
            value={passwordState.password}
            onChange={(value) => handlePasswordChange("password", value)}
            placeholder={t("onboarding.password.placeholder")}
          />
          {passwordState.password.length > 0 && <PasswordStrengthIndicator password={passwordState.password} />}
        </div>

        <div className="flex flex-col gap-2 pb-2">
          <div className="text-13 font-medium text-tertiary">{t("onboarding.password.confirm_label")}</div>
          <PasswordInput
            id="confirm-password"
            value={passwordState.confirmPassword}
            onChange={(value) => handlePasswordChange("confirmPassword", value)}
            placeholder={t("onboarding.password.confirm_placeholder")}
          />
          {hasPasswordMismatch && (
            <p className="mt-1 text-11 text-danger-primary">{t("onboarding.password.mismatch")}</p>
          )}
          {isPasswordValid && <p className="mt-1 text-11 text-success-primary">{t("onboarding.password.match")}</p>}
        </div>
      </div>
    </div>
  );
}
