import type { ReactNode } from "react";

import { cn } from "@operis/utils";

import type { TListPropertyColumnAlign } from "./list-property-columns";



type Props = {

  children?: ReactNode;

  /** Reserva a coluna quando o valor está vazio (ex.: sem data alvo). */

  isEmpty?: boolean;

  align?: TListPropertyColumnAlign;

};



const alignClass: Record<TListPropertyColumnAlign, string> = {

  start: "justify-start",

  center: "justify-center",

  end: "justify-end",

};



export function ListPropertyGridCell({ children, isEmpty = false, align = "start" }: Props) {

  const showPlaceholder = isEmpty || !children;



  return (

    <div
      className={cn(
        "flex min-h-6 min-w-0 max-w-full items-center overflow-hidden px-0.5",
        alignClass[align]
      )}
    >

      {showPlaceholder ? (

        <span className="text-caption-sm-regular text-placeholder select-none" aria-hidden>

          —

        </span>

      ) : (

        <div className={cn("flex max-w-full min-w-0 items-center", alignClass[align])}>{children}</div>

      )}

    </div>

  );

}


