import { prisma } from "@/lib/prisma";
import GitActivitiesClient from "./git-activities-client";

async function getGitActivities() {
  return prisma.gitActivity.findMany({
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
    take: 100,
  });
}

async function getStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [todayCommits, todayPRs, todayReviews, todayMerges] = await Promise.all([
    prisma.gitActivity.count({
      where: { type: "COMMIT", timestamp: { gte: today } },
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
  ]);

  return { todayCommits, todayPRs, todayReviews, todayMerges };
}

async function getDevelopers() {
  return prisma.user.findMany({
    where: { userType: "DEVELOPER" },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });
}

export default async function GitActivitiesPage() {
  const [activities, stats, developers] = await Promise.all([
    getGitActivities(),
    getStats(),
    getDevelopers(),
  ]);

  // Serialize dates for client component
  const serializedActivities = activities.map((activity) => ({
    ...activity,
    timestamp: activity.timestamp.toISOString(),
    createdAt: activity.createdAt.toISOString(),
  }));

  return (
    <GitActivitiesClient
      initialActivities={serializedActivities}
      stats={stats}
      developers={developers}
    />
  );
}
