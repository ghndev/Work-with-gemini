'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { db } from '@/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/zod';

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', {
      ...Object.fromEntries(formData),
      redirectTo: '/',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function register(
  _prevState: string | undefined,
  formData: FormData,
) {
  try {
    const formPayload = Object.fromEntries(formData);

    const parsed = await registerSchema.safeParseAsync(formPayload);
    if (!parsed.success) {
      return parsed.error.issues[0].message;
    }

    const { email, password } = parsed.data;

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return 'Email already in use.';
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      email,
      password: passwordHash,
    });

    // Auto-login after registration
    await signIn('credentials', {
      ...Object.fromEntries(formData),
      redirectTo: '/',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}
