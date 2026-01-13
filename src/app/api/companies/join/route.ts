import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CompanyRole } from "@prisma/client";
import bcrypt from "bcryptjs";

// POST /api/companies/join - Join company with invite code (with optional new user for registration)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { inviteCode, name, email, password } = body;

    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json({ error: "초대 코드를 입력하세요" }, { status: 400 });
    }

    // Find company by invite code
    const company = await prisma.company.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
    });

    if (!company) {
      return NextResponse.json({ error: "유효하지 않은 초대 코드입니다" }, { status: 404 });
    }

    if (company.isDemo) {
      return NextResponse.json({ error: "데모 회사에는 가입할 수 없습니다" }, { status: 400 });
    }

    // Determine user ID - either from session or create new user
    let userId = session?.user?.id;

    if (!userId) {
      // Registration mode - validate and create user
      if (!email || !password) {
        return NextResponse.json({ error: "이메일과 비밀번호를 입력하세요" }, { status: 400 });
      }

      // Check if email exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        // If user exists but not logged in, check if already member
        const existingMembership = await prisma.companyMember.findUnique({
          where: {
            userId_companyId: {
              userId: existingUser.id,
              companyId: company.id,
            },
          },
        });

        if (existingMembership) {
          return NextResponse.json({ error: "이미 이 회사에 가입되어 있습니다. 로그인하세요." }, { status: 400 });
        }

        return NextResponse.json({ error: "이미 사용 중인 이메일입니다. 로그인 후 가입하세요." }, { status: 409 });
      }

      // Create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          name: name || email.split("@")[0],
          email,
          password: hashedPassword,
        },
      });
      userId = newUser.id;
    } else {
      // Logged in user - check if already a member
      const existingMembership = await prisma.companyMember.findUnique({
        where: {
          userId_companyId: {
            userId,
            companyId: company.id,
          },
        },
      });

      if (existingMembership) {
        return NextResponse.json({ error: "이미 이 회사의 멤버입니다" }, { status: 400 });
      }
    }

    // Add user as MEMBER
    const membership = await prisma.companyMember.create({
      data: {
        userId,
        companyId: company.id,
        role: CompanyRole.MEMBER,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "회사에 성공적으로 가입했습니다",
      company: membership.company,
    });
  } catch (error) {
    console.error("[Companies Join]", error);
    return NextResponse.json({ error: "가입 중 오류가 발생했습니다" }, { status: 500 });
  }
}
