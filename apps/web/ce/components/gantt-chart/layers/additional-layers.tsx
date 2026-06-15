import type { FC } from "react";

type Props = {
  itemsContainerWidth: number;
  blockCount: number;
};

/** Camadas extras do cronograma (reservado para extensões). A linha de hoje fica em GanttTodayLine. */
export const GanttAdditionalLayers: FC<Props> = () => null;
