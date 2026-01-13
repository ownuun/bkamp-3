import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyContext, isCompanyContext } from "@/lib/api-utils";
import { updateUserSchema } from "@/lib/validations/schemas";
import bcrypt from "bcryptjs";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/users/[id] - Get single user with stats (must be company member)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate company context
    const context = await getCompanyContext(request);
    if (!isCompanyContext(context)) return context;

    const { id } = await params;

    // Check if user is a member of this company
    const membership = await prisma.companyMember.findUnique({
      where: {
        userId_companyId: {
          userId: id,
          companyId: context.companyId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            userType: true,
            department: true,
            githubUsername: true,
            createdAt: true,
            updatedAt: true,
            tasks: {
              where: { companyId: context.companyId },
              take: 5,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
              },
            },
            gitActivities: {
              where: { companyId: context.companyId },
              take: 5,
              orderBy: { timestamp: "desc" },
              select: {
                id: true,
                type: true,
                title: true,
                timestamp: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "User not found in this company" },
        { status: 404 }
      );
    }

    // Count tasks and activities for this company
    const [taskCount, activityCount] = await Promise.all([
      prisma.task.count({
        where: { userId: id, companyId: context.companyId },
      }),
      prisma.gitActivity.count({
        where: { userId: id, companyId: context.companyId },
      }),
    ]);

    return NextResponse.json({
      ...membership.user,
      companyRole: membership.role,
      joinedAt: membership.joinedAt,
      _count: {
        tasks: taskCount,
        gitActivities: activityCount,
      },
    });
  } catch (error) {
    console.error("[API] GET /api/users/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user (self or admin)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate company context
    const context = await getCompanyContext(request);
    if (!isCompanyContext(context)) return context;

    const { id } = await params;

    // Check if user is member of this company
    const membership = await prisma.companyMember.findUnique({
      where: {
        userId_companyId: {
          userId: id,
          companyId: context.companyId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "User not found in this company" },
        { status: 404 }
      );
    }

    // Only self or admin can update
    const isSelf = context.userId === id;
    const isAdmin = ["OWNER", "ADMIN"].includes(context.role);

    if (!isSelf && !isAdmin) {
      return NextResponse.json(
        { error: "You can only update your own profile" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const result = updateUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check email uniqueness if changing email
    if (data.email && data.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailTaken) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }
    }

    // Hash password if provided
    const updateData = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        userType: true,
        department: true,
        githubUsername: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ...user,
      companyRole: membership.role,
    });
  } catch (error) {
    console.error("[API] PUT /api/users/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Remove user from company (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate company context
    const context = await getCompanyContext(request);
    if (!isCompanyContext(context)) return context;

    const { id } = await params;

    // Only admin can remove users
    if (!["OWNER", "ADMIN"].includes(context.role)) {
      return NextResponse.json(
        { error: "Only admins can remove users" },
        { status: 403 }
      );
    }

    // Cannot remove self
    if (context.userId === id) {
      return NextResponse.json(
        { error: "Cannot remove yourself from the company" },
        { status: 400 }
      );
    }

    // Check if user is member of this company
    const membership = await prisma.companyMember.findUnique({
      where: {
        userId_companyId: {
          userId: id,
          companyId: context.companyId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "User not found in this company" },
        { status: 404 }
      );
    }

    // Cannot remove OWNER
    if (membership.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove the company owner" },
        { status: 403 }
      );
    }

    // Remove from company (not delete user)
    await prisma.companyMember.delete({
      where: {
        userId_companyId: {
          userId: id,
          companyId: context.companyId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/users/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to remove user" },
      { status: 500 }
    );
  }
}
