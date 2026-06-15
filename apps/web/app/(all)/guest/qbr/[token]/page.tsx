import { useParams } from "react-router";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { GuestQbrPage } from "@/components/guest/guest-qbr-page";
import { EPageTypes } from "@/helpers/authentication.helper";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";

export default function GuestQbrRoutePage() {
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
      <GuestQbrPage token={token} />
    </AuthenticationWrapper>
  );
}
