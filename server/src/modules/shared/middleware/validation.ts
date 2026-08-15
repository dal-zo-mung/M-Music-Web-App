import type { RequestHandler } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export function validateObjectIdParam(paramName: string): RequestHandler {
  return (req, res, next) => {
    const value =
      typeof req.params[paramName] === "string"
        ? req.params[paramName].trim()
        : "";

    if (!mongoose.isValidObjectId(value)) {
      return res.status(400).json({
        message: "Invalid resource identifier.",
        success: false,
      });
    }

    req.params[paramName] = value;
    next();
  };
}

// Zod schemas for validation
const usernameOrEmailSchema = z
  .string()
  .min(3)
  .max(100)
  .refine(
    (val) => {
      const isUsername = /^(?=.{3,30}$)[a-z0-9._-]+$/.test(val);
      const isEmail = z.string().email().safeParse(val).success;
      return isUsername || isEmail;
    },
    {
      message: "Must be a valid username or email address",
    },
  );

export const loginSchema = z.object({
  body: z.object({
    username: usernameOrEmailSchema,
    password: z.string().max(128),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^(?=.{3,30}$)[a-z0-9._-]+$/),
    email: z.string().email().max(100),
    password: z.string().min(8).max(128),
    firstName: z.string().max(50),
    lastName: z.string().max(50),
  }),
});

export const profileUpdateSchema = z.object({
  body: z.object({
    displayName: z.string().max(50).optional(),
    firstName: z.string().max(50).nullable().optional(),
    lastName: z.string().max(50).nullable().optional(),
    about: z.string().max(1600).optional(),
    tagline: z.string().max(140).optional(),
    accentKey: z
      .enum(["default", "aurora", "ember", "meadow", "slate"])
      .optional(),
  }),
});

// Validation middleware
export function validateRequest<T extends z.ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = error as z.ZodError;

        res.status(400).json({
          message: "Validation failed",
          errors: validationError.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
          success: false,
        });
        return;
      }
      next(error);
    }
  };
}
