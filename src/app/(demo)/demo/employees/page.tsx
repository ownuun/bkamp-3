"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search } from "lucide-react";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  userType: string;
  department: string | null;
  companyRole: string;
  _count: {
    tasks: number;
    gitActivities: number;
  };
};

export default function DemoEmployeesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userType, setUserType] = useState<string>("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (userType !== "all") params.set("userType", userType);

    fetch(`/api/demo/users?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch users:", err);
        setLoading(false);
      });
  }, [search, userType]);

  const filteredUsers = users;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">직원 목록</h1>
        <Badge variant="outline">데모 데이터</Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름 또는 이메일로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={userType} onValueChange={setUserType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="DEVELOPER">개발자</SelectItem>
            <SelectItem value="NON_DEVELOPER">비개발자</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback>
                      {user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {user.name || "Unknown"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant={user.userType === "DEVELOPER" ? "default" : "secondary"}>
                    {user.userType === "DEVELOPER" ? "개발자" : "비개발자"}
                  </Badge>
                  {user.department && (
                    <Badge variant="outline">{user.department}</Badge>
                  )}
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>업무 {user._count.tasks}개</span>
                  <span>Git 활동 {user._count.gitActivities}개</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
