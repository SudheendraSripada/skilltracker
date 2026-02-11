import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { answerDoubt } from "@/lib/mistral";

export const runtime = "nodejs";

const RequestSchema = z.object({
  topic: z.string().min(2).max(120),
  doubt: z.string().min(5).max(2000),
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = RequestSchema.parse(await request.json());

    const { data: profile } = await supabase
      .from("profiles")
      .select("experience_level")
      .eq("user_id", user.id)
      .single();

    const result = await answerDoubt({
      topic: body.topic,
      doubt: body.doubt,
      userLevel: profile?.experience_level ?? "beginner",
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
