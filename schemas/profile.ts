import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
