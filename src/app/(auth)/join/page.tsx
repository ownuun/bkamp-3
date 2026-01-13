"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";

export default function JoinPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"code" | "user">("code");
  const [companyInfo, setCompanyInfo] = useState<{
    id: string;
    name: string;
    inviteCode: string;
  } | null>(null);

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
      setStep("user");
    } catch {
      setError("초대 코드 확인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      // Join company
      const response = await fetch("/api/companies/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: companyInfo?.inviteCode,
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "가입에 실패했습니다.");
        return;
      }

      // Auto login
      const signInResult = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });

      if (signInResult?.error) {
        setError("계정이 생성되었습니다. 로그인 페이지에서 로그인해주세요.");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">기존 회사 가입</CardTitle>
          <CardDescription>
            {step === "code"
              ? "초대 코드를 입력하세요"
              : `${companyInfo?.name}에 가입합니다`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`h-2 w-2 rounded-full ${step === "code" ? "bg-primary" : "bg-muted-foreground"}`} />
            <div className={`h-2 w-2 rounded-full ${step === "user" ? "bg-primary" : "bg-muted"}`} />
          </div>

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
            <form onSubmit={handleUserSubmit} className="space-y-4">
              {companyInfo && (
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="font-medium">{companyInfo.name}</p>
                  <p className="text-sm text-muted-foreground">에 가입합니다</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="홍길동"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="8자 이상 입력하세요"
                  minLength={8}
                  required
                />
              </div>

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
                  }}
                  disabled={isLoading}
                >
                  이전
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  가입하기
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              로그인
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            새 회사를 만드시겠어요?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              회사 등록
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
