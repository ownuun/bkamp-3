import { PrismaClient, Role, UserType, CategoryType, TaskStatus, Priority, GitType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default categories - Developer
  const developerCategories = await Promise.all([
    prisma.category.upsert({
      where: { name_type: { name: "기능 개발", type: CategoryType.DEVELOPER } },
      update: {},
      create: { name: "기능 개발", color: "#22c55e", type: CategoryType.DEVELOPER, isDefault: true },
    }),
    prisma.category.upsert({
      where: { name_type: { name: "버그 수정", type: CategoryType.DEVELOPER } },
      update: {},
      create: { name: "버그 수정", color: "#ef4444", type: CategoryType.DEVELOPER, isDefault: true },
    }),
    prisma.category.upsert({
      where: { name_type: { name: "코드 리뷰", type: CategoryType.DEVELOPER } },
      update: {},
      create: { name: "코드 리뷰", color: "#eab308", type: CategoryType.DEVELOPER, isDefault: true },
    }),
    prisma.category.upsert({
      where: { name_type: { name: "리팩토링", type: CategoryType.DEVELOPER } },
      update: {},
      create: { name: "리팩토링", color: "#3b82f6", type: CategoryType.DEVELOPER, isDefault: true },
    }),
    prisma.category.upsert({
      where: { name_type: { name: "문서화", type: CategoryType.DEVELOPER } },
      update: {},
      create: { name: "문서화", color: "#8b5cf6", type: CategoryType.DEVELOPER, isDefault: true },
    }),
    prisma.category.upsert({
      where: { name_type: { name: "테스트", type: CategoryType.DEVELOPER } },
      update: {},
      create: { name: "테스트", color: "#06b6d4", type: CategoryType.DEVELOPER, isDefault: true },
    }),
  ]);

  // Create default categories - Non-Developer
  const nonDevCategories = await Promise.all([
    prisma.category.upsert({
      where: { name_type: { name: "회의", type: CategoryType.NON_DEVELOPER } },
      update: {},
      create: { name: "회의", color: "#f97316", type: CategoryType.NON_DEVELOPER, isDefault: true },
    }),
    prisma.category.upsert({
      where: { name_type: { name: "기획/문서 작성", type: CategoryType.NON_DEVELOPER } },
      update: {},
      create: { name: "기획/문서 작성", color: "#8b5cf6", type: CategoryType.NON_DEVELOPER, isDefault: true },
    }),
    prisma.category.upsert({
      where: { name_type: { name: "고객 응대", type: CategoryType.NON_DEVELOPER } },
      update: {},
      create: { name: "고객 응대", color: "#22c55e", type: CategoryType.NON_DEVELOPER, isDefault: true },
    }),
    prisma.category.upsert({
      where: { name_type: { name: "마케팅", type: CategoryType.NON_DEVELOPER } },
      update: {},
      create: { name: "마케팅", color: "#ec4899", type: CategoryType.NON_DEVELOPER, isDefault: true },
    }),
    prisma.category.upsert({
      where: { name_type: { name: "영업", type: CategoryType.NON_DEVELOPER } },
      update: {},
      create: { name: "영업", color: "#3b82f6", type: CategoryType.NON_DEVELOPER, isDefault: true },
    }),
    prisma.category.upsert({
      where: { name_type: { name: "디자인", type: CategoryType.NON_DEVELOPER } },
      update: {},
      create: { name: "디자인", color: "#f43f5e", type: CategoryType.NON_DEVELOPER, isDefault: true },
    }),
  ]);

  console.log("Created categories:", developerCategories.length + nonDevCategories.length);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      name: "관리자",
      password: "admin123", // In production, use bcrypt
      role: Role.ADMIN,
      userType: UserType.NON_DEVELOPER,
      department: "경영",
    },
  });

  // Create sample employees
  const employees = await Promise.all([
    prisma.user.upsert({
      where: { email: "kim@company.com" },
      update: {},
      create: {
        email: "kim@company.com",
        name: "김개발",
        password: "dev123",
        role: Role.EMPLOYEE,
        userType: UserType.DEVELOPER,
        department: "개발팀",
        githubUsername: "kimdev",
      },
    }),
    prisma.user.upsert({
      where: { email: "choi@company.com" },
      update: {},
      create: {
        email: "choi@company.com",
        name: "최개발",
        password: "dev123",
        role: Role.MANAGER,
        userType: UserType.DEVELOPER,
        department: "개발팀",
        githubUsername: "choicode",
      },
    }),
    prisma.user.upsert({
      where: { email: "lee@company.com" },
      update: {},
      create: {
        email: "lee@company.com",
        name: "이기획",
        password: "plan123",
        role: Role.EMPLOYEE,
        userType: UserType.NON_DEVELOPER,
        department: "기획팀",
      },
    }),
    prisma.user.upsert({
      where: { email: "park@company.com" },
      update: {},
      create: {
        email: "park@company.com",
        name: "박디자인",
        password: "design123",
        role: Role.EMPLOYEE,
        userType: UserType.NON_DEVELOPER,
        department: "디자인팀",
      },
    }),
    prisma.user.upsert({
      where: { email: "jung@company.com" },
      update: {},
      create: {
        email: "jung@company.com",
        name: "정마케팅",
        password: "marketing123",
        role: Role.EMPLOYEE,
        userType: UserType.NON_DEVELOPER,
        department: "마케팅팀",
      },
    }),
  ]);

  console.log("Created users:", employees.length + 1);

  // Create sample tasks for non-developers
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: "마케팅 캠페인 기획서 작성",
        description: "Q1 마케팅 캠페인 기획서를 작성합니다.",
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        categoryId: nonDevCategories[1].id, // 기획/문서 작성
        userId: employees[2].id, // 이기획
        dueDate: new Date("2024-01-20"),
      },
    }),
    prisma.task.create({
      data: {
        title: "신제품 UI 디자인",
        description: "새로운 모바일 앱 UI 디자인 작업",
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        categoryId: nonDevCategories[5].id, // 디자인
        userId: employees[3].id, // 박디자인
        dueDate: new Date("2024-01-25"),
      },
    }),
    prisma.task.create({
      data: {
        title: "고객 미팅",
        description: "A사 고객과의 요구사항 미팅",
        status: TaskStatus.DONE,
        priority: Priority.MEDIUM,
        categoryId: nonDevCategories[0].id, // 회의
        userId: employees[4].id, // 정마케팅
        dueDate: new Date("2024-01-15"),
        completedAt: new Date("2024-01-15"),
      },
    }),
  ]);

  console.log("Created tasks:", tasks.length);

  // Create sample git activities for developers
  const gitActivities = await Promise.all([
    prisma.gitActivity.create({
      data: {
        type: GitType.COMMIT,
        title: "feat: 로그인 기능 구현",
        description: "JWT 기반 로그인 기능 구현 완료",
        sha: "a1b2c3d",
        repository: "company/main-app",
        branch: "feature/login",
        userId: employees[0].id, // 김개발
        categoryId: developerCategories[0].id, // 기능 개발
        additions: 245,
        deletions: 12,
        timestamp: new Date(),
      },
    }),
    prisma.gitActivity.create({
      data: {
        type: GitType.PULL_REQUEST,
        title: "PR #42: 사용자 인증 시스템",
        description: "사용자 인증 및 권한 관리 시스템 PR",
        repository: "company/main-app",
        branch: "feature/auth",
        userId: employees[1].id, // 최개발
        categoryId: developerCategories[0].id, // 기능 개발
        additions: 520,
        deletions: 30,
        timestamp: new Date(),
      },
    }),
    prisma.gitActivity.create({
      data: {
        type: GitType.REVIEW,
        title: "PR #41 코드 리뷰",
        description: "API 엔드포인트 리팩토링 리뷰",
        repository: "company/main-app",
        branch: "refactor/api",
        userId: employees[0].id, // 김개발
        categoryId: developerCategories[2].id, // 코드 리뷰
        timestamp: new Date(),
      },
    }),
  ]);

  console.log("Created git activities:", gitActivities.length);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
