import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoCompanyId } from "@/lib/demo-context";
import { CategoryType } from "@prisma/client";

// GET /api/demo/categories - Demo company categories (public, read-only)
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
    const type = searchParams.get("type") as CategoryType | null;

    const categories = await prisma.category.findMany({
      where: {
        companyId,
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
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[API] GET /api/demo/categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo categories" },
      { status: 500 }
    );
  }
}
