import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Activity, ClipboardCheck, Clock, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// Helper to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${diffDays}일 전`;
}

// Helper to get action text for activity type
function getActionText(type: string): string {
  switch (type) {
    case "COMMIT":
      return "코드를 커밋했습니다";
    case "PULL_REQUEST":
      return "PR을 생성했습니다";
    case "REVIEW":
      return "코드 리뷰를 완료했습니다";
    case "MERGE":
      return "코드를 머지했습니다";
    case "ISSUE":
      return "이슈를 생성했습니다";
    default:
      return "활동을 했습니다";
  }
}

async function getDashboardStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [developerCount, todayActivities, completedTasks, inProgressTasks] =
    await Promise.all([
      prisma.user.count({ where: { userType: "DEVELOPER" } }),
      prisma.gitActivity.count({
        where: { timestamp: { gte: today } },
      }),
      prisma.task.count({ where: { status: "DONE" } }),
      prisma.task.count({ where: { status: "IN_PROGRESS" } }),
    ]);

  return { developerCount, todayActivities, completedTasks, inProgressTasks };
}

async function getRecentActivities() {
  const activities = await prisma.gitActivity.findMany({
    take: 5,
    orderBy: { timestamp: "desc" },
    include: {
      user: { select: { name: true } },
    },
  });

  return activities.map((a) => ({
    user: a.user.name || "Unknown",
    action: getActionText(a.type),
    title: a.title,
    time: formatRelativeTime(a.timestamp),
  }));
}

async function getDepartmentStats() {
  const departments = await prisma.user.groupBy({
    by: ["department"],
    _count: { id: true },
    where: { department: { not: null } },
  });

  // Get activity counts by department
  const deptStats = await Promise.all(
    departments.map(async (dept) => {
      const users = await prisma.user.findMany({
        where: { department: dept.department },
        select: { id: true, userType: true },
      });

      const userIds = users.map((u) => u.id);
      const isDeveloperDept = users.some((u) => u.userType === "DEVELOPER");

      if (isDeveloperDept) {
        const activityCount = await prisma.gitActivity.count({
          where: { userId: { in: userIds } },
        });
        return {
          name: dept.department!,
          memberCount: dept._count.id,
          activityCount: activityCount,
          activityLabel: "개발 활동",
        };
      } else {
        const taskCount = await prisma.task.count({
          where: { userId: { in: userIds } },
        });
        return {
          name: dept.department!,
          memberCount: dept._count.id,
          activityCount: taskCount,
          activityLabel: "업무",
        };
      }
    })
  );

  return deptStats;
}

export default async function DashboardPage() {
  const [stats, recentActivities, departmentStats] = await Promise.all([
    getDashboardStats(),
    getRecentActivities(),
    getDepartmentStats(),
  ]);

  const statsData = [
    {
      name: "개발자",
      value: stats.developerCount.toString(),
      icon: Users,
    },
    {
      name: "오늘 개발 활동",
      value: stats.todayActivities.toString(),
      icon: Activity,
    },
    {
      name: "완료된 업무",
      value: stats.completedTasks.toString(),
      icon: ClipboardCheck,
    },
    {
      name: "진행 중 업무",
      value: stats.inProgressTasks.toString(),
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          전체 업무 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Development Activities */}
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>최근 개발 활동</CardTitle>
                <CardDescription>개발팀의 최근 활동입니다.</CardDescription>
              </div>
              <Link href="/git-activities">
                <Button variant="outline" size="sm" className="gap-1">
                  자세히 보기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-primary">
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>
                        <span className="text-muted-foreground">님이 {activity.action}</span>
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.title}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {activity.time}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">최근 활동이 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Overview */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>팀별 현황</CardTitle>
            <CardDescription>부서별 활동 현황입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentStats.length > 0 ? (
                departmentStats.map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{dept.name}</p>
                      <p className="text-xs text-muted-foreground">{dept.memberCount}명</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {dept.activityCount} {dept.activityLabel}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">부서 정보가 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
