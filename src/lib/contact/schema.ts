import { z } from 'zod'

// NOTE: zod v4 deprecated `z.string().email()` in favor of the top-level
// `z.email()` — the old form still works but emits a console deprecation
// warning that would pollute otherwise-pristine test output.
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must be at most 100 characters.'),
  email: z.email('Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .min(7, 'Phone number is too short.')
    .max(20, 'Phone number is too long.')
    .optional()
    .or(z.literal('')),
  // The default zod v4 message for `.min()` is not guaranteed to match zod
  // v3 wording, and the e2e suite asserts the rendered text matches
  // /at least 10/i, so this custom message is required, not cosmetic.
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters.')
    .max(2000, 'Message must be at most 2000 characters.'),
  website: z.literal(''), // honeypot: real users never fill this
  locale: z.enum(['es', 'en']),
})

export type ContactInput = z.infer<typeof contactSchema>
