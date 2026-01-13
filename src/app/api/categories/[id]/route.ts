import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateCategorySchema } from "@/lib/validations/schemas";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/categories/[id] - Get single category
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
            gitActivities: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("[API] GET /api/categories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const result = updateCategorySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check if category exists
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check uniqueness if changing name or type
    if (data.name || data.type) {
      const newName = data.name || existing.name;
      const newType = data.type || existing.type;

      const duplicate = await prisma.category.findFirst({
        where: {
          name: newName,
          type: newType,
          NOT: { id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Category with this name already exists for this type" },
          { status: 409 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            tasks: true,
            gitActivities: true,
          },
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("[API] PUT /api/categories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
            gitActivities: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if category has associated items
    if (existing._count.tasks > 0 || existing._count.gitActivities > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category with associated tasks or activities",
          counts: existing._count,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/categories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
