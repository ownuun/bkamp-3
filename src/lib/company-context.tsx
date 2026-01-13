"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";

type Company = {
  id: string;
  name: string;
  slug: string;
  role: string;
  isDemo: boolean;
};

type CompanyContextType = {
  currentCompany: Company | null;
  companies: Company[];
  setCurrentCompany: (companyId: string) => Promise<void>;
  isLoading: boolean;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const companies = session?.user?.companies || [];
  const currentCompanyId = session?.user?.currentCompanyId;
  const currentCompany = companies.find((c) => c.id === currentCompanyId) || companies[0] || null;

  useEffect(() => {
    // Store current company ID in localStorage for API calls
    if (currentCompanyId) {
      localStorage.setItem("currentCompanyId", currentCompanyId);
    }
  }, [currentCompanyId]);

  const setCurrentCompany = async (companyId: string) => {
    if (companyId === currentCompanyId) return;

    setIsLoading(true);
    try {
      await update({ currentCompanyId: companyId });
      localStorage.setItem("currentCompanyId", companyId);
      // Optionally refresh the page or refetch data
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        companies,
        setCurrentCompany,
        isLoading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
