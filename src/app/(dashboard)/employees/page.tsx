import { prisma } from "@/lib/prisma";
import EmployeesClient from "./employees-client";

async function getEmployees() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      userType: true,
      department: true,
      githubUsername: true,
      createdAt: true,
      _count: {
        select: {
          tasks: true,
          gitActivities: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function EmployeesPage() {
  const employees = await getEmployees();

  // Serialize dates for client component
  const serializedEmployees = employees.map((emp) => ({
    ...emp,
    createdAt: emp.createdAt.toISOString(),
  }));

  return <EmployeesClient initialEmployees={serializedEmployees} />;
}
