import { useTranslation } from "@operis/i18n";

export function MaintenanceMessage() {
  const { t } = useTranslation();
  const linkMap = [
    {
      key: "mail_to",
      label: "Contact Support",
      value: "mailto:support@plane.so",
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="text-left text-18 font-semibold text-primary">
          &#x1F6A7;{" "}
          {t(
            "self_hosted_maintenance_message.plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start"
          )}
        </h1>
        <span className="text-left text-14 font-medium text-secondary">
          {t(
            "self_hosted_maintenance_message.choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure"
          )}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-start gap-6">
        {linkMap.map((link) => (
          <div key={link.key}>
            <a
              href={link.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-13 text-accent-primary hover:underline"
            >
              {link.label}
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
