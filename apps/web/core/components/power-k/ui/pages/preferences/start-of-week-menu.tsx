import React from "react";
import { Command } from "cmdk";
// plane imports
import { START_OF_THE_WEEK_OPTIONS } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { EStartOfTheWeek } from "@operis/types";
// local imports
import { PowerKModalCommandItem } from "../../modal/command-item";

const WEEK_DAY_I18N: Record<EStartOfTheWeek, string> = {
  [EStartOfTheWeek.SUNDAY]: "week_day_sunday",
  [EStartOfTheWeek.MONDAY]: "week_day_monday",
  [EStartOfTheWeek.TUESDAY]: "week_day_tuesday",
  [EStartOfTheWeek.WEDNESDAY]: "week_day_wednesday",
  [EStartOfTheWeek.THURSDAY]: "week_day_thursday",
  [EStartOfTheWeek.FRIDAY]: "week_day_friday",
  [EStartOfTheWeek.SATURDAY]: "week_day_saturday",
};

type Props = {
  onSelect: (day: EStartOfTheWeek) => void;
};

export function PowerKPreferencesStartOfWeekMenu(props: Props) {
  const { onSelect } = props;
  const { t } = useTranslation();

  return (
    <Command.Group>
      {START_OF_THE_WEEK_OPTIONS.map((day) => (
        <PowerKModalCommandItem
          key={day.value}
          onSelect={() => onSelect(day.value)}
          label={t(WEEK_DAY_I18N[day.value as EStartOfTheWeek])}
        />
      ))}
    </Command.Group>
  );
}
