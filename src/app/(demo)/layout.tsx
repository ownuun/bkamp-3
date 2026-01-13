import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Demo Banner */}
      <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                돌아가기
              </Button>
            </Link>
            <p className="text-sm text-yellow-800">
              데모 모드입니다. 데이터를 수정할 수 없습니다.
            </p>
          </div>
          <Link href="/login">
            <Button size="sm">
              로그인하여 시작하기
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
