import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RequestSchema = z.object({
  testId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      answer: z.string().optional(),
    })
  ),
});

function normalize(text: string) {
  return text.trim().toLowerCase();
}

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

    const { data: testRow } = await supabase
      .from("tests")
      .select("id, status, user_id")
      .eq("id", body.testId)
      .eq("user_id", user.id)
      .single();

    if (!testRow) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (testRow.status === "attempted") {
      return NextResponse.json({ error: "This test was already submitted." }, { status: 409 });
    }

    if (testRow.status === "skipped") {
      return NextResponse.json({ error: "This test was skipped." }, { status: 409 });
    }

    const { data: questions } = await supabase
      .from("test_questions")
      .select("id, correct_answer")
      .eq("test_id", body.testId);

    const answerMap = new Map(
      body.answers.map((item) => [item.questionId, item.answer ?? ""])
    );
    let score = 0;

    const updates =
      questions?.map((question) => {
        const answer = answerMap.get(question.id) ?? "";
        const isCorrect = normalize(answer) === normalize(question.correct_answer);
        if (isCorrect) {
          score += 1;
        }
        return {
          id: question.id,
          user_answer: answer,
          is_correct: isCorrect,
        };
      }) ?? [];

    if (updates.length > 0) {
      const { error: updateError } = await supabase.from("test_questions").upsert(updates);
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    const maxScore = questions?.length ?? 0;

    const { error: testUpdateError } = await supabase
      .from("tests")
      .update({
        status: "attempted",
        score,
        max_score: maxScore,
        attempted_at: new Date().toISOString(),
      })
      .eq("id", body.testId);

    if (testUpdateError) {
      return NextResponse.json({ error: testUpdateError.message }, { status: 500 });
    }

    return NextResponse.json({ score, maxScore });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
