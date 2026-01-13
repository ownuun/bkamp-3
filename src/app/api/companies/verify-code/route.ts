import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/companies/verify-code?code=XXX - Verify invite code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "초대 코드를 입력하세요" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { inviteCode: code.toUpperCase() },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        isDemo: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "유효하지 않은 초대 코드입니다" },
        { status: 404 }
      );
    }

    if (company.isDemo) {
      return NextResponse.json(
        { error: "데모 회사에는 가입할 수 없습니다" },
        { status: 400 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("[API] GET /api/companies/verify-code error:", error);
    return NextResponse.json(
      { error: "초대 코드 확인 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
