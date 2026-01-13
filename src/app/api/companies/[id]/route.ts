import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CompanyRole } from "@prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

// Helper to check membership and role
async function getMembership(userId: string, companyId: string) {
  return prisma.companyMember.findUnique({
    where: {
      userId_companyId: { userId, companyId },
    },
  });
}

// GET /api/companies/[id] - Get company details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a member
    const membership = await getMembership(session.user.id, id);
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            tasks: true,
            categories: true,
            gitActivities: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...company,
      role: membership.role,
      // Only show invite code to ADMIN and OWNER
      inviteCode: (membership.role === CompanyRole.OWNER || membership.role === CompanyRole.ADMIN)
        ? company.inviteCode
        : undefined,
    });
  } catch (error) {
    console.error("[Company GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/companies/[id] - Update company
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is ADMIN or OWNER
    const membership = await getMembership(session.user.id, id);
    if (!membership || (membership.role !== CompanyRole.OWNER && membership.role !== CompanyRole.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, logo, regenerateInviteCode } = body;

    const updateData: { name?: string; logo?: string | null; inviteCode?: string } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return NextResponse.json({ error: "Company name must be at least 2 characters" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (logo !== undefined) {
      updateData.logo = logo;
    }

    // Only OWNER can regenerate invite code
    if (regenerateInviteCode && membership.role === CompanyRole.OWNER) {
      let newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      let codeExists = await prisma.company.findUnique({ where: { inviteCode: newCode } });
      while (codeExists) {
        newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        codeExists = await prisma.company.findUnique({ where: { inviteCode: newCode } });
      }
      updateData.inviteCode = newCode;
    }

    const company = await prisma.company.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("[Company PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/companies/[id] - Delete company (OWNER only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER can delete
    const membership = await getMembership(session.user.id, id);
    if (!membership || membership.role !== CompanyRole.OWNER) {
      return NextResponse.json({ error: "Only the owner can delete the company" }, { status: 403 });
    }

    // Check if it's a demo company
    const company = await prisma.company.findUnique({ where: { id } });
    if (company?.isDemo) {
      return NextResponse.json({ error: "Cannot delete demo company" }, { status: 400 });
    }

    // Delete company (cascade will handle related records)
    await prisma.company.delete({ where: { id } });

    return NextResponse.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("[Company DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
