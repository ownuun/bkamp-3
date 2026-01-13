import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, GitCommit, ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";

// Simple bar chart component
function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

async function getReportStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    gitActivityCount,
    taskActivityCount,
    activeEmployees,
    totalCommits,
    completedTasks,
  ] = await Promise.all([
    prisma.gitActivity.count({ where: { timestamp: { gte: weekAgo } } }),
    prisma.task.count({ where: { updatedAt: { gte: weekAgo } } }),
    prisma.user.count(),
    prisma.gitActivity.count({
      where: { type: "COMMIT", timestamp: { gte: weekAgo } },
    }),
    prisma.task.count({
      where: { status: "DONE", completedAt: { gte: weekAgo } },
    }),
  ]);

  const totalActivities = gitActivityCount + taskActivityCount;

  return { totalActivities, activeEmployees, totalCommits, completedTasks };
}

async function getWeeklyCommits() {
  const days = ["월", "화", "수", "목", "금"];
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday

  const results = await Promise.all(
    days.map(async (label, index) => {
      const targetDay = index + 1; // 1 = Monday
      const daysAgo = (dayOfWeek - targetDay + 7) % 7;
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.gitActivity.count({
        where: {
          type: "COMMIT",
          timestamp: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      return { label, value: count };
    })
  );

  return results;
}

async function getWeeklyTasks() {
  const days = ["월", "화", "수", "목", "금"];
  const today = new Date();
  const dayOfWeek = today.getDay();

  const results = await Promise.all(
    days.map(async (label, index) => {
      const targetDay = index + 1;
      const daysAgo = (dayOfWeek - targetDay + 7) % 7;
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.task.count({
        where: {
          status: "DONE",
          completedAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      return { label, value: count };
    })
  );

  return results;
}

async function getDepartmentStats() {
  const departments = await prisma.user.groupBy({
    by: ["department"],
    _count: { id: true },
    where: { department: { not: null } },
  });

  const results = await Promise.all(
    departments.map(async (dept) => {
      const users = await prisma.user.findMany({
        where: { department: dept.department },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      const activityCount =
        (await prisma.gitActivity.count({
          where: { userId: { in: userIds } },
        })) +
        (await prisma.task.count({
          where: { userId: { in: userIds } },
        }));

      return {
        label: dept.department!,
        value: activityCount,
      };
    })
  );

  return results.sort((a, b) => b.value - a.value);
}

async function getCategoryStats() {
  const categories = await prisma.category.findMany({
    where: { type: "DEVELOPER" },
    include: {
      _count: {
        select: { gitActivities: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return categories
    .map((cat) => ({
      label: cat.name,
      value: cat._count.gitActivities,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

async function getDeveloperStats() {
  const developers = await prisma.user.findMany({
    where: { userType: "DEVELOPER" },
    select: {
      id: true,
      name: true,
      department: true,
      _count: {
        select: { gitActivities: true },
      },
    },
  });

  const stats = await Promise.all(
    developers.map(async (dev) => {
      const [commits, prs, reviews] = await Promise.all([
        prisma.gitActivity.count({
          where: { userId: dev.id, type: "COMMIT" },
        }),
        prisma.gitActivity.count({
          where: { userId: dev.id, type: "PULL_REQUEST" },
        }),
        prisma.gitActivity.count({
          where: { userId: dev.id, type: "REVIEW" },
        }),
      ]);

      const additions = await prisma.gitActivity.aggregate({
        where: { userId: dev.id },
        _sum: { additions: true, deletions: true },
      });

      return {
        name: dev.name || "Unknown",
        department: dev.department || "미배정",
        commits,
        prs,
        reviews,
        additions: additions._sum.additions || 0,
        deletions: additions._sum.deletions || 0,
      };
    })
  );

  return stats.sort((a, b) => b.commits - a.commits);
}

async function getTaskStats() {
  const [todo, inProgress, done] = await Promise.all([
    prisma.task.count({ where: { status: "TODO" } }),
    prisma.task.count({ where: { status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { status: "DONE" } }),
  ]);

  return { todo, inProgress, done };
}

async function getTaskCategoryStats() {
  const categories = await prisma.category.findMany({
    where: { type: { in: ["NON_DEVELOPER", "COMMON"] } },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });

  return categories
    .map((cat) => ({
      label: cat.name,
      value: cat._count.tasks,
    }))
    .sort((a, b) => b.value - a.value);
}

async function getTeamStats() {
  const departments = await prisma.user.groupBy({
    by: ["department"],
    _count: { id: true },
    where: { department: { not: null } },
  });

  const results = await Promise.all(
    departments.map(async (dept) => {
      const users = await prisma.user.findMany({
        where: { department: dept.department },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      const activity =
        (await prisma.gitActivity.count({
          where: { userId: { in: userIds } },
        })) +
        (await prisma.task.count({
          where: { userId: { in: userIds } },
        }));

      return {
        name: dept.department!,
        members: dept._count.id,
        activity,
      };
    })
  );

  return results.sort((a, b) => b.activity - a.activity);
}

export default async function ReportsPage() {
  const [
    stats,
    weeklyCommits,
    weeklyTasks,
    departmentStats,
    categoryStats,
    developerStats,
    taskStats,
    taskCategoryStats,
    teamStats,
  ] = await Promise.all([
    getReportStats(),
    getWeeklyCommits(),
    getWeeklyTasks(),
    getDepartmentStats(),
    getCategoryStats(),
    getDeveloperStats(),
    getTaskStats(),
    getTaskCategoryStats(),
    getTeamStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">리포트</h1>
          <p className="text-muted-foreground">
            업무 현황을 분석하고 리포트를 확인하세요.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">주간 총 활동</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 직원</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">주간 커밋</CardTitle>
            <GitCommit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCommits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">주간 완료 업무</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="developers">개발자 활동</TabsTrigger>
          <TabsTrigger value="tasks">업무 현황</TabsTrigger>
          <TabsTrigger value="team">팀별 현황</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>주간 Git 활동</CardTitle>
                <CardDescription>이번 주 일별 커밋 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={weeklyCommits} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>주간 업무 완료</CardTitle>
                <CardDescription>이번 주 일별 완료 업무</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={weeklyTasks} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>팀별 활동량</CardTitle>
                <CardDescription>팀별 총 활동</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={departmentStats} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>카테고리별 분포</CardTitle>
                <CardDescription>개발자 활동 카테고리 (상위 5개)</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={categoryStats} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="developers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>개발자별 활동 현황</CardTitle>
              <CardDescription>개발자별 Git 활동 내역</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {developerStats.length > 0 ? (
                  developerStats.map((dev) => (
                    <div
                      key={dev.name}
                      className="flex items-center justify-between border-b pb-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-medium text-primary">
                            {dev.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{dev.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {dev.department}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{dev.commits}</p>
                          <p className="text-muted-foreground">커밋</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{dev.prs}</p>
                          <p className="text-muted-foreground">PR</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{dev.reviews}</p>
                          <p className="text-muted-foreground">리뷰</p>
                        </div>
                        <div className="text-center">
                          <p className="font-mono text-xs">
                            +{dev.additions} / -{dev.deletions}
                          </p>
                          <p className="text-muted-foreground">변경</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    개발자 활동 데이터가 없습니다.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">할 일</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{taskStats.todo}</div>
                <p className="text-xs text-muted-foreground">대기 중인 업무</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">진행 중</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{taskStats.inProgress}</div>
                <p className="text-xs text-muted-foreground">현재 진행 업무</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">완료</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{taskStats.done}</div>
                <p className="text-xs text-muted-foreground">완료된 업무</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>카테고리별 업무 현황</CardTitle>
              <CardDescription>비개발자 업무 카테고리 분포</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={taskCategoryStats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teamStats.length > 0 ? (
              teamStats.map((team) => (
                <Card key={team.name}>
                  <CardHeader>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <CardDescription>{team.members}명</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-bold">{team.activity}</p>
                        <p className="text-sm text-muted-foreground">총 활동</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground col-span-full text-center py-8">
                팀 데이터가 없습니다.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
