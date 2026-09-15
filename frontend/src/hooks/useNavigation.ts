import { useState, useEffect } from "react";

export type NavigationTab =
  | "inicio"
  | "agenda"
  | "atendimento"
  | "clientes"
  | "relatorios"
  | "configuracoes";

export function useNavigation() {
  const getTabFromHash = (): NavigationTab => {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    const validTabs: NavigationTab[] = [
      "inicio",
      "agenda",
      "atendimento",
      "clientes",
      "relatorios",
      "configuracoes",
    ];
    if (validTabs.includes(hash as NavigationTab)) {
      return hash as NavigationTab;
    }
    return "inicio";
  };

  const [activeTab, setActiveTabState] = useState<NavigationTab>(getTabFromHash);

  const setActiveTab = (tab: NavigationTab) => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTabState(getTabFromHash());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return { activeTab, setActiveTab };
}

