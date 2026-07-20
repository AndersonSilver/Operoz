import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { APITokenService } from "@operoz/services";
// components
import { ApiTokenEmptyState } from "@/components/api-token/empty-state";
import { CreateApiTokenModal } from "@/components/api-token/modal/create-token-modal";
import { ApiTokenListItem } from "@/components/api-token/token-list-item";
import { ProfileSettingsHeading } from "@/components/settings/profile/heading";
import { APITokenSettingsLoader } from "@/components/ui/loader/settings/api-token";
// constants
import { API_TOKENS_LIST } from "@/constants/fetch-keys";

const apiTokenService = new APITokenService();

export const APITokensProfileSettings = observer(function APITokensProfileSettings() {
  // states
  const [isCreateTokenModalOpen, setIsCreateTokenModalOpen] = useState(false);
  // store hooks
  const { data: tokens } = useSWR(API_TOKENS_LIST, () => apiTokenService.list());
  // translation
  const { t } = useTranslation();

  if (!tokens) {
    return <APITokenSettingsLoader />;
  }

  const hasTokens = tokens.length > 0;

  return (
    <div className="size-full">
      <CreateApiTokenModal isOpen={isCreateTokenModalOpen} onClose={() => setIsCreateTokenModalOpen(false)} />
      <ProfileSettingsHeading
        title={t("account_settings.api_tokens.heading")}
        description={t("account_settings.api_tokens.description")}
        control={
          hasTokens ? (
            <Button variant="primary" size="lg" onClick={() => setIsCreateTokenModalOpen(true)}>
              {t("workspace_settings.settings.api_tokens.add_token")}
            </Button>
          ) : undefined
        }
      />
      <div className="mt-7">
        {hasTokens ? (
          <div>
            {tokens.map((token) => (
              <ApiTokenListItem key={token.id} token={token} />
            ))}
          </div>
        ) : (
          <ApiTokenEmptyState onClick={() => setIsCreateTokenModalOpen(true)} />
        )}
      </div>
    </div>
  );
});
