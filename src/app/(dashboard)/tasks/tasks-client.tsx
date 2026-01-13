"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Calendar, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  estimatedHours: number | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  category: {
    id: string;
    name: string;
    color: string;
  };
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface TasksClientProps {
  initialTasks: Task[];
  categories: Category[];
  users: User[];
}

const statusColors = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

const statusLabels = {
  TODO: "할 일",
  IN_PROGRESS: "진행 중",
  DONE: "완료",
};

const priorityColors = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};

const priorityLabels = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
};

export default function TasksClient({
  initialTasks,
  categories,
  users,
}: TasksClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    userId: "",
    priority: "MEDIUM",
    dueDate: "",
  });

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.user.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === "TODO");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "IN_PROGRESS");
  const doneTasks = filteredTasks.filter((t) => t.status === "DONE");

  const handleCreateTask = async () => {
    if (!formData.title || !formData.categoryId || !formData.userId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          categoryId: formData.categoryId,
          userId: formData.userId,
          priority: formData.priority,
          dueDate: formData.dueDate || undefined,
        }),
      });

      if (response.ok) {
        setFormData({
          title: "",
          description: "",
          categoryId: "",
          userId: "",
          priority: "MEDIUM",
          dueDate: "",
        });
        setIsDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("이 업무를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks(tasks.filter((t) => t.id !== taskId));
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ko-KR");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">업무 목록</h1>
          <p className="text-muted-foreground">
            비개발자 직원들의 업무를 관리하세요.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              업무 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>새 업무 추가</DialogTitle>
              <DialogDescription>새로운 업무 정보를 입력하세요.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">업무 제목</Label>
                <Input
                  id="title"
                  placeholder="업무 제목을 입력하세요"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">설명</Label>
                <Input
                  id="description"
                  placeholder="업무 설명을 입력하세요"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>카테고리</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoryId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>담당자</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, userId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>우선순위</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">낮음</SelectItem>
                      <SelectItem value="MEDIUM">보통</SelectItem>
                      <SelectItem value="HIGH">높음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">마감일</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreateTask} disabled={isSubmitting}>
                {isSubmitting ? "추가 중..." : "추가"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="업무 제목, 담당자로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="TODO">할 일</SelectItem>
            <SelectItem value="IN_PROGRESS">진행 중</SelectItem>
            <SelectItem value="DONE">완료</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs View */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">목록 보기</TabsTrigger>
          <TabsTrigger value="kanban">칸반 보기</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>업무</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>우선순위</TableHead>
                  <TableHead>마감일</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {task.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {task.user.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{task.user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{task.category.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[task.status]}
                          variant="secondary"
                        >
                          {statusLabels[task.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={priorityColors[task.priority]}
                          variant="secondary"
                        >
                          {priorityLabels[task.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(task.id, "TODO")}
                            >
                              할 일로 변경
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(task.id, "IN_PROGRESS")
                              }
                            >
                              진행 중으로 변경
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(task.id, "DONE")}
                            >
                              완료로 변경
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">업무가 없습니다.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="kanban">
          <div className="grid grid-cols-3 gap-4">
            {/* TODO Column */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                할 일 ({todoTasks.length})
              </h3>
              <div className="space-y-3">
                {todoTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border bg-card p-3 shadow-sm"
                  >
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">
                          {task.user.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <Badge
                        className={priorityColors[task.priority]}
                        variant="secondary"
                      >
                        {priorityLabels[task.priority]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IN_PROGRESS Column */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                진행 중 ({inProgressTasks.length})
              </h3>
              <div className="space-y-3">
                {inProgressTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border bg-card p-3 shadow-sm"
                  >
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">
                          {task.user.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <Badge
                        className={priorityColors[task.priority]}
                        variant="secondary"
                      >
                        {priorityLabels[task.priority]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DONE Column */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                완료 ({doneTasks.length})
              </h3>
              <div className="space-y-3">
                {doneTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border bg-card p-3 shadow-sm"
                  >
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">
                          {task.user.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <Badge
                        className={priorityColors[task.priority]}
                        variant="secondary"
                      >
                        {priorityLabels[task.priority]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
