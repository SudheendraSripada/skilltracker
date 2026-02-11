import { z } from "zod";

const TopicPlanSchema = z.object({
  subtopics: z
    .array(
      z.object({
        title: z.string().min(2),
        description: z.string().optional(),
      })
    )
    .min(3),
});

const TestSchema = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string().min(5),
        options: z.array(z.string().min(1)).min(2),
        correctAnswer: z.string().min(1),
        explanation: z.string().optional(),
      })
    )
    .min(1),
});

const ResourceSchema = z.object({
  resources: z
    .array(
      z.object({
        title: z.string().min(2),
        url: z.string().url(),
        type: z.enum(["youtube", "web"]),
      })
    )
    .min(2),
});

const ProgressAnalysisSchema = z.object({
  summary: z.string().min(10),
  riskLevel: z.enum(["low", "medium", "high"]),
  actions: z.array(z.string().min(3)).min(2).max(5),
  reminder: z.string().min(5),
});

const DoubtReplySchema = z.object({
  answer: z.string().min(5),
  followUps: z.array(z.string().min(3)).min(1).max(3),
});

function getMistralConfig() {
  const apiKey = process.env.MISTRAL_API_KEY;
  const baseUrl = process.env.MISTRAL_BASE_URL ?? "https://api.mistral.ai/v1";
  const model = process.env.MISTRAL_MODEL ?? "mistral-small-latest";

  if (!apiKey) {
    throw new Error("Missing MISTRAL_API_KEY");
  }

  return { apiKey, baseUrl, model };
}

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No JSON object found in model response");
  }
  return JSON.parse(match[0]);
}

async function callMistral(prompt: string) {
  const { apiKey, baseUrl, model } = getMistralConfig();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are a precise assistant that returns only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Mistral error: ${response.status} ${message}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  if (!text) {
    throw new Error("Empty response from Mistral");
  }

  try {
    return JSON.parse(text);
  } catch {
    return extractJson(text);
  }
}

export async function generateTopicPlan(topic: string) {
  const prompt = `Create a concise, industry-grade learning plan for: "${topic}".
Return JSON only, no markdown, no commentary.
Schema:
{
  "subtopics": [{ "title": "", "description": "" }]
}
Rules:
- 6-10 subtopics ordered from fundamentals to advanced.
- Descriptions should be 1 sentence.
- Do not include duplicates.
`;

  const parsed = await callMistral(prompt);
  return TopicPlanSchema.parse(parsed);
}

export async function generateTest(topic: string, subtopics: string[], questionCount: number) {
  const prompt = `Create a knowledge test for the topic: "${topic}".
Subtopics covered: ${subtopics.join(", ")}
Return JSON only, no markdown.
Schema:
{
  "questions": [
    {
      "prompt": "",
      "options": ["", "", ""],
      "correctAnswer": "",
      "explanation": ""
    }
  ]
}
Rules:
- ${questionCount} questions.
- Mixed difficulty, focus on applied understanding.
- 3-5 options per question.
- correctAnswer must match one of the options exactly.
- Keep prompts concise.
`;

  const parsed = await callMistral(prompt);
  return TestSchema.parse(parsed);
}

export async function generateResources(topic: string) {
  const prompt = `You are a learning curator. Provide high-quality resources for: "${topic}".
Return JSON only, no markdown, no commentary.
Schema:
{
  "resources": [{ "title": "", "url": "", "type": "youtube|web" }]
}
Rules:
- 3-5 resources.
- Prefer YouTube lectures and authoritative documentation.
- Use stable URLs, avoid duplicates.
`;

  const parsed = await callMistral(prompt);
  return ResourceSchema.parse(parsed);
}

export async function analyzeProgress(input: {
  fullName: string;
  primarySkill: string;
  experienceLevel: string;
  learningGoal: string;
  totalTopics: number;
  completedSubtopics: number;
  pendingSubtopics: number;
  attemptedTests: number;
  avgScore: number;
  recentTopics: string[];
}) {
  const prompt = `You are a strict learning progress coach.
Return JSON only.
Schema:
{
  "summary": "",
  "riskLevel": "low|medium|high",
  "actions": ["", ""],
  "reminder": ""
}
Data:
${JSON.stringify(input)}
Rules:
- Summary in 1-2 sentences.
- Actions must be concrete and short.
- Reminder should push timely completion without being aggressive.`;

  const parsed = await callMistral(prompt);
  return ProgressAnalysisSchema.parse(parsed);
}

export async function answerDoubt(input: {
  topic: string;
  doubt: string;
  userLevel: string;
}) {
  const prompt = `You are a concise doubt-clearing tutor.
Return JSON only.
Schema:
{
  "answer": "",
  "followUps": ["", ""]
}
Data:
${JSON.stringify(input)}
Rules:
- Keep answer practical and easy to apply.
- Mention one concrete next step.
- Keep followUps useful and short.`;

  const parsed = await callMistral(prompt);
  return DoubtReplySchema.parse(parsed);
}
