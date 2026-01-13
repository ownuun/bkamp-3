import { prisma } from "@/lib/prisma";
import CategoriesClient from "./categories-client";

async function getCategories() {
  return prisma.category.findMany({
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
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  // Serialize dates for client component
  const serializedCategories = categories.map((cat) => ({
    ...cat,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  }));

  return <CategoriesClient initialCategories={serializedCategories} />;
}
