import { PrismaClient, Role, UserType, CategoryType, TaskStatus, Priority, GitType, CompanyRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Seeding database...");

  // Create Demo Company (for tutorial mode)
  const demoCompany = await prisma.company.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "데모 회사",
      slug: "demo",
      inviteCode: "DEMO00",
      isDemo: true,
    },
  });

  console.log("Created demo company:", demoCompany.name);

  // Create default categories for Demo Company - Developer
  const developerCategories = await Promise.all([
    prisma.category.create({
      data: { name: "기능 개발", color: "#22c55e", type: CategoryType.DEVELOPER, isDefault: true, companyId: demoCompany.id },
    }),
    prisma.category.create({
      data: { name: "버그 수정", color: "#ef4444", type: CategoryType.DEVELOPER, isDefault: true, companyId: demoCompany.id },
    }),
    prisma.category.create({
      data: { name: "코드 리뷰", color: "#eab308", type: CategoryType.DEVELOPER, isDefault: true, companyId: demoCompany.id },
    }),
    prisma.category.create({
      data: { name: "리팩토링", color: "#3b82f6", type: CategoryType.DEVELOPER, isDefault: true, companyId: demoCompany.id },
    }),
    prisma.category.create({
      data: { name: "문서화", color: "#8b5cf6", type: CategoryType.DEVELOPER, isDefault: true, companyId: demoCompany.id },
    }),
    prisma.category.create({
      data: { name: "테스트", color: "#06b6d4", type: CategoryType.DEVELOPER, isDefault: true, companyId: demoCompany.id },
    }),
  ]);

  // Create default categories for Demo Company - Non-Developer
  const nonDevCategories = await Promise.all([
    prisma.category.create({
      data: { name: "회의", color: "#f97316", type: CategoryType.NON_DEVELOPER, isDefault: true, companyId: demoCompany.id },
    }),
    prisma.category.create({
      data: { name: "기획/문서 작성", color: "#8b5cf6", type: CategoryType.NON_DEVELOPER, isDefault: true, companyId: demoCompany.id },
    }),
    prisma.category.create({
      data: { name: "고객 응대", color: "#22c55e", type: CategoryType.NON_DEVELOPER, isDefault: true, companyId: demoCompany.id },
    }),
    prisma.category.create({
      data: { name: "마케팅", color: "#ec4899", type: CategoryType.NON_DEVELOPER, isDefault: true, companyId: demoCompany.id },
    }),
    prisma.category.create({
      data: { name: "영업", color: "#3b82f6", type: CategoryType.NON_DEVELOPER, isDefault: true, companyId: demoCompany.id },
    }),
    prisma.category.create({
      data: { name: "디자인", color: "#f43f5e", type: CategoryType.NON_DEVELOPER, isDefault: true, companyId: demoCompany.id },
    }),
  ]);

  console.log("Created categories:", developerCategories.length + nonDevCategories.length);

  // Create admin user for Demo Company
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@demo.com",
      name: "관리자",
      password: await hashPassword("admin123"),
      role: Role.ADMIN,
      userType: UserType.NON_DEVELOPER,
      department: "경영",
    },
  });

  // Add admin as OWNER of demo company
  await prisma.companyMember.create({
    data: {
      userId: adminUser.id,
      companyId: demoCompany.id,
      role: CompanyRole.OWNER,
    },
  });

  // Create sample employees for Demo Company
  const employees = await Promise.all([
    prisma.user.create({
      data: {
        email: "kim@demo.com",
        name: "김개발",
        password: await hashPassword("dev123"),
        role: Role.EMPLOYEE,
        userType: UserType.DEVELOPER,
        department: "개발팀",
        githubUsername: "kimdev",
      },
    }),
    prisma.user.create({
      data: {
        email: "choi@demo.com",
        name: "최개발",
        password: await hashPassword("dev123"),
        role: Role.MANAGER,
        userType: UserType.DEVELOPER,
        department: "개발팀",
        githubUsername: "choicode",
      },
    }),
    prisma.user.create({
      data: {
        email: "lee@demo.com",
        name: "이기획",
        password: await hashPassword("plan123"),
        role: Role.EMPLOYEE,
        userType: UserType.NON_DEVELOPER,
        department: "기획팀",
      },
    }),
    prisma.user.create({
      data: {
        email: "park@demo.com",
        name: "박디자인",
        password: await hashPassword("design123"),
        role: Role.EMPLOYEE,
        userType: UserType.NON_DEVELOPER,
        department: "디자인팀",
      },
    }),
    prisma.user.create({
      data: {
        email: "jung@demo.com",
        name: "정마케팅",
        password: await hashPassword("marketing123"),
        role: Role.EMPLOYEE,
        userType: UserType.NON_DEVELOPER,
        department: "마케팅팀",
      },
    }),
  ]);

  // Add all employees as members of demo company
  await Promise.all(
    employees.map((employee, index) =>
      prisma.companyMember.create({
        data: {
          userId: employee.id,
          companyId: demoCompany.id,
          role: index === 1 ? CompanyRole.MANAGER : CompanyRole.MEMBER, // 최개발은 MANAGER
        },
      })
    )
  );

  console.log("Created users:", employees.length + 1);

  // Create sample tasks for Demo Company
  const now = new Date();
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: "마케팅 캠페인 기획서 작성",
        description: "Q1 마케팅 캠페인 기획서를 작성합니다.",
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        categoryId: nonDevCategories[1].id,
        userId: employees[2].id,
        companyId: demoCompany.id,
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        title: "신제품 UI 디자인",
        description: "새로운 모바일 앱 UI 디자인 작업",
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        categoryId: nonDevCategories[5].id,
        userId: employees[3].id,
        companyId: demoCompany.id,
        dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        title: "고객 미팅",
        description: "A사 고객과의 요구사항 미팅",
        status: TaskStatus.DONE,
        priority: Priority.MEDIUM,
        categoryId: nonDevCategories[0].id,
        userId: employees[4].id,
        companyId: demoCompany.id,
        dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        title: "로그인 API 개발",
        description: "JWT 기반 로그인 API 구현",
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        categoryId: developerCategories[0].id,
        userId: employees[0].id,
        companyId: demoCompany.id,
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        estimatedHours: 8,
      },
    }),
    prisma.task.create({
      data: {
        title: "버그: 결제 오류 수정",
        description: "특정 조건에서 결제가 실패하는 버그 수정",
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        categoryId: developerCategories[1].id,
        userId: employees[1].id,
        companyId: demoCompany.id,
        dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        estimatedHours: 4,
      },
    }),
    prisma.task.create({
      data: {
        title: "API 문서 업데이트",
        description: "새로운 엔드포인트에 대한 API 문서 작성",
        status: TaskStatus.TODO,
        priority: Priority.LOW,
        categoryId: developerCategories[4].id,
        userId: employees[0].id,
        companyId: demoCompany.id,
        dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        estimatedHours: 3,
      },
    }),
    prisma.task.create({
      data: {
        title: "SNS 콘텐츠 제작",
        description: "인스타그램/페이스북 홍보 콘텐츠 제작",
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.MEDIUM,
        categoryId: nonDevCategories[3].id,
        userId: employees[4].id,
        companyId: demoCompany.id,
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        title: "신규 고객 미팅 준비",
        description: "B사 신규 고객 미팅 자료 준비",
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        categoryId: nonDevCategories[4].id,
        userId: employees[2].id,
        companyId: demoCompany.id,
        dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        title: "앱 아이콘 리디자인",
        description: "브랜드 가이드라인에 맞춰 앱 아이콘 리디자인",
        status: TaskStatus.DONE,
        priority: Priority.MEDIUM,
        categoryId: nonDevCategories[5].id,
        userId: employees[3].id,
        companyId: demoCompany.id,
        dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        title: "유닛 테스트 작성",
        description: "결제 모듈 유닛 테스트 작성",
        status: TaskStatus.DONE,
        priority: Priority.MEDIUM,
        categoryId: developerCategories[5].id,
        userId: employees[1].id,
        companyId: demoCompany.id,
        dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        estimatedHours: 6,
      },
    }),
  ]);

  console.log("Created tasks:", tasks.length);

  // Create sample git activities for Demo Company
  const gitActivities = await Promise.all([
    prisma.gitActivity.create({
      data: {
        type: GitType.COMMIT,
        title: "feat: 로그인 기능 구현",
        description: "JWT 기반 로그인 기능 구현 완료",
        sha: "a1b2c3d",
        repository: "demo-company/main-app",
        branch: "feature/login",
        userId: employees[0].id,
        companyId: demoCompany.id,
        categoryId: developerCategories[0].id,
        additions: 245,
        deletions: 12,
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    }),
    prisma.gitActivity.create({
      data: {
        type: GitType.PULL_REQUEST,
        title: "PR #42: 사용자 인증 시스템",
        description: "사용자 인증 및 권한 관리 시스템 PR",
        repository: "demo-company/main-app",
        branch: "feature/auth",
        userId: employees[1].id,
        companyId: demoCompany.id,
        categoryId: developerCategories[0].id,
        additions: 520,
        deletions: 30,
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
    }),
    prisma.gitActivity.create({
      data: {
        type: GitType.REVIEW,
        title: "PR #41 코드 리뷰",
        description: "API 엔드포인트 리팩토링 리뷰",
        repository: "demo-company/main-app",
        branch: "refactor/api",
        userId: employees[0].id,
        companyId: demoCompany.id,
        categoryId: developerCategories[2].id,
        timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },
    }),
    prisma.gitActivity.create({
      data: {
        type: GitType.COMMIT,
        title: "fix: 결제 오류 수정",
        description: "특정 조건에서 발생하는 결제 오류 수정",
        sha: "e4f5g6h",
        repository: "demo-company/main-app",
        branch: "hotfix/payment",
        userId: employees[1].id,
        companyId: demoCompany.id,
        categoryId: developerCategories[1].id,
        additions: 15,
        deletions: 8,
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.gitActivity.create({
      data: {
        type: GitType.MERGE,
        title: "Merge PR #40: 대시보드 UI 개선",
        description: "대시보드 UI 개선 작업 머지",
        repository: "demo-company/main-app",
        branch: "main",
        userId: employees[1].id,
        companyId: demoCompany.id,
        categoryId: developerCategories[3].id,
        additions: 180,
        deletions: 45,
        timestamp: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.gitActivity.create({
      data: {
        type: GitType.COMMIT,
        title: "docs: API 문서 업데이트",
        description: "새로운 인증 API 문서 추가",
        sha: "i7j8k9l",
        repository: "demo-company/main-app",
        branch: "docs/api",
        userId: employees[0].id,
        companyId: demoCompany.id,
        categoryId: developerCategories[4].id,
        additions: 120,
        deletions: 5,
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      },
    }),
    prisma.gitActivity.create({
      data: {
        type: GitType.ISSUE,
        title: "Issue #55: 성능 최적화 필요",
        description: "대용량 데이터 로딩 시 성능 저하 이슈",
        repository: "demo-company/main-app",
        userId: employees[0].id,
        companyId: demoCompany.id,
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      },
    }),
    prisma.gitActivity.create({
      data: {
        type: GitType.PULL_REQUEST,
        title: "PR #43: 테스트 커버리지 개선",
        description: "결제 모듈 테스트 커버리지 80% 달성",
        repository: "demo-company/main-app",
        branch: "test/payment",
        userId: employees[1].id,
        companyId: demoCompany.id,
        categoryId: developerCategories[5].id,
        additions: 350,
        deletions: 20,
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.gitActivity.create({
      data: {
        type: GitType.COMMIT,
        title: "refactor: 코드 구조 개선",
        description: "컴포넌트 구조 리팩토링",
        sha: "m0n1o2p",
        repository: "demo-company/main-app",
        branch: "refactor/components",
        userId: employees[0].id,
        companyId: demoCompany.id,
        categoryId: developerCategories[3].id,
        additions: 85,
        deletions: 120,
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.gitActivity.create({
      data: {
        type: GitType.REVIEW,
        title: "PR #42 코드 리뷰 승인",
        description: "인증 시스템 코드 리뷰 완료 및 승인",
        repository: "demo-company/main-app",
        branch: "feature/auth",
        userId: employees[0].id,
        companyId: demoCompany.id,
        categoryId: developerCategories[2].id,
        timestamp: new Date(now.getTime() - 3.5 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log("Created git activities:", gitActivities.length);

  console.log("Seeding completed!");
  console.log("\nDemo account:");
  console.log("  Email: admin@demo.com");
  console.log("  Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
