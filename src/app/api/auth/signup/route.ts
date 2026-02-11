import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const runtime = "nodejs";

const RequestSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-z0-9_]+$/),
  password: z.string().min(6).max(128),
  fullName: z.string().min(2).max(120),
  primarySkill: z.string().min(2).max(120),
  experienceLevel: z.string().min(2).max(80),
  learningGoal: z.string().min(2).max(300),
});

function usernameToEmail(username: string) {
  return `${username}@skilltracker.local`;
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const body = RequestSchema.parse(await request.json());
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const email = usernameToEmail(body.username);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        username: body.username,
      },
    });

    if (createError || !created.user) {
      return NextResponse.json(
        { error: createError?.message ?? "Failed to create user" },
        { status: 400 }
      );
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      user_id: created.user.id,
      username: body.username,
      full_name: body.fullName,
      primary_skill: body.primarySkill,
      experience_level: body.experienceLevel,
      learning_goal: body.learningGoal,
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
