import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoCompanyId } from "@/lib/demo-context";
import { UserType, Role } from "@prisma/client";

// GET /api/demo/users - Demo company members (public, read-only)
export async function GET(request: NextRequest) {
  try {
    const companyId = await getDemoCompanyId();

    if (!companyId) {
      return NextResponse.json(
        { error: "Demo company not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const userType = searchParams.get("userType") as UserType | null;
    const role = searchParams.get("role") as Role | null;
    const search = searchParams.get("search");

    const members = await prisma.companyMember.findMany({
      where: {
        companyId,
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
                tasks: { where: { companyId } },
                gitActivities: { where: { companyId } },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const users = members.map((m) => ({
      ...m.user,
      companyRole: m.role,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("[API] GET /api/demo/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo users" },
      { status: 500 }
    );
  }
}
