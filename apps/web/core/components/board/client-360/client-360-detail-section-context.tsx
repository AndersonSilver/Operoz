"use client";

import { createContext, useContext, type ReactNode } from "react";

export type Client360DetailSectionConfig = {
  collapsible?: boolean;
  defaultOpen?: boolean;
};

type Client360DetailSectionContextValue = {
  collapseScope: string;
  sections: Record<string, Client360DetailSectionConfig>;
};

const Client360DetailSectionContext = createContext<Client360DetailSectionContextValue | null>(null);

export function Client360DetailSectionProvider({
  collapseScope,
  sections,
  children,
}: {
  collapseScope: string;
  sections: Record<string, Client360DetailSectionConfig>;
  children: ReactNode;
}) {
  return (
    <Client360DetailSectionContext.Provider value={{ collapseScope, sections }}>
      {children}
    </Client360DetailSectionContext.Provider>
  );
}

export function useClient360DetailSection(sectionId: string | undefined) {
  const ctx = useContext(Client360DetailSectionContext);
  if (!sectionId || !ctx) {
    return {
      sectionId: undefined as string | undefined,
      collapsible: false,
      defaultOpen: true,
      collapseScope: undefined as string | undefined,
    };
  }

  const cfg = ctx.sections[sectionId] ?? {};
  return {
    sectionId,
    collapsible: cfg.collapsible ?? true,
    defaultOpen: cfg.defaultOpen ?? true,
    collapseScope: ctx.collapseScope,
  };
}
