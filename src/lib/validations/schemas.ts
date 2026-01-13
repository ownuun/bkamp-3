import { z } from "zod";

// User schemas
export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).default("EMPLOYEE"),
  userType: z.enum(["DEVELOPER", "NON_DEVELOPER"]).default("NON_DEVELOPER"),
  department: z.string().optional(),
  githubUsername: z.string().optional(),
  image: z.string().url().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
  userType: z.enum(["DEVELOPER", "NON_DEVELOPER"]).optional(),
  department: z.string().optional().nullable(),
  githubUsername: z.string().optional().nullable(),
  image: z.string().url().optional().nullable(),
});

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  estimatedHours: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  categoryId: z.string().cuid("Invalid category ID"),
  userId: z.string().cuid("Invalid user ID"),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  estimatedHours: z.number().positive().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  categoryId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
});

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#6366f1"),
  type: z.enum(["DEVELOPER", "NON_DEVELOPER", "COMMON"]),
  isDefault: z.boolean().default(false),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  type: z.enum(["DEVELOPER", "NON_DEVELOPER", "COMMON"]).optional(),
  isDefault: z.boolean().optional(),
});

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
