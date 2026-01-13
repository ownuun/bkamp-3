import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string | null;
      name: string | null;
      image: string | null;
      companies: Array<{
        id: string;
        name: string;
        slug: string;
        role: string;
        isDemo: boolean;
      }>;
      currentCompanyId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    companies?: Array<{
      id: string;
      name: string;
      slug: string;
      role: string;
      isDemo: boolean;
    }>;
    currentCompanyId?: string | null;
    githubAccessToken?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id;

        // Fetch user's companies
        const memberships = await prisma.companyMember.findMany({
          where: { userId: user.id },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                isDemo: true,
              },
            },
          },
        });

        token.companies = memberships.map((m) => ({
          id: m.company.id,
          name: m.company.name,
          slug: m.company.slug,
          role: m.role,
          isDemo: m.company.isDemo,
        }));

        // Set default company (first non-demo company, or first company)
        const nonDemoCompany = token.companies.find((c) => !c.isDemo);
        token.currentCompanyId = nonDemoCompany?.id || token.companies[0]?.id || null;
      }

      // Handle company switch from client
      if (trigger === "update" && session?.currentCompanyId) {
        // Verify user has access to this company
        const hasAccess = token.companies?.some((c) => c.id === session.currentCompanyId);
        if (hasAccess) {
          token.currentCompanyId = session.currentCompanyId;
        }
      }

      if (account?.provider === "github") {
        token.githubAccessToken = account.access_token;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.companies = token.companies || [];
        session.user.currentCompanyId = token.currentCompanyId || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "development",
};
