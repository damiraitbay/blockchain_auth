import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z.string().trim().max(60),
  bio: z.string().trim().max(240)
});
