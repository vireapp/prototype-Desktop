import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const UpdateEmailSchema = z.object({
  email: z.string().email('Invalid email address')
})

const UpdatePasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateEmail(
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = createClient()
  const rawData = {
    email: formData.get('email')
  }

  const result = UpdateEmailSchema.safeParse(rawData)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { error } = await supabase.auth.updateUser({
    email: result.data.email
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Confirmation link sent to your new email address.' }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updatePassword(
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = createClient()
  const rawData = {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword')
  }

  const result = UpdatePasswordSchema.safeParse(rawData)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { error } = await supabase.auth.updateUser({
    password: result.data.password
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Password updated successfully.' }
}
