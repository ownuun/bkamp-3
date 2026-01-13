"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, ArrowLeft } from "lucide-react";

export default function JoinCompanyPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"code" | "confirm">("code");
  const [companyInfo, setCompanyInfo] = useState<{
    id: string;
    name: string;
    inviteCode: string;
  } | null>(null);

  // Redirect unauthenticated users to login
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleCodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const inviteCode = formData.get("inviteCode") as string;

    try {
      // Verify invite code
      const response = await fetch(`/api/companies/verify-code?code=${inviteCode}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "유효하지 않은 초대 코드입니다.");
        return;
      }

      setCompanyInfo({
        id: result.id,
        name: result.name,
        inviteCode,
      });
      setStep("confirm");
    } catch {
      setError("초대 코드 확인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCompany = async () => {
    if (!companyInfo) return;

    setIsLoading(true);
    setError("");

    try {
      // Join company (authenticated user just needs invite code)
      const response = await fetch("/api/companies/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: companyInfo.inviteCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "가입에 실패했습니다.");
        return;
      }

      // Update session with new company
      await update({ currentCompanyId: result.company.id });
      localStorage.setItem("currentCompanyId", result.company.id);

      router.push("/dashboard");
    } catch {
      setError("가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative">
          <Link href="/select-company" className="absolute left-6 top-6">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">회사 가입</CardTitle>
          <CardDescription>
            {step === "code"
              ? "초대 코드를 입력하세요"
              : `${companyInfo?.name}에 가입합니다`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "code" ? (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">초대 코드</Label>
                <Input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  placeholder="예: ABC123"
                  className="text-center uppercase tracking-widest"
                  required
                />
              </div>

              <p className="text-sm text-muted-foreground">
                초대 코드는 회사 관리자에게 문의하세요.
              </p>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                코드 확인
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {companyInfo && (
                <div className="p-4 bg-muted rounded-lg text-center space-y-2">
                  <p className="font-medium text-lg">{companyInfo.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {session?.user?.name || session?.user?.email}님으로 가입합니다
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep("code");
                    setCompanyInfo(null);
                    setError("");
                  }}
                  disabled={isLoading}
                >
                  이전
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleJoinCompany}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  가입하기
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
