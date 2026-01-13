"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GitCommit,
  GitPullRequest,
  MessageSquare,
  GitMerge,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

type GitActivity = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  repository: string;
  branch: string | null;
  additions: number;
  deletions: number;
  timestamp: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    githubUsername: string | null;
  };
  category: { name: string; color: string } | null;
};

const typeLabels: Record<string, string> = {
  COMMIT: "커밋",
  PULL_REQUEST: "PR",
  REVIEW: "리뷰",
  MERGE: "머지",
  ISSUE: "이슈",
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  COMMIT: GitCommit,
  PULL_REQUEST: GitPullRequest,
  REVIEW: MessageSquare,
  MERGE: GitMerge,
  ISSUE: AlertCircle,
};

export default function DemoGitActivityPage() {
  const [activities, setActivities] = useState<GitActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<string>("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);

    fetch(`/api/demo/git-activities?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setActivities(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch activities:", err);
        setLoading(false);
      });
  }, [type]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Git 활동</h1>
        <Badge variant="outline">데모 데이터</Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="COMMIT">커밋</SelectItem>
            <SelectItem value="PULL_REQUEST">PR</SelectItem>
            <SelectItem value="REVIEW">리뷰</SelectItem>
            <SelectItem value="MERGE">머지</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>활동 내역 ({activities.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = typeIcons[activity.type] || GitCommit;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="p-2 bg-muted rounded-full">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">
                          {typeLabels[activity.type] || activity.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {activity.repository}
                        </span>
                        {activity.branch && (
                          <span className="text-sm text-muted-foreground">
                            @ {activity.branch}
                          </span>
                        )}
                      </div>
                      <p className="font-medium truncate">{activity.title}</p>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={activity.user?.image || undefined} />
                            <AvatarFallback className="text-xs">
                              {activity.user?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {activity.user?.name || "Unknown"}
                          </span>
                        </div>
                        {(activity.additions > 0 || activity.deletions > 0) && (
                          <span className="text-sm">
                            <span className="text-green-600">
                              +{activity.additions}
                            </span>{" "}
                            <span className="text-red-600">
                              -{activity.deletions}
                            </span>
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && activities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">활동 내역이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
