import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard/stats - Aggregated dashboard statistics
export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Run all queries in parallel for performance
    const [
      totalEmployees,
      developerCount,
      nonDeveloperCount,
      todayCommits,
      weeklyCommits,
      todayPRs,
      todayReviews,
      todayMerges,
      completedTasks,
      inProgressTasks,
      todoTasks,
      recentActivities,
      recentTasks,
      departmentStats,
      weeklyActivityByType,
    ] = await Promise.all([
      // Employee counts
      prisma.user.count(),
      prisma.user.count({ where: { userType: "DEVELOPER" } }),
      prisma.user.count({ where: { userType: "NON_DEVELOPER" } }),

      // Today's git activity counts
      prisma.gitActivity.count({
        where: { type: "COMMIT", timestamp: { gte: today } },
      }),
      prisma.gitActivity.count({
        where: { type: "COMMIT", timestamp: { gte: weekAgo } },
      }),
      prisma.gitActivity.count({
        where: { type: "PULL_REQUEST", timestamp: { gte: today } },
      }),
      prisma.gitActivity.count({
        where: { type: "REVIEW", timestamp: { gte: today } },
      }),
      prisma.gitActivity.count({
        where: { type: "MERGE", timestamp: { gte: today } },
      }),

      // Task counts
      prisma.task.count({ where: { status: "DONE" } }),
      prisma.task.count({ where: { status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { status: "TODO" } }),

      // Recent activities
      prisma.gitActivity.findMany({
        take: 5,
        orderBy: { timestamp: "desc" },
        include: {
          user: { select: { name: true, image: true } },
          category: { select: { name: true, color: true } },
        },
      }),

      // Recent tasks
      prisma.task.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: {
          user: { select: { name: true, image: true } },
          category: { select: { name: true, color: true } },
        },
      }),

      // Department statistics
      prisma.user.groupBy({
        by: ["department"],
        _count: { id: true },
        where: { department: { not: null } },
      }),

      // Weekly activity by type
      prisma.gitActivity.groupBy({
        by: ["type"],
        _count: { id: true },
        where: { timestamp: { gte: weekAgo } },
      }),
    ]);

    // Calculate task completion rate
    const totalTasks = completedTasks + inProgressTasks + todoTasks;
    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      employees: {
        total: totalEmployees,
        developers: developerCount,
        nonDevelopers: nonDeveloperCount,
      },
      gitActivity: {
        today: {
          commits: todayCommits,
          pullRequests: todayPRs,
          reviews: todayReviews,
          merges: todayMerges,
          total: todayCommits + todayPRs + todayReviews + todayMerges,
        },
        weekly: {
          commits: weeklyCommits,
          byType: weeklyActivityByType.reduce(
            (acc, item) => {
              acc[item.type] = item._count.id;
              return acc;
            },
            {} as Record<string, number>
          ),
        },
      },
      tasks: {
        completed: completedTasks,
        inProgress: inProgressTasks,
        todo: todoTasks,
        total: totalTasks,
        completionRate: taskCompletionRate,
      },
      recentActivities,
      recentTasks,
      departments: departmentStats.map((d) => ({
        name: d.department,
        count: d._count.id,
      })),
    });
  } catch (error) {
    console.error("[API] GET /api/dashboard/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
