import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

export const CALENDAR_ISSUE_DRAG_TYPE = "CALENDAR_ISSUE";
export const CALENDAR_DAY_DROP_TYPE = "CALENDAR_DAY";

type CalendarDragContextValue = {
  isCalendarDragging: boolean;
};

const CalendarDragContext = createContext<CalendarDragContextValue>({
  isCalendarDragging: false,
});

export const useCalendarDrag = () => useContext(CalendarDragContext);

export function CalendarDragProvider({ children }: { children: ReactNode }) {
  const [isCalendarDragging, setIsCalendarDragging] = useState(false);

  useEffect(() => {
    return monitorForElements({
      onDragStart: ({ source }) => {
        const data = source.data as { type?: string };
        if (data?.type === CALENDAR_ISSUE_DRAG_TYPE) {
          setIsCalendarDragging(true);
        }
      },
      onDrop: () => {
        setIsCalendarDragging(false);
      },
    });
  }, []);

  const value = useMemo(() => ({ isCalendarDragging }), [isCalendarDragging]);

  return <CalendarDragContext.Provider value={value}>{children}</CalendarDragContext.Provider>;
}
