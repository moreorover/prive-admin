import { z } from "zod";

import type { auth } from "@/lib/auth";

export type Session = typeof auth.$Infer.Session;

export const signInSchema = z.object({
	email: z
		.string()
		.email({ message: "Please enter a valid email address" })
		.min(2)
		.max(50),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" })
		.max(50, { message: "Password cannot exceed 50 characters" }),
	rememberMe: z.boolean(),
});

export const signUpSchema = z
	.object({
		firstName: z.string().min(1, "First name is required"),
		lastName: z.string().min(1, "Last name is required"),
		email: z.string().email("Invalid email address"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string().min(6, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const twoFactorSchema = z.object({
	totp: z.string().length(6, "Totp is 6 digits long"),
});

export const forgotPasswordSchema = z.object({
	email: z.string().email("Invalid email address"),
});

export const backupCodeSchema = z.object({
	code: z.string(),
});

export const changePasswordSchema = z
	.object({
		currentPassword: z.string(),
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string().min(6, "Please confirm your password"),
		signOut: z.boolean(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const resetPasswordSchema = z
	.object({
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string().min(6, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const editUserSchema = z.object({
	fullName: z.string().min(1, "Full name is required."),
});

export const banUserSchema = z.object({
	banReason: z.string().min(1, "BanReason is required."),
});
