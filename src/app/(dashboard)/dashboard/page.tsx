import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GitCommit, ClipboardCheck, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";

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

async function getDashboardStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalEmployees, todayCommits, completedTasks, inProgressTasks] =
    await Promise.all([
      prisma.user.count(),
      prisma.gitActivity.count({
        where: { type: "COMMIT", timestamp: { gte: today } },
      }),
      prisma.task.count({ where: { status: "DONE" } }),
      prisma.task.count({ where: { status: "IN_PROGRESS" } }),
    ]);

  return { totalEmployees, todayCommits, completedTasks, inProgressTasks };
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
    action: a.title,
    time: formatRelativeTime(a.timestamp),
    type: a.type.toLowerCase(),
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
        const commitCount = await prisma.gitActivity.count({
          where: { userId: { in: userIds }, type: "COMMIT" },
        });
        return {
          name: dept.department!,
          memberCount: dept._count.id,
          activityCount: commitCount,
          activityLabel: "커밋",
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
      name: "전체 직원",
      value: stats.totalEmployees.toString(),
      icon: Users,
    },
    {
      name: "오늘 커밋",
      value: stats.todayCommits.toString(),
      icon: GitCommit,
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
        {/* Recent Activities */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>팀원들의 최근 Git 활동 내역입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
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
            <CardDescription>부서별 업무 진행 현황입니다.</CardDescription>
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
