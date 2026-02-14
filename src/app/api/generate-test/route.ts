import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RequestSchema = z.object({
  topicId: z.string().uuid(),
  subtopicId: z.string().uuid().optional(),
  forceNew: z.boolean().optional().default(false),
});

type LocalQuestion = {
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation?: string | null;
};

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: number) {
  const rng = mulberry32(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickContext(seed: number) {
  const contexts = [
    "a startup team",
    "a learning sprint",
    "a hackathon",
    "a product launch",
    "a study group",
    "a freelance project",
    "an interview prep track",
    "a mentorship session",
  ];
  return contexts[seed % contexts.length];
}

function questionTemplates(subtopic: string, caseCode: string, context: string) {
  return [
    {
      prompt: `What is the primary goal of "${subtopic}" in ${context}? (Case ${caseCode})`,
      correctAnswer: `Apply ${subtopic} to solve its core task efficiently.`,
      distractors: [
        `Avoid using ${subtopic} entirely.`,
        `Use ${subtopic} only for visual design.`,
        `Use ${subtopic} only for database backups.`,
      ],
    },
    {
      prompt: `Which practice improves mastery of "${subtopic}"? (Case ${caseCode})`,
      correctAnswer: "Work through progressively harder problems and review mistakes.",
      distractors: [
        "Memorize solutions without understanding.",
        "Skip problem-solving and only read summaries.",
        "Avoid revisiting errors.",
      ],
    },
    {
      prompt: `In ${context}, what is a common pitfall when learning "${subtopic}"? (Case ${caseCode})`,
      correctAnswer: "Rushing through concepts without validating understanding.",
      distractors: [
        "Using too many color themes.",
        "Adding more hardware.",
        "Ignoring basic math entirely.",
      ],
    },
    {
      prompt: `Which outcome best shows understanding of "${subtopic}"? (Case ${caseCode})`,
      correctAnswer: `You can explain ${subtopic} and apply it to new problems.`,
      distractors: [
        "You can recall a definition but not apply it.",
        "You only solved one example once.",
        "You avoid questions involving edge cases.",
      ],
    },
    {
      prompt: `When should you use "${subtopic}"? (Case ${caseCode})`,
      correctAnswer: `When it offers the most direct or efficient approach for the task.`,
      distractors: [
        "Only when the problem is already solved.",
        "Only if the solution is provided.",
        "Only for UI animations.",
      ],
    },
    {
      prompt: `Which step helps verify your "${subtopic}" solution? (Case ${caseCode})`,
      correctAnswer: "Test with edge cases and explain the logic step-by-step.",
      distractors: [
        "Remove comments and skip tests.",
        "Assume it works for all inputs.",
        "Only test the happy path.",
      ],
    },
    {
      prompt: `What is a good way to decompose "${subtopic}" problems? (Case ${caseCode})`,
      correctAnswer: "Break the task into smaller, solvable steps.",
      distractors: [
        "Jump directly to optimization before correctness.",
        "Avoid writing down assumptions.",
        "Ignore input constraints.",
      ],
    },
    {
      prompt: `Which signal suggests you should revisit "${subtopic}" fundamentals? (Case ${caseCode})`,
      correctAnswer: "You struggle to explain why your approach works.",
      distractors: [
        "You can recite a definition without examples.",
        "You only use pre-written solutions.",
        "You avoid discussing time tradeoffs.",
      ],
    },
    {
      prompt: `What helps retain "${subtopic}" knowledge over time? (Case ${caseCode})`,
      correctAnswer: "Spaced repetition with small practice sets.",
      distractors: [
        "One long cram session only.",
        "Avoiding real problems.",
        "Never reviewing solved work.",
      ],
    },
    {
      prompt: `Which is the best next step after learning "${subtopic}" basics? (Case ${caseCode})`,
      correctAnswer: "Solve applied problems that require adapting the core idea.",
      distractors: [
        "Stop practicing and move on immediately.",
        "Only watch more videos.",
        "Skip exercises entirely.",
      ],
    },
    {
      prompt: `How do you measure progress in "${subtopic}"? (Case ${caseCode})`,
      correctAnswer: "By solving increasingly varied problems without hints.",
      distractors: [
        "By the number of pages read.",
        "By the number of videos watched.",
        "By how fast you skim notes.",
      ],
    },
    {
      prompt: `Which approach improves accuracy with "${subtopic}"? (Case ${caseCode})`,
      correctAnswer: "Slow down to verify assumptions before coding.",
      distractors: [
        "Skip planning and code immediately.",
        "Copy solutions without reading.",
        "Never check constraints.",
      ],
    },
    {
      prompt: `What is a reliable way to debug "${subtopic}" solutions? (Case ${caseCode})`,
      correctAnswer: "Trace with small inputs and check each step.",
      distractors: [
        "Guess until it passes.",
        "Only run on large inputs.",
        "Remove validation logic.",
      ],
    },
    {
      prompt: `Which statement best reflects good "${subtopic}" hygiene? (Case ${caseCode})`,
      correctAnswer: "Document assumptions and handle edge cases.",
      distractors: [
        "Ignore edge cases to save time.",
        "Focus only on speed and skip correctness.",
        "Avoid naming variables clearly.",
      ],
    },
    {
      prompt: `How should you prioritize practice for "${subtopic}"? (Case ${caseCode})`,
      correctAnswer: "Start with fundamentals, then increase difficulty.",
      distractors: [
        "Start with the hardest problems.",
        "Only review solutions.",
        "Skip the fundamentals entirely.",
      ],
    },
    {
      prompt: `Which behavior slows improvement in "${subtopic}"? (Case ${caseCode})`,
      correctAnswer: "Repeating the same easy problem without variation.",
      distractors: [
        "Reviewing mistakes.",
        "Trying different approaches.",
        "Explaining solutions aloud.",
      ],
    },
    {
      prompt: `In ${context}, what is the best way to explain "${subtopic}" to a peer? (Case ${caseCode})`,
      correctAnswer: "Describe the idea, a simple example, and why it works.",
      distractors: [
        "List only final answers.",
        "Skip the reasoning.",
        "Avoid any example.",
      ],
    },
    {
      prompt: `Which signal shows you're ready to advance beyond "${subtopic}" basics? (Case ${caseCode})`,
      correctAnswer: "You can solve variations without external hints.",
      distractors: [
        "You can repeat a definition.",
        "You only solve guided examples.",
        "You avoid new problems.",
      ],
    },
    {
      prompt: `What is the role of constraints when working with "${subtopic}"? (Case ${caseCode})`,
      correctAnswer: "They shape the right approach and complexity choices.",
      distractors: [
        "They are optional details.",
        "They only matter after coding.",
        "They should be ignored for speed.",
      ],
    },
    {
      prompt: `Which habit keeps "${subtopic}" skills sharp? (Case ${caseCode})`,
      correctAnswer: "Frequent short practice sessions with feedback.",
      distractors: [
        "Long breaks between practice.",
        "Only reading theory.",
        "Avoiding any review.",
      ],
    },
  ];
}

function buildQuestionLibrary(subtopics: string[], userId: string, topicTitle: string) {
  const safeSubtopics = subtopics.length > 0 ? subtopics : [topicTitle];
  const library: LocalQuestion[] = [];
  safeSubtopics.forEach((subtopic, index) => {
    const caseSeed = hashString(`${userId}:${topicTitle}:${subtopic}:${index}`);
    const caseCode = caseSeed.toString(16).slice(0, 6);
    const context = pickContext(caseSeed);
    const templates = questionTemplates(subtopic, caseCode, context);
    templates.forEach((template, templateIndex) => {
      const seed = hashString(`${userId}:${topicTitle}:${subtopic}:${templateIndex}`);
      const options = shuffle(
        [template.correctAnswer, ...template.distractors],
        seed
      );
      library.push({
        prompt: template.prompt,
        options,
        correctAnswer: template.correctAnswer,
        explanation: null,
      });
    });
  });
  return library;
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existingTest } = await admin
      .from("tests")
      .select("id, status")
      .eq("topic_id", body.topicId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!body.forceNew && existingTest?.status === "attempted") {
      return NextResponse.json(
        { error: "Test already attempted for this topic." },
        { status: 409 }
      );
    }

    if (!body.forceNew && existingTest?.status === "skipped") {
      return NextResponse.json(
        { error: "Test was skipped for this topic." },
        { status: 409 }
      );
    }

    if (!body.forceNew && existingTest?.status === "offered") {
      const { data: questions } = await supabase
        .from("test_questions")
        .select("id, prompt, options")
        .eq("test_id", existingTest.id);

      return NextResponse.json({ testId: existingTest.id, questions: questions ?? [] });
    }

    const { data: topic } = await admin
      .from("topics")
      .select("title")
      .eq("id", body.topicId)
      .eq("user_id", user.id)
      .single();

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const { data: subtopicRows } = await admin
      .from("subtopics")
      .select("id, title, status")
      .eq("topic_id", body.topicId)
      .eq("user_id", user.id)
      .order("order_index", { ascending: true });

    const completedCount =
      subtopicRows?.filter((subtopic) => subtopic.status === "completed").length ?? 0;
    const allSubtopics = subtopicRows?.map((subtopic) => subtopic.title) ?? [];

    let selectedSubtopics = allSubtopics;
    if (body.subtopicId) {
      const selected = subtopicRows?.find((subtopic) => subtopic.id === body.subtopicId);
      if (!selected) {
        return NextResponse.json({ error: "Subtopic not found" }, { status: 404 });
      }
      selectedSubtopics = [selected.title];
    }

    const questionCount = Math.max(
      20,
      body.subtopicId ? 20 : Math.max(1, completedCount) * 5
    );

    const library = buildQuestionLibrary(selectedSubtopics, user.id, topic.title);
    const pickSeed = hashString(
      `${user.id}:${body.topicId}:${body.subtopicId ?? "topic"}:questions`
    );
    const selectedQuestions = shuffle(library, pickSeed).slice(0, questionCount);

    let testId: string | null = null;

    if (existingTest) {
      testId = existingTest.id;
      const { error: clearQuestionsError } = await admin
        .from("test_questions")
        .delete()
        .eq("test_id", testId);
      if (clearQuestionsError) {
        return NextResponse.json({ error: clearQuestionsError.message }, { status: 500 });
      }
      const { error: resetTestError } = await admin
        .from("tests")
        .update({
          status: "offered",
          total_questions: selectedQuestions.length,
          score: null,
          max_score: null,
          attempted_at: null,
        })
        .eq("id", testId)
        .eq("user_id", user.id);
      if (resetTestError) {
        return NextResponse.json({ error: resetTestError.message }, { status: 500 });
      }
    } else {
      const { data: testRow, error: testError } = await admin
        .from("tests")
        .insert({
          topic_id: body.topicId,
          user_id: user.id,
          status: "offered",
          total_questions: selectedQuestions.length,
        })
        .select("id")
        .single();

      if (testError || !testRow) {
        return NextResponse.json(
          { error: testError?.message ?? "Failed to create test" },
          { status: 500 }
        );
      }
      testId = testRow.id;
    }

    if (!testId) {
      return NextResponse.json({ error: "Failed to initialize test" }, { status: 500 });
    }

    const questionRows = selectedQuestions.map((question) => ({
      test_id: testId,
      prompt: question.prompt,
      options: question.options,
      correct_answer: question.correctAnswer,
      explanation: question.explanation ?? null,
    }));

    const { error: questionError } = await admin.from("test_questions").insert(questionRows);
    if (questionError) {
      return NextResponse.json({ error: questionError.message }, { status: 500 });
    }

    const { data: questions } = await admin
      .from("test_questions")
      .select("id, prompt, options")
      .eq("test_id", testId);

    return NextResponse.json({ testId, questions: questions ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
