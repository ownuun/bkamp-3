"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Trash2, Github, RefreshCw, CheckCircle, XCircle } from "lucide-react";

// Mock data
const developerCategories = [
  { id: "1", name: "기능 개발", color: "#22c55e", isDefault: true },
  { id: "2", name: "버그 수정", color: "#ef4444", isDefault: true },
  { id: "3", name: "코드 리뷰", color: "#eab308", isDefault: true },
  { id: "4", name: "리팩토링", color: "#3b82f6", isDefault: true },
  { id: "5", name: "문서화", color: "#8b5cf6", isDefault: true },
  { id: "6", name: "테스트", color: "#06b6d4", isDefault: true },
];

const nonDeveloperCategories = [
  { id: "7", name: "회의", color: "#f97316", isDefault: true },
  { id: "8", name: "기획/문서 작성", color: "#8b5cf6", isDefault: true },
  { id: "9", name: "고객 응대", color: "#22c55e", isDefault: true },
  { id: "10", name: "마케팅", color: "#ec4899", isDefault: true },
  { id: "11", name: "영업", color: "#3b82f6", isDefault: true },
  { id: "12", name: "디자인", color: "#f43f5e", isDefault: true },
];

export default function SettingsPage() {
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="text-muted-foreground">
          시스템 설정을 관리하세요.
        </p>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">카테고리 관리</TabsTrigger>
          <TabsTrigger value="github">GitHub 연동</TabsTrigger>
          <TabsTrigger value="notifications">알림 설정</TabsTrigger>
          <TabsTrigger value="general">일반</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
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
                    <Label htmlFor="categoryName">카테고리 이름</Label>
                    <Input id="categoryName" placeholder="예: 데이터 분석" />
                  </div>
                  <div className="grid gap-2">
                    <Label>카테고리 타입</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="선택" />
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
                      <Input id="color" type="color" className="w-16 h-10 p-1" defaultValue="#6366f1" />
                      <Input placeholder="#6366f1" className="flex-1" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={() => setIsAddCategoryOpen(false)}>추가</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Developer Categories */}
            <Card>
              <CardHeader>
                <CardTitle>개발자 카테고리</CardTitle>
                <CardDescription>Git 활동 자동 분류에 사용됩니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {developerCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                        {category.isDefault && (
                          <Badge variant="secondary" className="text-xs">기본</Badge>
                        )}
                      </div>
                      {!category.isDefault && (
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Non-Developer Categories */}
            <Card>
              <CardHeader>
                <CardTitle>비개발자 카테고리</CardTitle>
                <CardDescription>업무 등록 시 선택할 수 있습니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nonDeveloperCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                        {category.isDefault && (
                          <Badge variant="secondary" className="text-xs">기본</Badge>
                        )}
                      </div>
                      {!category.isDefault && (
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* GitHub Tab */}
        <TabsContent value="github" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub 연동
              </CardTitle>
              <CardDescription>
                GitHub 계정을 연결하여 개발자 활동을 자동으로 추적합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connection Status */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  {githubConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {githubConnected ? "GitHub 연결됨" : "GitHub 연결 안됨"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {githubConnected
                        ? "organization/repository에 연결되어 있습니다."
                        : "GitHub을 연결하여 개발자 활동을 추적하세요."}
                    </p>
                  </div>
                </div>
                <Button
                  variant={githubConnected ? "outline" : "default"}
                  onClick={() => setGithubConnected(!githubConnected)}
                >
                  <Github className="mr-2 h-4 w-4" />
                  {githubConnected ? "연결 해제" : "GitHub 연결"}
                </Button>
              </div>

              {githubConnected && (
                <>
                  {/* Connected Repositories */}
                  <div className="space-y-3">
                    <Label>연결된 저장소</Label>
                    <div className="space-y-2">
                      {[
                        { name: "company/main-app", status: "active" },
                        { name: "company/api-server", status: "active" },
                        { name: "company/mobile-app", status: "paused" },
                      ].map((repo) => (
                        <div
                          key={repo.name}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-2">
                            <Github className="h-4 w-4" />
                            <span className="font-mono text-sm">{repo.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={repo.status === "active" ? "default" : "secondary"}
                            >
                              {repo.status === "active" ? "활성" : "일시정지"}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              설정
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      저장소 추가
                    </Button>
                  </div>

                  {/* Webhook Status */}
                  <div className="space-y-3">
                    <Label>Webhook 상태</Label>
                    <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700 dark:text-green-300">
                          Webhook이 정상적으로 작동 중입니다.
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        마지막 수신: 5분 전
                      </p>
                    </div>
                  </div>

                  {/* Sync Button */}
                  <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    수동 동기화
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>알림 설정</CardTitle>
              <CardDescription>알림 수신 방법을 설정하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>이메일 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    중요 알림을 이메일로 받습니다.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>일일 리포트</Label>
                  <p className="text-sm text-muted-foreground">
                    매일 업무 요약 리포트를 받습니다.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>주간 리포트</Label>
                  <p className="text-sm text-muted-foreground">
                    매주 월요일 주간 리포트를 받습니다.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>마감일 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    업무 마감일 1일 전 알림을 받습니다.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>일반 설정</CardTitle>
              <CardDescription>시스템 기본 설정을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="companyName">회사명</Label>
                <Input id="companyName" placeholder="회사명을 입력하세요" />
              </div>
              <div className="grid gap-2">
                <Label>시간대</Label>
                <Select defaultValue="asia-seoul">
                  <SelectTrigger>
                    <SelectValue placeholder="시간대 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asia-seoul">Asia/Seoul (KST)</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="america-la">America/Los_Angeles (PST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>언어</Label>
                <Select defaultValue="ko">
                  <SelectTrigger>
                    <SelectValue placeholder="언어 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>설정 저장</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
