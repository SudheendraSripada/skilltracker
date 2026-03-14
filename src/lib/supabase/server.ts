/**
 * Server-side Supabase utilities for secure data operations
 * Uses createServerClient to initialize authenticated Supabase client
 * RLS policies are enforced automatically based on the authenticated user's session
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for server-side operations
 * Automatically handles authentication via cookies
 * RLS policies are evaluated using the current user's session
 * 
 * @throws Error if environment variables are not set
 * @returns Authenticated Supabase client
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.error('Error setting cookies:', error);
          }
        },
      },
    }
  );
}

/**
 * Gets the current authenticated user from the session
 * This is called before any RLS-protected database operations
 * 
 * @throws Error if user is not authenticated
 * @returns User object with id and email
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    throw new Error('User not authenticated');
  }

  return data.user;
}