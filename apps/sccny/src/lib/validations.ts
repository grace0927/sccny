import { z } from "zod";
import { SermonType as PrismaSermonType } from "../generated/prisma";

export const SermonSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(1, "Title is required"),
  speaker: z.string().min(1, "Speaker is required"),
  date: z
    .string()
    .or(z.date())
    .transform((val) => {
      const date = val instanceof Date ? val : new Date(val);
      return date.toISOString();
    }),
  type: z
    .nativeEnum(PrismaSermonType)
    .optional()
    .default(PrismaSermonType.SERMON),
  series: z.string().optional(),
  scripture: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  audioUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const SermonCreateSchema = SermonSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z
    .string()
    .or(z.date())
    .transform((val) => {
      const date = val instanceof Date ? val : new Date(val);
      return date.toISOString();
    }),
  type: z.nativeEnum(PrismaSermonType).default(PrismaSermonType.SERMON),
});

export const SermonUpdateSchema = SermonCreateSchema.partial();

export const GetSermonsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val)),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => Math.min(parseInt(val), 100)),
  search: z.string().optional(),
  speaker: z.string().optional(),
  series: z.string().optional(),
  type: z.nativeEnum(PrismaSermonType).optional(),
  sortBy: z.enum(["date", "title", "speaker"]).optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type SermonType = z.infer<typeof SermonSchema>;
export type SermonCreateType = z.infer<typeof SermonCreateSchema>;
export type SermonUpdateType = z.infer<typeof SermonUpdateSchema>;
export type GetSermonsQueryType = z.infer<typeof GetSermonsQuerySchema>;

// News validations
import { NewsStatus as PrismaNewsStatus } from "../generated/prisma";

export const NewsSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(1, "Title is required"),
  date: z.union([z.string(), z.date()]).transform((val) => {
    const date = val instanceof Date ? val : new Date(val);
    return date.toISOString();
  }),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  status: z.nativeEnum(PrismaNewsStatus).default(PrismaNewsStatus.PUBLISHED),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const NewsCreateSchema = NewsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const NewsUpdateSchema = NewsCreateSchema.partial();

export const GetNewsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val)),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => Math.min(parseInt(val), 100)),
  status: z
    .nativeEnum(PrismaNewsStatus)
    .optional()
    .default(PrismaNewsStatus.PUBLISHED),
  sortBy: z.enum(["date", "title", "createdAt"]).optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type NewsType = z.infer<typeof NewsSchema>;
export type NewsCreateType = z.infer<typeof NewsCreateSchema>;
export type NewsUpdateType = z.infer<typeof NewsUpdateSchema>;
export type GetNewsQueryType = z.infer<typeof GetNewsQuerySchema>;
