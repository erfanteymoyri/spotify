import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerListenerSchema = z
  .object({
    displayName: z.string().min(2, "Display name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    birthDate: z.string().min(1, "Birth date is required"),
    gender: z.enum(["male", "female", "other"]),
    acceptPrivacy: z.literal(true, {
      message: "You must accept the privacy policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const registerArtistSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  stageName: z.string().min(2, "Stage name must be at least 2 characters"),
  sampleWorks: z.string().min(10, "Describe your sample works"),
});

export const playlistSchema = z.object({
  name: z.string().min(1, "Playlist name is required").max(100),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterListenerInput = z.infer<typeof registerListenerSchema>;
export type RegisterArtistInput = z.infer<typeof registerArtistSchema>;
export type PlaylistInput = z.infer<typeof playlistSchema>;
