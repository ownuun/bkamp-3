import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyContext, isCompanyContext, isAdmin } from "@/lib/api-utils";
import { createUserSchema } from "@/lib/validations/schemas";
import bcrypt from "bcryptjs";
import { UserType, Role } from "@prisma/client";

// GET /api/users - List company members with optional filters
export async function GET(request: NextRequest) {
  try {
    // Validate company context
    const context = await getCompanyContext(request);
    if (!isCompanyContext(context)) return context;

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const userType = searchParams.get("userType") as UserType | null;
    const role = searchParams.get("role") as Role | null;
    const search = searchParams.get("search");

    // Get company members
    const members = await prisma.companyMember.findMany({
      where: {
        companyId: context.companyId,
        user: {
          ...(department && { department }),
          ...(userType && { userType }),
          ...(role && { role }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }),
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
            _count: {
              select: {
                tasks: {
                  where: { companyId: context.companyId },
                },
                gitActivities: {
                  where: { companyId: context.companyId },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    // Transform to user-centric format with company role
    const users = members.map((m) => ({
      ...m.user,
      companyRole: m.role,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("[API] GET /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user and add to company
export async function POST(request: NextRequest) {
  try {
    // Validate company context (must be ADMIN or OWNER to add users)
    const context = await getCompanyContext(request);
    if (!isCompanyContext(context)) return context;

    if (!isAdmin(context.role)) {
      return NextResponse.json(
        { error: "Only admins can add users" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const result = createUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      // If user exists, check if already in this company
      const existingMember = await prisma.companyMember.findUnique({
        where: {
          userId_companyId: {
            userId: existing.id,
            companyId: context.companyId,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this company" },
          { status: 409 }
        );
      }

      // Add existing user to company
      await prisma.companyMember.create({
        data: {
          userId: existing.id,
          companyId: context.companyId,
          role: "MEMBER",
        },
      });

      return NextResponse.json(
        {
          ...existing,
          companyRole: "MEMBER",
        },
        { status: 201 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user and add to company in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
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
        },
      });

      await tx.companyMember.create({
        data: {
          userId: newUser.id,
          companyId: context.companyId,
          role: "MEMBER",
        },
      });

      return newUser;
    });

    return NextResponse.json(
      {
        ...user,
        companyRole: "MEMBER",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] POST /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
