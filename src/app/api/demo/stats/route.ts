import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoCompanyId } from "@/lib/demo-context";

// GET /api/demo/stats - Demo dashboard statistics (public, read-only)
export async function GET() {
  try {
    const companyId = await getDemoCompanyId();

    if (!companyId) {
      return NextResponse.json(
        { error: "Demo company not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

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
      prisma.companyMember.count({ where: { companyId } }),
      prisma.companyMember.count({
        where: { companyId, user: { userType: "DEVELOPER" } },
      }),
      prisma.companyMember.count({
        where: { companyId, user: { userType: "NON_DEVELOPER" } },
      }),
      prisma.gitActivity.count({
        where: { companyId, type: "COMMIT", timestamp: { gte: today } },
      }),
      prisma.gitActivity.count({
        where: { companyId, type: "COMMIT", timestamp: { gte: weekAgo } },
      }),
      prisma.gitActivity.count({
        where: { companyId, type: "PULL_REQUEST", timestamp: { gte: today } },
      }),
      prisma.gitActivity.count({
        where: { companyId, type: "REVIEW", timestamp: { gte: today } },
      }),
      prisma.gitActivity.count({
        where: { companyId, type: "MERGE", timestamp: { gte: today } },
      }),
      prisma.task.count({ where: { companyId, status: "DONE" } }),
      prisma.task.count({ where: { companyId, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { companyId, status: "TODO" } }),
      prisma.gitActivity.findMany({
        where: { companyId },
        take: 5,
        orderBy: { timestamp: "desc" },
        include: {
          user: { select: { name: true, image: true } },
          category: { select: { name: true, color: true } },
        },
      }),
      prisma.task.findMany({
        where: { companyId },
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: {
          user: { select: { name: true, image: true } },
          category: { select: { name: true, color: true } },
        },
      }),
      prisma.user.groupBy({
        by: ["department"],
        _count: { id: true },
        where: {
          department: { not: null },
          companies: { some: { companyId } },
        },
      }),
      prisma.gitActivity.groupBy({
        by: ["type"],
        _count: { id: true },
        where: { companyId, timestamp: { gte: weekAgo } },
      }),
    ]);

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
    console.error("[API] GET /api/demo/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo stats" },
      { status: 500 }
    );
  }
}
