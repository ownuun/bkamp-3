import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoCompanyId } from "@/lib/demo-context";
import { GitType } from "@prisma/client";

// GET /api/demo/git-activities - Demo company git activities (public, read-only)
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
    const type = searchParams.get("type") as GitType | null;
    const userId = searchParams.get("userId");
    const repository = searchParams.get("repository");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const whereClause = {
      companyId,
      ...(type && { type }),
      ...(userId && { userId }),
      ...(repository && { repository: { contains: repository, mode: "insensitive" as const } }),
    };

    const activities = await prisma.gitActivity.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            githubUsername: true,
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
      orderBy: { timestamp: "desc" },
      take: Math.min(limit, 500),
      skip: offset,
    });

    const total = await prisma.gitActivity.count({ where: whereClause });

    return NextResponse.json({
      data: activities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + activities.length < total,
      },
    });
  } catch (error) {
    console.error("[API] GET /api/demo/git-activities error:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo git activities" },
      { status: 500 }
    );
  }
}
