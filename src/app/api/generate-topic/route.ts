import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateResources, generateTopicPlan } from "@/lib/mistral";

export const runtime = "nodejs";

const RequestSchema = z.object({
  topic: z.string().min(2).max(120),
  mode: z.enum(["predefined", "ai"]).optional().default("predefined"),
});

type TemplateData = {
  subtopics: Array<{ title: string; description: string }>;
  resources: Array<{ title: string; url: string; type: "youtube" | "web" }>;
};

function predefinedTemplate(topic: string): TemplateData | null {
  const t = topic.toLowerCase();
  if (t.includes("dsa") || (t.includes("data") && t.includes("structure"))) {
    return {
      subtopics: [
        { title: "Arrays and Strings", description: "Master indexing, traversal, and two-pointer techniques." },
        { title: "Linked Lists and Stacks", description: "Implement common operations and analyze time complexity." },
        { title: "Trees and BST", description: "Practice traversals and recursive problem solving." },
        { title: "Graphs", description: "Learn BFS, DFS, and shortest-path basics." },
        { title: "Dynamic Programming", description: "Use state transition and memoization patterns." },
      ],
      resources: [
        { title: "NeetCode DSA Roadmap", url: "https://neetcode.io/roadmap", type: "web" },
        { title: "Abdul Bari Data Structures Playlist", url: "https://www.youtube.com/results?search_query=abdul+bari+data+structures", type: "youtube" },
        { title: "LeetCode Practice", url: "https://leetcode.com/problemset/", type: "web" },
      ],
    };
  }

  if (t.includes("react")) {
    return {
      subtopics: [
        { title: "Components and JSX", description: "Build reusable UI units and understand render flow." },
        { title: "State and Props", description: "Model data flow and component communication." },
        { title: "Hooks", description: "Use useState, useEffect, and custom hooks correctly." },
        { title: "Routing and Forms", description: "Manage navigation and controlled forms." },
        { title: "Performance and Patterns", description: "Apply memoization, splitting, and clean architecture." },
      ],
      resources: [
        { title: "React Official Docs", url: "https://react.dev", type: "web" },
        { title: "React Full Course", url: "https://www.youtube.com/results?search_query=react+full+course", type: "youtube" },
        { title: "Frontend Mentor", url: "https://www.frontendmentor.io/challenges", type: "web" },
      ],
    };
  }

  if (t.includes("python")) {
    return {
      subtopics: [
        { title: "Python Syntax and Data Types", description: "Use Python syntax, collections, and built-ins efficiently." },
        { title: "Functions and Modules", description: "Design reusable functions and organize code in modules." },
        { title: "File Handling and Exceptions", description: "Read/write files and handle runtime errors cleanly." },
        { title: "Object-Oriented Python", description: "Build classes and apply inheritance and encapsulation." },
        { title: "Projects and Automation", description: "Build scripts and automate repetitive tasks." },
      ],
      resources: [
        { title: "Python Docs", url: "https://docs.python.org/3/", type: "web" },
        { title: "Python for Beginners", url: "https://www.youtube.com/results?search_query=python+for+beginners", type: "youtube" },
        { title: "Exercism Python Track", url: "https://exercism.org/tracks/python", type: "web" },
      ],
    };
  }

  return null;
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

    const template = body.mode === "predefined" ? predefinedTemplate(body.topic) : null;
    const plan = template ? { subtopics: template.subtopics } : await generateTopicPlan(body.topic);
    const subtopicRows = plan.subtopics.map((subtopic, index) => ({
      topic_id: topicRow.id,
      user_id: user.id,
      title: subtopic.title,
      description: subtopic.description ?? null,
      order_index: index,
    }));

    const { error: subtopicError } = await supabase.from("subtopics").insert(subtopicRows);
    if (subtopicError) {
      return NextResponse.json({ error: subtopicError.message }, { status: 500 });
    }

    if (template) {
      const resourceRows = template.resources.map((resource, index) => ({
        topic_id: topicRow.id,
        user_id: user.id,
        title: resource.title,
        url: resource.url,
        type: resource.type,
        rank: index,
      }));
      const { error: resourceError } = await supabase.from("resources").insert(resourceRows);
      if (resourceError) {
        return NextResponse.json({ error: resourceError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      topicId: topicRow.id,
      topicTitle: topicRow.title,
      deferredResources: !template,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
