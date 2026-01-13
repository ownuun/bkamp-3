"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Code,
  ListTodo,
  GitCommit,
  GitPullRequest,
  MessageSquare,
  GitMerge,
} from "lucide-react";

type DashboardStats = {
  employees: {
    total: number;
    developers: number;
    nonDevelopers: number;
  };
  gitActivity: {
    today: {
      commits: number;
      pullRequests: number;
      reviews: number;
      merges: number;
      total: number;
    };
    weekly: {
      commits: number;
      byType: Record<string, number>;
    };
  };
  tasks: {
    completed: number;
    inProgress: number;
    todo: number;
    total: number;
    completionRate: number;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: string;
    user: { name: string | null; image: string | null };
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    user: { name: string | null };
    category: { name: string; color: string } | null;
  }>;
};

export default function DemoDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/demo/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">전체 직원</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.employees.total}</div>
            <p className="text-xs text-muted-foreground">
              개발자 {stats.employees.developers}명 / 비개발자{" "}
              {stats.employees.nonDevelopers}명
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">오늘의 커밋</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.gitActivity.today.commits}
            </div>
            <p className="text-xs text-muted-foreground">
              이번 주 {stats.gitActivity.weekly.commits}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">업무 현황</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasks.total}</div>
            <p className="text-xs text-muted-foreground">
              완료율 {stats.tasks.completionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">오늘 Git 활동</CardTitle>
            <GitCommit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.gitActivity.today.total}
            </div>
            <p className="text-xs text-muted-foreground">
              PR {stats.gitActivity.today.pullRequests} / 리뷰{" "}
              {stats.gitActivity.today.reviews}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>최근 Git 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    {activity.type === "COMMIT" && <GitCommit className="h-4 w-4" />}
                    {activity.type === "PULL_REQUEST" && <GitPullRequest className="h-4 w-4" />}
                    {activity.type === "REVIEW" && <MessageSquare className="h-4 w-4" />}
                    {activity.type === "MERGE" && <GitMerge className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user?.name || "Unknown"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 업무</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: task.category?.color || "#6366f1" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.user?.name || "Unknown"} • {task.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
