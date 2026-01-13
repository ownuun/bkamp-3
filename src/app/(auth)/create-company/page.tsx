"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, ArrowLeft } from "lucide-react";

export default function CreateCompanyPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const companyName = formData.get("companyName") as string;

    try {
      const response = await fetch("/api/companies/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "회사 생성에 실패했습니다.");
        return;
      }

      // Update session to include new company
      await update();

      // Redirect to dashboard
      router.push("/dashboard");
    } catch {
      setError("회사 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    router.push("/login");
    return null;
  }

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
          <CardTitle className="text-2xl">새 회사 만들기</CardTitle>
          <CardDescription>
            회사를 생성하고 팀원을 초대하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">회사명</Label>
              <Input
                id="companyName"
                name="companyName"
                type="text"
                placeholder="예: 테크 스타트업"
                required
                disabled={isLoading}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              회사가 생성되면 초대 코드가 자동으로 발급됩니다.
              팀원들을 초대할 때 사용하세요.
            </p>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              회사 만들기
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
