import { observer } from "mobx-react";
// plane imports
import { START_OF_THE_WEEK_OPTIONS } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { EStartOfTheWeek } from "@operis/types";
import { CustomSelect } from "@operis/ui";
// components
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useUserProfile } from "@/hooks/store/user";

const WEEK_DAY_I18N: Record<EStartOfTheWeek, string> = {
  [EStartOfTheWeek.SUNDAY]: "week_day_sunday",
  [EStartOfTheWeek.MONDAY]: "week_day_monday",
  [EStartOfTheWeek.TUESDAY]: "week_day_tuesday",
  [EStartOfTheWeek.WEDNESDAY]: "week_day_wednesday",
  [EStartOfTheWeek.THURSDAY]: "week_day_thursday",
  [EStartOfTheWeek.FRIDAY]: "week_day_friday",
  [EStartOfTheWeek.SATURDAY]: "week_day_saturday",
};

export const StartOfWeekPreference = observer(function StartOfWeekPreference(props: {
  option: { title: string; description: string };
}) {
  const { t } = useTranslation();
  const { data: userProfile, updateUserProfile } = useUserProfile();

  const getStartOfWeekLabel = (startOfWeek: EStartOfTheWeek) => t(WEEK_DAY_I18N[startOfWeek]);

  const handleStartOfWeekChange = async (val: number) => {
    try {
      await updateUserProfile({ start_of_the_week: val });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("preferences_toast.generic_success_title"),
        message: t("preferences_toast.start_of_week_success"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("preferences_toast.start_of_week_error_title"),
        message: t("preferences_toast.start_of_week_error_message"),
      });
    }
  };

  return (
    <SettingsControlItem
      title={props.option.title}
      description={props.option.description}
      control={
        <CustomSelect
          value={userProfile.start_of_the_week}
          label={getStartOfWeekLabel(userProfile.start_of_the_week)}
          onChange={handleStartOfWeekChange}
          buttonClassName="border border-subtle-1"
          input
          maxHeight="lg"
          placement="bottom-end"
        >
          <>
            {START_OF_THE_WEEK_OPTIONS.map((day) => (
              <CustomSelect.Option key={day.value} value={day.value}>
                {t(WEEK_DAY_I18N[day.value as EStartOfTheWeek])}
              </CustomSelect.Option>
            ))}
          </>
        </CustomSelect>
      }
    />
  );
});
