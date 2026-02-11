import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { analyzeProgress } from "@/lib/mistral";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [{ data: profile }, { data: topics }, { data: subtopics }, { data: tests }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, primary_skill, experience_level, learning_goal")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("topics")
        .select("title")
        .eq("user_id", user.id),
      supabase
        .from("subtopics")
        .select("status")
        .eq("user_id", user.id),
      supabase
        .from("tests")
        .select("status, score, max_score")
        .eq("user_id", user.id),
    ]);

    const totalTopics = topics?.length ?? 0;
    const completedSubtopics = subtopics?.filter((s) => s.status === "completed").length ?? 0;
    const pendingSubtopics = subtopics?.filter((s) => s.status !== "completed").length ?? 0;
    const attemptedTests = tests?.filter((t) => t.status === "attempted").length ?? 0;

    const scored =
      tests
        ?.filter((t) => t.status === "attempted" && t.score !== null && t.max_score)
        .map((t) => (t.score ?? 0) / (t.max_score ?? 1)) ?? [];

    const avgScore = scored.length > 0 ? Number((scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(2)) : 0;

    const analysis = await analyzeProgress({
      fullName: profile?.full_name ?? "Learner",
      primarySkill: profile?.primary_skill ?? "General",
      experienceLevel: profile?.experience_level ?? "beginner",
      learningGoal: profile?.learning_goal ?? "Improve skill depth",
      totalTopics,
      completedSubtopics,
      pendingSubtopics,
      attemptedTests,
      avgScore,
      recentTopics: (topics ?? []).slice(0, 5).map((t) => t.title),
    });

    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
