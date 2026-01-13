import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { CompanyRole } from "@prisma/client";

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET /api/companies - Get user's companies
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.companyMember.findMany({
      where: { userId: session.user.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            isDemo: true,
            createdAt: true,
            _count: {
              select: {
                members: true,
                tasks: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    const companies = memberships.map((m) => ({
      ...m.company,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json(companies);
  } catch (error) {
    console.error("[Companies GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/companies - Create new company (with optional new user for registration)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { name, companyName, email, password } = body;

    const actualCompanyName = companyName || name;

    if (!actualCompanyName || typeof actualCompanyName !== "string" || actualCompanyName.trim().length < 2) {
      return NextResponse.json({ error: "Company name must be at least 2 characters" }, { status: 400 });
    }

    // If no session, this is a registration request - create user too
    let userId = session?.user?.id;

    if (!userId) {
      // Registration mode - validate user data
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required for registration" }, { status: 400 });
      }

      // Check if email exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: "이미 사용 중인 이메일입니다" }, { status: 409 });
      }

      // Create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          name: body.name || email.split("@")[0],
          email,
          password: hashedPassword,
        },
      });
      userId = newUser.id;
    }

    // Generate unique slug
    let slug = generateSlug(actualCompanyName.trim());
    let slugExists = await prisma.company.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(actualCompanyName.trim())}-${counter}`;
      slugExists = await prisma.company.findUnique({ where: { slug } });
      counter++;
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let codeExists = await prisma.company.findUnique({ where: { inviteCode } });
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await prisma.company.findUnique({ where: { inviteCode } });
    }

    // Create company and add user as OWNER
    const company = await prisma.company.create({
      data: {
        name: actualCompanyName.trim(),
        slug,
        inviteCode,
        members: {
          create: {
            userId,
            role: CompanyRole.OWNER,
          },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    // Create default categories for the new company
    const defaultCategories = [
      { name: "기능 개발", color: "#22c55e", type: "DEVELOPER" as const },
      { name: "버그 수정", color: "#ef4444", type: "DEVELOPER" as const },
      { name: "코드 리뷰", color: "#eab308", type: "DEVELOPER" as const },
      { name: "리팩토링", color: "#3b82f6", type: "DEVELOPER" as const },
      { name: "문서화", color: "#8b5cf6", type: "DEVELOPER" as const },
      { name: "테스트", color: "#06b6d4", type: "DEVELOPER" as const },
      { name: "회의", color: "#f97316", type: "NON_DEVELOPER" as const },
      { name: "기획/문서 작성", color: "#8b5cf6", type: "NON_DEVELOPER" as const },
      { name: "고객 응대", color: "#22c55e", type: "NON_DEVELOPER" as const },
      { name: "마케팅", color: "#ec4899", type: "NON_DEVELOPER" as const },
      { name: "영업", color: "#3b82f6", type: "NON_DEVELOPER" as const },
      { name: "디자인", color: "#f43f5e", type: "NON_DEVELOPER" as const },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map((cat) => ({
        ...cat,
        companyId: company.id,
        isDefault: true,
      })),
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("[Companies POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
