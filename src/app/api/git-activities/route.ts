import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GitType } from "@prisma/client";

// GET /api/git-activities - List git activities (read-only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as GitType | null;
    const userId = searchParams.get("userId");
    const repository = searchParams.get("repository");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categoryId = searchParams.get("categoryId");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const activities = await prisma.gitActivity.findMany({
      where: {
        ...(type && { type }),
        ...(userId && { userId }),
        ...(repository && { repository: { contains: repository, mode: "insensitive" } }),
        ...(categoryId && { categoryId }),
        ...(startDate || endDate
          ? {
              timestamp: {
                ...(startDate && { gte: new Date(startDate) }),
                ...(endDate && { lte: new Date(endDate) }),
              },
            }
          : {}),
      },
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

    // Get total count for pagination
    const total = await prisma.gitActivity.count({
      where: {
        ...(type && { type }),
        ...(userId && { userId }),
        ...(repository && { repository: { contains: repository, mode: "insensitive" } }),
        ...(categoryId && { categoryId }),
        ...(startDate || endDate
          ? {
              timestamp: {
                ...(startDate && { gte: new Date(startDate) }),
                ...(endDate && { lte: new Date(endDate) }),
              },
            }
          : {}),
      },
    });

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
    console.error("[API] GET /api/git-activities error:", error);
    return NextResponse.json(
      { error: "Failed to fetch git activities" },
      { status: 500 }
    );
  }
}
