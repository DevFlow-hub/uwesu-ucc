import { z } from 'zod';

// Authentication schemas
export const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(128, { message: "Password must be less than 128 characters" }),
  fullName: z.string().trim().min(1, { message: "Name is required" }).max(100, { message: "Name must be less than 100 characters" }).optional(),
});

// Notification schema
export const notificationSchema = z.object({
  title: z.string().trim().min(1, { message: "Title is required" }).max(100, { message: "Title must be less than 100 characters" }),
  message: z.string().trim().min(1, { message: "Message is required" }).max(1000, { message: "Message must be less than 1000 characters" }),
});

// Event schema
export const eventSchema = z.object({
  title: z.string().trim().min(1, { message: "Title is required" }).max(200, { message: "Title must be less than 200 characters" }),
  description: z.string().trim().max(2000, { message: "Description must be less than 2000 characters" }).optional(),
  venue: z.string().trim().max(200, { message: "Venue must be less than 200 characters" }).optional(),
  event_date: z.string().min(1, { message: "Event date is required" }),
});

// Comment schema
export const commentSchema = z.object({
  content: z.string().trim().min(1, { message: "Comment cannot be empty" }).max(500, { message: "Comment must be less than 500 characters" }),
});

// Profile schema
export const profileSchema = z.object({
  full_name: z.string().trim().min(1, { message: "Name is required" }).max(100, { message: "Name must be less than 100 characters" }),
  bio: z.string().trim().max(500, { message: "Bio must be less than 500 characters" }).optional(),
  phone: z.string().trim().max(20, { message: "Phone number must be less than 20 characters" }).optional(),
  designation: z.string().trim().max(100, { message: "Designation must be less than 100 characters" }).optional(),
});
