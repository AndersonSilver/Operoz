import { useEffect, useState } from "react";
import { client360GridColumnCount } from "@/components/board/client-360/client-360-virtual-scroll";

export function useClient360GridColumns(): number {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const update = () => setColumns(client360GridColumnCount(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return columns;
}
