import { redirect } from "next/navigation";
import { getDemoCompany } from "@/lib/demo-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  ListTodo,
  GitBranch,
  BarChart3,
  ArrowRight,
} from "lucide-react";

export default async function DemoPage() {
  const demoCompany = await getDemoCompany();

  if (!demoCompany) {
    redirect("/login");
  }

  const features = [
    {
      icon: Users,
      title: "직원 관리",
      description: "개발자와 비개발자를 구분하여 직원들을 관리하세요",
      href: "/demo/employees",
    },
    {
      icon: ListTodo,
      title: "업무 관리",
      description: "각 직원의 업무를 할당하고 진행 상태를 추적하세요",
      href: "/demo/tasks",
    },
    {
      icon: GitBranch,
      title: "Git 활동",
      description: "커밋, PR, 코드 리뷰 등 개발 활동을 모니터링하세요",
      href: "/demo/git-activity",
    },
    {
      icon: BarChart3,
      title: "대시보드",
      description: "팀의 생산성을 한눈에 파악하세요",
      href: "/demo/dashboard",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4 py-12">
        <h1 className="text-4xl font-bold tracking-tight">
          Work Monitor 데모
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          업무 모니터링 시스템의 주요 기능을 체험해보세요.
          <br />
          데모 회사 <strong>{demoCompany.name}</strong>의 데이터를 확인할 수 있습니다.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link href="/demo/dashboard">
            <Button size="lg">
              대시보드 보기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg">
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.href} href={feature.href}>
              <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* CTA */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="flex flex-col md:flex-row items-center justify-between p-8 gap-4">
          <div>
            <h3 className="text-2xl font-bold">직접 사용해보세요</h3>
            <p className="text-primary-foreground/80">
              지금 무료로 시작하고 팀의 생산성을 높이세요
            </p>
          </div>
          <Link href="/register">
            <Button variant="secondary" size="lg">
              무료 시작하기
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
