"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Check, Loader2, LogOut, Plus, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SelectCompanyPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If user has only one company, auto-select and redirect
    if (session?.user && session.user.companies.length === 1) {
      handleSelectCompany(session.user.companies[0].id);
    }
  }, [session]);

  const handleSelectCompany = async (companyId: string) => {
    setIsLoading(true);
    setSelectedId(companyId);

    try {
      // Update session with selected company
      await update({ currentCompanyId: companyId });

      // Store in localStorage for API calls
      localStorage.setItem("currentCompanyId", companyId);

      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to select company:", error);
      setIsLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const companies = session.user.companies || [];
  const hasCompanies = companies.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {hasCompanies ? "회사 선택" : "시작하기"}
          </CardTitle>
          <CardDescription>
            {hasCompanies
              ? "접속할 회사를 선택하세요"
              : "새 회사를 만들거나 초대 코드로 가입하세요"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasCompanies ? (
            <>
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleSelectCompany(company.id)}
                  disabled={isLoading}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-colors",
                    "hover:border-primary hover:bg-muted/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    selectedId === company.id && "border-primary bg-muted/50",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {company.name}
                        {company.isDemo && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            Demo
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {company.role === "OWNER" && "소유자"}
                        {company.role === "ADMIN" && "관리자"}
                        {company.role === "MANAGER" && "매니저"}
                        {company.role === "MEMBER" && "멤버"}
                      </p>
                    </div>
                    {selectedId === company.id && isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : selectedId === company.id ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : null}
                  </div>
                </button>
              ))}

              <div className="pt-4 border-t space-y-2">
                <Link href="/create-company">
                  <Button variant="outline" className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    새 회사 등록
                  </Button>
                </Link>
                <Link href="/join-company">
                  <Button variant="outline" className="w-full gap-2">
                    <UserPlus className="h-4 w-4" />
                    초대 코드로 가입
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <Link href="/create-company">
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  새 회사 만들기
                </Button>
              </Link>
              <Link href="/join-company">
                <Button variant="outline" className="w-full gap-2">
                  <UserPlus className="h-4 w-4" />
                  초대 코드로 기존 회사 가입
                </Button>
              </Link>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
