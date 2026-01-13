import { prisma } from "@/lib/prisma";
import TasksClient from "./tasks-client";

async function getTasks() {
  return prisma.task.findMany({
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
}

async function getCategories() {
  return prisma.category.findMany({
    where: {
      type: { in: ["NON_DEVELOPER", "COMMON"] },
    },
    orderBy: { name: "asc" },
  });
}

async function getUsers() {
  return prisma.user.findMany({
    where: { userType: "NON_DEVELOPER" },
    select: {
      id: true,
      name: true,
      image: true,
    },
    orderBy: { name: "asc" },
  });
}

export default async function TasksPage() {
  const [tasks, categories, users] = await Promise.all([
    getTasks(),
    getCategories(),
    getUsers(),
  ]);

  // Serialize dates for client component
  const serializedTasks = tasks.map((task) => ({
    ...task,
    dueDate: task.dueDate?.toISOString() || null,
    completedAt: task.completedAt?.toISOString() || null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }));

  const serializedCategories = categories.map((cat) => ({
    ...cat,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  }));

  return (
    <TasksClient
      initialTasks={serializedTasks}
      categories={serializedCategories}
      users={users}
    />
  );
}
