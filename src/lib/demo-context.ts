import { prisma } from "./prisma";

// Demo company is identified by slug "demo"
export const DEMO_COMPANY_SLUG = "demo";

export async function getDemoCompany() {
  const company = await prisma.company.findFirst({
    where: { isDemo: true },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return company;
}

export async function getDemoCompanyId(): Promise<string | null> {
  const company = await getDemoCompany();
  return company?.id || null;
}
