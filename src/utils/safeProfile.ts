import { z } from 'zod';

// Unified onboarding/user profile shape used across modules
export const ProfileSchema = z.object({
  firstName: z.string().optional().default(''),
  profilePhoto: z.string().optional().nullable().transform(v => (typeof v === 'string' ? v : undefined)),
  loveLanguage: z.string().optional().default(''),
  relationshipStatus: z.string().optional().default(''),
  age: z.string().optional().default('25'),
  gender: z.string().optional().default(''),
  personalityType: z.string().optional().default('')
});

export type SafeProfile = z.infer<typeof ProfileSchema>;

// Returns a fully defaulted profile object so UI never receives null/undefined
export function getSafeProfile(input: unknown): SafeProfile {
  try {
    if (input === null || input === undefined) return ProfileSchema.parse({});
    // If the profile is accidentally stored as a JSON string, parse it
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        return ProfileSchema.parse(parsed ?? {});
      } catch {
        return ProfileSchema.parse({});
      }
    }
    return ProfileSchema.parse(input);
  } catch {
    // Fallback to defaults on any validation failure
    return ProfileSchema.parse({});
  }
}

// Helper to safely read JSON from localStorage (handles Safari quirks and corrupted entries)
export function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  } catch {
    // Safari private mode or storage disabled
    return fallback;
  }
}

// Ensures a value is an array before iterating
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
