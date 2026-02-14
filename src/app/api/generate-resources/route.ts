import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateResources } from "@/lib/mistral";

export const runtime = "nodejs";

const RequestSchema = z.object({
  topicId: z.string().uuid(),
  topic: z.string().min(2).max(120),
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

    const { data: existing } = await supabase
      .from("resources")
      .select("id")
      .eq("topic_id", body.topicId)
      .eq("user_id", user.id)
      .limit(1);

    if ((existing?.length ?? 0) > 0) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const resources = await generateResources(body.topic);
    const rows = resources.resources.map((resource, index) => ({
      topic_id: body.topicId,
      user_id: user.id,
      title: resource.title,
      url: resource.url,
      type: resource.type,
      rank: index,
    }));

    const { error } = await supabase.from("resources").insert(rows);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
