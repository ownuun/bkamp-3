"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  type: "DEVELOPER" | "NON_DEVELOPER" | "COMMON";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    tasks: number;
    gitActivities: number;
  };
}

interface CategoriesClientProps {
  initialCategories: Category[];
}

export default function CategoriesClient({
  initialCategories,
}: CategoriesClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    color: "#6366f1",
  });

  const filteredCategories = categories.filter(
    (cat) => filterType === "all" || cat.type === filterType
  );

  const developerCategories = filteredCategories.filter(
    (c) => c.type === "DEVELOPER"
  );
  const nonDeveloperCategories = filteredCategories.filter(
    (c) => c.type === "NON_DEVELOPER"
  );
  const commonCategories = filteredCategories.filter((c) => c.type === "COMMON");

  const handleCreateCategory = async () => {
    if (!formData.name || !formData.type) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          type: formData.type,
          color: formData.color,
        }),
      });

      if (response.ok) {
        setFormData({
          name: "",
          description: "",
          type: "",
          color: "#6366f1",
        });
        setIsDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to create category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    if (category._count.tasks > 0 || category._count.gitActivities > 0) {
      alert(
        "이 카테고리에 연결된 업무 또는 활동이 있어 삭제할 수 없습니다."
      );
      return;
    }

    if (!confirm("이 카테고리를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCategories(categories.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const renderCategoryCard = (
    title: string,
    description: string,
    items: Category[]
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm font-medium">{category.name}</span>
                {category.isDefault && (
                  <Badge variant="outline" className="text-[10px]">
                    기본
                  </Badge>
                )}
                {(category._count.tasks > 0 ||
                  category._count.gitActivities > 0) && (
                  <span className="text-xs text-muted-foreground">
                    ({category._count.tasks + category._count.gitActivities}개
                    사용중)
                  </span>
                )}
              </div>
              {!category.isDefault && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">카테고리 관리</h1>
          <p className="text-muted-foreground">업무 분류 카테고리를 관리하세요.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              카테고리 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 카테고리 추가</DialogTitle>
              <DialogDescription>
                업무 분류를 위한 새 카테고리를 추가하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">카테고리 이름</Label>
                <Input
                  id="name"
                  placeholder="예: 데이터 분석"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">설명 (선택)</Label>
                <Input
                  id="description"
                  placeholder="카테고리 설명"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>카테고리 타입</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="타입 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEVELOPER">개발자</SelectItem>
                    <SelectItem value="NON_DEVELOPER">비개발자</SelectItem>
                    <SelectItem value="COMMON">공통</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">색상</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    className="w-16 h-10 p-1"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                  />
                  <Input
                    placeholder="#6366f1"
                    className="flex-1"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreateCategory} disabled={isSubmitting}>
                {isSubmitting ? "추가 중..." : "추가"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="타입 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="DEVELOPER">개발자</SelectItem>
            <SelectItem value="NON_DEVELOPER">비개발자</SelectItem>
            <SelectItem value="COMMON">공통</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          총 {filteredCategories.length}개 카테고리
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(filterType === "all" || filterType === "DEVELOPER") &&
          developerCategories.length > 0 &&
          renderCategoryCard(
            "개발자 카테고리",
            "Git 활동 자동 분류에 사용됩니다.",
            developerCategories
          )}

        {(filterType === "all" || filterType === "NON_DEVELOPER") &&
          nonDeveloperCategories.length > 0 &&
          renderCategoryCard(
            "비개발자 카테고리",
            "업무 등록 시 선택할 수 있습니다.",
            nonDeveloperCategories
          )}

        {(filterType === "all" || filterType === "COMMON") &&
          commonCategories.length > 0 &&
          renderCategoryCard(
            "공통 카테고리",
            "모든 직원이 사용할 수 있습니다.",
            commonCategories
          )}
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">해당하는 카테고리가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
