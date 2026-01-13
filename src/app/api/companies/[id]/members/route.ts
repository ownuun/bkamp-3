import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CompanyRole } from "@prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

// Helper to check membership
async function getMembership(userId: string, companyId: string) {
  return prisma.companyMember.findUnique({
    where: {
      userId_companyId: { userId, companyId },
    },
  });
}

// GET /api/companies/[id]/members - Get company members
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

    const members = await prisma.companyMember.findMany({
      where: { companyId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            department: true,
            userType: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // OWNER first
        { joinedAt: "asc" },
      ],
    });

    return NextResponse.json(
      members.map((m) => ({
        ...m.user,
        role: m.role,
        joinedAt: m.joinedAt,
      }))
    );
  } catch (error) {
    console.error("[Company Members GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/companies/[id]/members - Update member role
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
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
    }

    // Validate role
    if (!Object.values(CompanyRole).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check target member exists
    const targetMembership = await getMembership(userId, id);
    if (!targetMembership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Only OWNER can assign OWNER or ADMIN roles
    if ([CompanyRole.OWNER, CompanyRole.ADMIN].includes(role) && membership.role !== CompanyRole.OWNER) {
      return NextResponse.json({ error: "Only owner can assign admin roles" }, { status: 403 });
    }

    // Cannot change OWNER's role (unless transferring ownership)
    if (targetMembership.role === CompanyRole.OWNER && role !== CompanyRole.OWNER) {
      return NextResponse.json({ error: "Cannot demote owner. Transfer ownership first." }, { status: 400 });
    }

    // If assigning new OWNER, demote current owner to ADMIN
    if (role === CompanyRole.OWNER && membership.role === CompanyRole.OWNER) {
      await prisma.$transaction([
        prisma.companyMember.update({
          where: { userId_companyId: { userId: session.user.id, companyId: id } },
          data: { role: CompanyRole.ADMIN },
        }),
        prisma.companyMember.update({
          where: { userId_companyId: { userId, companyId: id } },
          data: { role: CompanyRole.OWNER },
        }),
      ]);
    } else {
      await prisma.companyMember.update({
        where: { userId_companyId: { userId, companyId: id } },
        data: { role },
      });
    }

    return NextResponse.json({ message: "Role updated successfully" });
  } catch (error) {
    console.error("[Company Members PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/companies/[id]/members - Remove member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Check if user is ADMIN or OWNER, or removing themselves
    const membership = await getMembership(session.user.id, id);
    const isSelf = userId === session.user.id;
    const isAdmin = membership && (membership.role === CompanyRole.OWNER || membership.role === CompanyRole.ADMIN);

    if (!membership || (!isAdmin && !isSelf)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check target member
    const targetMembership = await getMembership(userId, id);
    if (!targetMembership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Cannot remove OWNER
    if (targetMembership.role === CompanyRole.OWNER) {
      return NextResponse.json({ error: "Cannot remove company owner" }, { status: 400 });
    }

    // ADMIN cannot remove other ADMINs
    if (targetMembership.role === CompanyRole.ADMIN && membership?.role !== CompanyRole.OWNER) {
      return NextResponse.json({ error: "Only owner can remove admins" }, { status: 403 });
    }

    await prisma.companyMember.delete({
      where: { userId_companyId: { userId, companyId: id } },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("[Company Members DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
