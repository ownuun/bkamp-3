"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  GitCommit,
  GitPullRequest,
  GitMerge,
  MessageSquare,
  CircleDot,
} from "lucide-react";

interface GitActivity {
  id: string;
  type: "COMMIT" | "PULL_REQUEST" | "REVIEW" | "MERGE" | "ISSUE";
  title: string;
  description: string | null;
  sha: string | null;
  repository: string;
  branch: string | null;
  url: string | null;
  additions: number;
  deletions: number;
  timestamp: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    githubUsername: string | null;
  };
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface Stats {
  todayCommits: number;
  todayPRs: number;
  todayReviews: number;
  todayMerges: number;
}

interface Developer {
  id: string;
  name: string | null;
}

interface GitActivitiesClientProps {
  initialActivities: GitActivity[];
  stats: Stats;
  developers: Developer[];
}

const typeIcons = {
  COMMIT: GitCommit,
  PULL_REQUEST: GitPullRequest,
  REVIEW: MessageSquare,
  MERGE: GitMerge,
  ISSUE: CircleDot,
};

const typeLabels = {
  COMMIT: "커밋",
  PULL_REQUEST: "PR 생성",
  REVIEW: "코드 리뷰",
  MERGE: "머지",
  ISSUE: "이슈 생성",
};

const typeActions = {
  COMMIT: "코드를 커밋했습니다",
  PULL_REQUEST: "PR을 생성했습니다",
  REVIEW: "코드 리뷰를 완료했습니다",
  MERGE: "코드를 머지했습니다",
  ISSUE: "이슈를 생성했습니다",
};

const typeColors = {
  COMMIT: "bg-blue-500",
  PULL_REQUEST: "bg-purple-500",
  REVIEW: "bg-yellow-500",
  MERGE: "bg-green-500",
  ISSUE: "bg-orange-500",
};

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
  if (diffDays < 7) return `${diffDays}일 전`;
  return new Date(date).toLocaleDateString("ko-KR");
}

export default function GitActivitiesClient({
  initialActivities,
  stats,
  developers,
}: GitActivitiesClientProps) {
  const [activities] = useState<GitActivity[]>(initialActivities);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || activity.type === typeFilter;
    const matchesUser = userFilter === "all" || activity.user.id === userFilter;
    return matchesSearch && matchesType && matchesUser;
  });

  const todayTotal = stats.todayCommits + stats.todayPRs + stats.todayReviews + stats.todayMerges;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">개발 활동</h1>
        <p className="text-muted-foreground">
          개발팀의 활동 내역을 확인하세요.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 총 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">커밋</CardTitle>
            <GitCommit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCommits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PR</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayPRs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">리뷰 & 머지</CardTitle>
            <GitMerge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayReviews + stats.todayMerges}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="활동 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="COMMIT">커밋</SelectItem>
            <SelectItem value="PULL_REQUEST">PR</SelectItem>
            <SelectItem value="REVIEW">리뷰</SelectItem>
            <SelectItem value="MERGE">머지</SelectItem>
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="개발자" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {developers.map((dev) => (
              <SelectItem key={dev.id} value={dev.id}>
                {dev.name || "Unknown"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => {
                const Icon = typeIcons[activity.type];
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    {/* Avatar with type indicator */}
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {activity.user.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full ${typeColors[activity.type]} flex items-center justify-center`}
                      >
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>
                        <span className="text-muted-foreground">님이 </span>
                        <span className="text-muted-foreground">{typeActions[activity.type]}</span>
                      </p>
                      <p className="text-sm text-foreground truncate mt-0.5">
                        {activity.title}
                      </p>
                    </div>

                    {/* Time */}
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(activity.timestamp))}
                      </p>
                      {(activity.additions > 0 || activity.deletions > 0) && (
                        <p className="text-xs font-mono mt-1">
                          <span className="text-green-600">+{activity.additions}</span>
                          {" "}
                          <span className="text-red-600">-{activity.deletions}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">활동 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
