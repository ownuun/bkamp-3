"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"user" | "company">("user");
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setUserData({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    setStep("company");
  };

  const handleCompanySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const companyName = formData.get("companyName") as string;

    try {
      // 1. Create company with user
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          ...userData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "회사 생성에 실패했습니다.");
        return;
      }

      // 2. Auto login
      const signInResult = await signIn("credentials", {
        email: userData.email,
        password: userData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("계정이 생성되었습니다. 로그인 페이지에서 로그인해주세요.");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("회원가입 중 오류가 발생했습니다.");
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
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">새 회사 등록</CardTitle>
          <CardDescription>
            {step === "user"
              ? "먼저 관리자 계정을 생성합니다"
              : "회사 정보를 입력하세요"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`h-2 w-2 rounded-full ${step === "user" ? "bg-primary" : "bg-muted-foreground"}`} />
            <div className={`h-2 w-2 rounded-full ${step === "company" ? "bg-primary" : "bg-muted"}`} />
          </div>

          {step === "user" ? (
            <form onSubmit={handleUserSubmit} className="space-y-4">
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

              <Button type="submit" className="w-full">
                다음
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">회사명</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="예: 테크 스타트업"
                  required
                />
              </div>

              <p className="text-sm text-muted-foreground">
                회사가 생성되면 초대 코드가 자동으로 발급됩니다.
                팀원들을 초대할 때 사용하세요.
              </p>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("user")}
                  disabled={isLoading}
                >
                  이전
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  회사 생성
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
            초대 코드가 있으신가요?{" "}
            <Link href="/join" className="text-primary font-medium hover:underline">
              기존 회사 가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
