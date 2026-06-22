import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { Button } from "@operis/propel/button";
import { AuthCard } from "@/app/(all)/(home)/auth-card";
import InstanceFailureDarkImage from "@/app/assets/instance/instance-failure-dark.svg?url";
import InstanceFailureImage from "@/app/assets/instance/instance-failure.svg?url";

export const InstanceFailureView = observer(function InstanceFailureView() {
  const { resolvedTheme } = useTheme();

  const instanceImage = resolvedTheme === "dark" ? InstanceFailureDarkImage : InstanceFailureImage;

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <AuthCard>
      <div className="relative flex flex-col items-center justify-center space-y-4">
        <img src={instanceImage} alt="Instance failure illustration" />
        <h3 className="text-center text-20 font-medium text-on-color">Unable to fetch instance details.</h3>
        <p className="text-center text-14 font-medium">
          We were unable to fetch the details of the instance. Fret not, it might just be a connectivity issue.
        </p>
      </div>
      <div className="flex justify-center">
        <Button size="lg" onClick={handleRetry}>
          Retry
        </Button>
      </div>
    </AuthCard>
  );
});
