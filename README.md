# Work Monitor - 업무 모니터링 시스템

개발자 및 비개발자 직원들의 업무 현황을 한눈에 파악할 수 있는 통합 업무 모니터링 시스템입니다.

## 주요 기능

### 개발자 모니터링 (자동)
- GitHub 연동으로 커밋, PR, 코드 리뷰 자동 수집
- 자동 업무 분류 (기능 개발, 버그 수정, 리팩토링 등)
- 일간/주간/월간 통계

### 비개발자 업무 관리
- 업무 등록 및 상태 관리 (할 일 → 진행 중 → 완료)
- 카테고리별 분류 (회의, 기획, 마케팅, 영업, 디자인 등)
- 칸반 보드 및 목록 보기

### 대시보드 & 리포트
- 전사 업무 현황 대시보드
- 팀별/개인별 상세 리포트
- 엑셀/PDF 내보내기 (예정)

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Auth**: NextAuth.js (GitHub OAuth + Credentials)
- **Charts**: Recharts

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 아래 내용을 설정하세요:

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# GitHub OAuth (https://github.com/settings/developers)
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"
```

### 3. 데이터베이스 설정

```bash
# 스키마 적용
npm run db:push

# 시드 데이터 추가 (선택)
npm run db:seed
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 기본 계정 (Seed 데이터)

| 이메일 | 비밀번호 | 역할 |
|--------|----------|------|
| admin@company.com | admin123 | 관리자 |
| kim@company.com | dev123 | 개발자 |
| lee@company.com | plan123 | 기획자 |

## 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/           # 인증 페이지 (로그인)
│   ├── (dashboard)/      # 대시보드 레이아웃
│   │   ├── dashboard/    # 메인 대시보드
│   │   ├── employees/    # 직원 관리
│   │   ├── tasks/        # 업무 목록
│   │   ├── git-activities/ # Git 활동
│   │   ├── categories/   # 카테고리 관리
│   │   ├── reports/      # 리포트
│   │   └── settings/     # 설정
│   └── api/              # API 라우트
├── components/
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── providers/        # Context Providers
│   └── ui/               # shadcn/ui 컴포넌트
├── lib/
│   ├── auth.ts           # NextAuth 설정
│   ├── prisma.ts         # Prisma 클라이언트
│   └── utils.ts          # 유틸리티 함수
└── prisma/
    ├── schema.prisma     # 데이터베이스 스키마
    └── seed.ts           # 시드 데이터
```

## 스크립트

```bash
npm run dev       # 개발 서버 실행
npm run build     # 프로덕션 빌드
npm run start     # 프로덕션 서버 실행
npm run db:push   # Prisma 스키마 적용
npm run db:seed   # 시드 데이터 추가
npm run db:studio # Prisma Studio 실행
```

## GitHub 연동 설정

1. [GitHub Developer Settings](https://github.com/settings/developers)에서 OAuth App 생성
2. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Client ID와 Client Secret을 `.env`에 설정

## 라이선스

MIT
