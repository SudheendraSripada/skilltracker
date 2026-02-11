import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateTest } from "@/lib/mistral";

export const runtime = "nodejs";

const RequestSchema = z.object({
  topicId: z.string().uuid(),
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

    const { data: existingTest } = await supabase
      .from("tests")
      .select("id, status")
      .eq("topic_id", body.topicId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingTest?.status === "attempted") {
      return NextResponse.json(
        { error: "Test already attempted for this topic." },
        { status: 409 }
      );
    }

    if (existingTest?.status === "skipped") {
      return NextResponse.json(
        { error: "Test was skipped for this topic." },
        { status: 409 }
      );
    }

    if (existingTest?.status === "offered") {
      const { data: questions } = await supabase
        .from("test_questions")
        .select("id, prompt, options")
        .eq("test_id", existingTest.id);

      return NextResponse.json({ testId: existingTest.id, questions: questions ?? [] });
    }

    const { data: topic } = await supabase
      .from("topics")
      .select("title")
      .eq("id", body.topicId)
      .eq("user_id", user.id)
      .single();

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const { data: subtopicRows } = await supabase
      .from("subtopics")
      .select("title, status")
      .eq("topic_id", body.topicId)
      .eq("user_id", user.id)
      .order("order_index", { ascending: true });

    const completedCount =
      subtopicRows?.filter((subtopic) => subtopic.status === "completed").length ?? 0;
    const questionCount = Math.max(1, completedCount) * 5;
    const subtopics = subtopicRows?.map((subtopic) => subtopic.title) ?? [];

    const testPlan = await generateTest(topic.title, subtopics, questionCount);

    const { data: testRow, error: testError } = await supabase
      .from("tests")
      .insert({
        topic_id: body.topicId,
        user_id: user.id,
        status: "offered",
        total_questions: testPlan.questions.length,
      })
      .select("id")
      .single();

    if (testError || !testRow) {
      return NextResponse.json(
        { error: testError?.message ?? "Failed to create test" },
        { status: 500 }
      );
    }

    const questionRows = testPlan.questions.map((question) => ({
      test_id: testRow.id,
      prompt: question.prompt,
      options: question.options,
      correct_answer: question.correctAnswer,
      explanation: question.explanation ?? null,
    }));

    const { error: questionError } = await supabase.from("test_questions").insert(questionRows);
    if (questionError) {
      return NextResponse.json({ error: questionError.message }, { status: 500 });
    }

    const { data: questions } = await supabase
      .from("test_questions")
      .select("id, prompt, options")
      .eq("test_id", testRow.id);

    return NextResponse.json({ testId: testRow.id, questions: questions ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
