// plane types
import { useTranslation } from "@operis/i18n";
import type { IUser } from "@operis/types";
// hooks
import { useCurrentTime } from "@/hooks/use-current-time";

export interface IUserGreetingsView {
  user: IUser;
}

function intlLocaleFromAppLocale(locale: string): string {
  if (locale === "pt-BR") return "pt-BR";
  if (locale === "zh-CN" || locale === "zh-TW") return locale;
  return "en-US";
}

export function UserGreetingsView(props: IUserGreetingsView) {
  const { user } = props;
  const { currentTime } = useCurrentTime();
  const { t, currentLocale } = useTranslation();

  const intlLocale = intlLocaleFromAppLocale(currentLocale);

  const hour = new Intl.DateTimeFormat(intlLocale, {
    hour12: false,
    hour: "numeric",
  }).format(currentTime);

  const date = new Intl.DateTimeFormat(intlLocale, {
    month: "short",
    day: "numeric",
  }).format(currentTime);

  const weekDay = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
  }).format(currentTime);

  const timeString = new Intl.DateTimeFormat(intlLocale, {
    timeZone: user?.user_timezone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).format(currentTime);

  const greeting = parseInt(hour, 10) < 12 ? "morning" : parseInt(hour, 10) < 18 ? "afternoon" : "evening";

  return (
    <div className="my-6 flex flex-col items-center">
      <h2 className="text-center text-20 font-semibold">
        {t(`home.greeting.${greeting}`, { firstName: user?.first_name ?? "", lastName: user?.last_name ?? "" })}
      </h2>
      <h5 className="flex items-center gap-2 font-medium text-placeholder">
        <div>{greeting === "morning" ? "🌤️" : greeting === "afternoon" ? "🌥️" : "🌙️"}</div>
        <div>
          {weekDay}, {date} {timeString}
        </div>
      </h5>
    </div>
  );
}
