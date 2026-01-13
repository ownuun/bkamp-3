import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { CompanyRole } from "@prisma/client";

export type CompanyContext = {
  userId: string;
  companyId: string;
  role: CompanyRole;
};

export async function getCompanyContext(request: NextRequest): Promise<CompanyContext | NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get company ID from header or query param
  const companyId = request.headers.get("x-company-id") ||
    new URL(request.url).searchParams.get("companyId") ||
    session.user.currentCompanyId;

  if (!companyId) {
    return NextResponse.json({ error: "Company ID required" }, { status: 400 });
  }

  // Check membership
  const membership = await prisma.companyMember.findUnique({
    where: {
      userId_companyId: {
        userId: session.user.id,
        companyId,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return {
    userId: session.user.id,
    companyId,
    role: membership.role,
  };
}

export function isCompanyContext(result: CompanyContext | NextResponse): result is CompanyContext {
  return !("status" in result);
}

// Check if user has admin role (OWNER or ADMIN)
export function isAdmin(role: CompanyRole): boolean {
  return role === CompanyRole.OWNER || role === CompanyRole.ADMIN;
}

// Check if user has manager role (OWNER, ADMIN, or MANAGER)
export function isManager(role: CompanyRole): boolean {
  return role === CompanyRole.OWNER || role === CompanyRole.ADMIN || role === CompanyRole.MANAGER;
}
