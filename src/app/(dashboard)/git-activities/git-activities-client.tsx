"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  GitCommit,
  GitPullRequest,
  GitMerge,
  MessageSquare,
  ExternalLink,
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
  PULL_REQUEST: "PR",
  REVIEW: "리뷰",
  MERGE: "머지",
  ISSUE: "이슈",
};

const typeColors = {
  COMMIT: "bg-blue-100 text-blue-700",
  PULL_REQUEST: "bg-purple-100 text-purple-700",
  REVIEW: "bg-yellow-100 text-yellow-700",
  MERGE: "bg-green-100 text-green-700",
  ISSUE: "bg-orange-100 text-orange-700",
};

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
      activity.repository.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || activity.type === typeFilter;
    const matchesUser = userFilter === "all" || activity.user.id === userFilter;
    return matchesSearch && matchesType && matchesUser;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Git 활동</h1>
        <p className="text-muted-foreground">
          개발자들의 Git 활동 내역을 확인하세요. GitHub Webhook으로 자동 수집됩니다.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 커밋</CardTitle>
            <GitCommit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCommits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PR 생성</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayPRs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">코드 리뷰</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayReviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">머지</CardTitle>
            <GitMerge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayMerges}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="제목, 저장소로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="타입 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="COMMIT">커밋</SelectItem>
            <SelectItem value="PULL_REQUEST">PR</SelectItem>
            <SelectItem value="REVIEW">리뷰</SelectItem>
            <SelectItem value="MERGE">머지</SelectItem>
            <SelectItem value="ISSUE">이슈</SelectItem>
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="개발자 필터" />
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
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">목록 보기</TabsTrigger>
          <TabsTrigger value="timeline">타임라인</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>타입</TableHead>
                  <TableHead>내용</TableHead>
                  <TableHead>개발자</TableHead>
                  <TableHead>저장소</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>변경</TableHead>
                  <TableHead>시간</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => {
                    const Icon = typeIcons[activity.type];
                    return (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <Badge
                            className={typeColors[activity.type]}
                            variant="secondary"
                          >
                            <Icon className="h-3 w-3 mr-1" />
                            {typeLabels[activity.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {activity.title}
                              {activity.sha && (
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                  {activity.sha.substring(0, 7)}
                                </code>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {activity.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {activity.user.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{activity.user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <span className="font-mono">{activity.repository}</span>
                            {activity.url && (
                              <a
                                href={activity.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                              </a>
                            )}
                          </div>
                          {activity.branch && (
                            <div className="text-xs text-muted-foreground">
                              {activity.branch}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {activity.category ? (
                            <Badge variant="outline">{activity.category.name}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {activity.additions > 0 || activity.deletions > 0 ? (
                            <div className="text-sm font-mono">
                              <span className="text-green-600">
                                +{activity.additions}
                              </span>
                              {" / "}
                              <span className="text-red-600">
                                -{activity.deletions}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatTimestamp(activity.timestamp)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">Git 활동이 없습니다.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <div className="space-y-4">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity, index) => {
                const Icon = typeIcons[activity.type];
                return (
                  <div key={activity.id} className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${typeColors[activity.type]}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {index < filteredActivities.length - 1 && (
                        <div className="w-0.5 h-full bg-border absolute top-10" />
                      )}
                    </div>
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{activity.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[10px]">
                                    {activity.user.name?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{activity.user.name}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {activity.repository}
                              </span>
                              {(activity.additions > 0 || activity.deletions > 0) && (
                                <span className="text-sm font-mono">
                                  <span className="text-green-600">
                                    +{activity.additions}
                                  </span>
                                  {" / "}
                                  <span className="text-red-600">
                                    -{activity.deletions}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Git 활동이 없습니다.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
