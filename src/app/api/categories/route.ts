import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCategorySchema } from "@/lib/validations/schemas";
import { CategoryType } from "@prisma/client";

// GET /api/categories - List categories with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as CategoryType | null;

    const categories = await prisma.category.findMany({
      where: {
        ...(type && { type }),
      },
      include: {
        _count: {
          select: {
            tasks: true,
            gitActivities: true,
          },
        },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[API] GET /api/categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = createCategorySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check if category with same name and type exists
    const existing = await prisma.category.findUnique({
      where: {
        name_type: {
          name: data.name,
          type: data.type,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Category with this name already exists for this type" },
        { status: 409 }
      );
    }

    // Create category
    const category = await prisma.category.create({
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

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/categories error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
