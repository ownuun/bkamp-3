"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  user: { id: string; name: string | null; image: string | null };
  category: { id: string; name: string; color: string } | null;
};

const statusLabels: Record<string, string> = {
  TODO: "할 일",
  IN_PROGRESS: "진행 중",
  DONE: "완료",
};

const priorityLabels: Record<string, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
};

export default function DemoTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (priority !== "all") params.set("priority", priority);

    fetch(`/api/demo/tasks?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch tasks:", err);
        setLoading(false);
      });
  }, [status, priority]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "DONE":
        return "default" as const;
      case "IN_PROGRESS":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "destructive" as const;
      case "MEDIUM":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">업무 목록</h1>
        <Badge variant="outline">데모 데이터</Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="TODO">할 일</SelectItem>
            <SelectItem value="IN_PROGRESS">진행 중</SelectItem>
            <SelectItem value="DONE">완료</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="우선순위" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="HIGH">높음</SelectItem>
            <SelectItem value="MEDIUM">보통</SelectItem>
            <SelectItem value="LOW">낮음</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>업무 ({tasks.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>우선순위</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{task.user?.name || "미배정"}</TableCell>
                    <TableCell>
                      {task.category && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: task.category.color }}
                          />
                          <span>{task.category.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(task.status)}>
                        {statusLabels[task.status] || task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityVariant(task.priority)}>
                        {priorityLabels[task.priority] || task.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && tasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">업무가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
