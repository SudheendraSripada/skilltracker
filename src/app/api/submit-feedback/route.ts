import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const FeedbackSchema = z.object({
  type: z.enum(["bug", "feature_request", "general"]),
  message: z.string().min(1, "Message cannot be empty").max(2000),
  route: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Ensure user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to submit feedback" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = FeedbackSchema.parse(body);

    const { error } = await supabase.from("feedback").insert({
      user_id: session.user.id,
      type: validatedData.type,
      message: validatedData.message,
      route: validatedData.route,
      status: "open",
    });

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Feedback submission error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid feedback data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
