import { useEffect, useState } from "react";

export function useClient360CompactTableView(view: "table" | "grid" | "list" | "matrix", visibleColumnCount: number) {
  const [preferList, setPreferList] = useState(false);

  useEffect(() => {
    if (view !== "table") {
      setPreferList(false);
      return;
    }

    const media = window.matchMedia("(max-width: 767px)");
    const update = () => {
      setPreferList(media.matches && visibleColumnCount <= 3);
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [view, visibleColumnCount]);

  if (view === "table" && preferList) return "list";
  return view;
}
