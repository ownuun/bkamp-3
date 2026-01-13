import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CompanyRole, CategoryType } from "@prisma/client";

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "회사명은 2자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // Create company with user as owner
    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        slug: generateSlug(name.trim()),
        inviteCode: generateInviteCode(),
        members: {
          create: {
            userId: session.user.id,
            role: CompanyRole.OWNER,
          },
        },
      },
      include: {
        members: true,
      },
    });

    // Create default categories for the company
    const defaultCategories = [
      { name: "개발", type: CategoryType.DEVELOPER, color: "#3B82F6", isDefault: true },
      { name: "비개발", type: CategoryType.NON_DEVELOPER, color: "#EC4899", isDefault: true },
      { name: "공통", type: CategoryType.COMMON, color: "#10B981", isDefault: true },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map((cat) => ({
        ...cat,
        companyId: company.id,
      })),
    });

    return NextResponse.json({
      message: "회사가 생성되었습니다.",
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        inviteCode: company.inviteCode,
      },
    });
  } catch (error) {
    console.error("[Create Company]", error);
    return NextResponse.json(
      { error: "회사 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
