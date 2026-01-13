import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validations/schemas";
import { getCompanyContext, isCompanyContext } from "@/lib/api-utils";
import { TaskStatus, Priority } from "@prisma/client";

// GET /api/tasks - List tasks with optional filters
export async function GET(request: NextRequest) {
  try {
    const context = await getCompanyContext(request);
    if (!isCompanyContext(context)) return context;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as TaskStatus | null;
    const priority = searchParams.get("priority") as Priority | null;
    const categoryId = searchParams.get("categoryId");
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");

    const tasks = await prisma.task.findMany({
      where: {
        companyId: context.companyId,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(categoryId && { categoryId }),
        ...(userId && { userId }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
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
    console.error("[API] GET /api/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const context = await getCompanyContext(request);
    if (!isCompanyContext(context)) return context;

    const body = await request.json();

    // Validate input
    const result = createTaskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify category exists and belongs to the same company
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, companyId: context.companyId },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Verify user exists and is a member of the company
    const userMembership = await prisma.companyMember.findUnique({
      where: {
        userId_companyId: {
          userId: data.userId,
          companyId: context.companyId,
        },
      },
    });
    if (!userMembership) {
      return NextResponse.json({ error: "User not found in this company" }, { status: 404 });
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        estimatedHours: data.estimatedHours,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        categoryId: data.categoryId,
        userId: data.userId,
        companyId: context.companyId,
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
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
