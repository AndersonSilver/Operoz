import { useParams } from "react-router";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { GuestPrdReviewPage } from "@/components/guest/guest-prd-review-page";
import { EPageTypes } from "@/helpers/authentication.helper";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";

export default function GuestPrdReviewRoutePage() {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return (
      <AuthenticationWrapper pageType={EPageTypes.PUBLIC}>
        <div className="flex min-h-screen items-center justify-center bg-layer-1">
          <LogoSpinner />
        </div>
      </AuthenticationWrapper>
    );
  }

  return (
    <AuthenticationWrapper pageType={EPageTypes.PUBLIC}>
      <GuestPrdReviewPage token={token} />
    </AuthenticationWrapper>
  );
}
