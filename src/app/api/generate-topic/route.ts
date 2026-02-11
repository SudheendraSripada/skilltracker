import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateResources, generateTopicPlan } from "@/lib/mistral";

export const runtime = "nodejs";

const RequestSchema = z.object({
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

    const { data: topicRow, error: topicError } = await supabase
      .from("topics")
      .insert({ title: body.topic, user_id: user.id })
      .select("id, title")
      .single();

    if (topicError || !topicRow) {
      return NextResponse.json(
        { error: topicError?.message ?? "Failed to create topic" },
        { status: 500 }
      );
    }

    const plan = await generateTopicPlan(body.topic);
    const resources = await generateResources(body.topic);
    const subtopicRows = plan.subtopics.map((subtopic, index) => ({
      topic_id: topicRow.id,
      user_id: user.id,
      title: subtopic.title,
      description: subtopic.description ?? null,
      order_index: index,
    }));
    const resourceRows = resources.resources.map((resource, index) => ({
      topic_id: topicRow.id,
      user_id: user.id,
      title: resource.title,
      url: resource.url,
      type: resource.type,
      rank: index,
    }));

    const { error: subtopicError } = await supabase.from("subtopics").insert(subtopicRows);
    if (subtopicError) {
      return NextResponse.json({ error: subtopicError.message }, { status: 500 });
    }

    const { error: resourceError } = await supabase.from("resources").insert(resourceRows);
    if (resourceError) {
      return NextResponse.json({ error: resourceError.message }, { status: 500 });
    }

    return NextResponse.json({ topicId: topicRow.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
