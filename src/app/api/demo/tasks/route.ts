import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoCompanyId } from "@/lib/demo-context";
import { TaskStatus, Priority } from "@prisma/client";

// GET /api/demo/tasks - Demo company tasks (public, read-only)
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
    const status = searchParams.get("status") as TaskStatus | null;
    const priority = searchParams.get("priority") as Priority | null;
    const userId = searchParams.get("userId");
    const categoryId = searchParams.get("categoryId");

    const tasks = await prisma.task.findMany({
      where: {
        companyId,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(userId && { userId }),
        ...(categoryId && { categoryId }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[API] GET /api/demo/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo tasks" },
      { status: 500 }
    );
  }
}
