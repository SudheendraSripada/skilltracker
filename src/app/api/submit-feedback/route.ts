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

    const { error: dbError } = await supabase.from("feedback").insert({
      user_id: session.user.id,
      type: validatedData.type,
      message: validatedData.message,
      route: validatedData.route,
      status: "open",
    });

    if (dbError) {
      console.error("Supabase Database Error (Feedback might not be saved in DB):", dbError);
      // We proceed because we still want to try sending to Discord
    }

    // Send notification to Discord if webhook URL is configured
    const webhookUrl = process.env.FEEDBACK_DISCORD_WEBHOOK_URL;
    let discordSuccess = false;

    if (webhookUrl) {
      try {
        const discordRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [
              {
                title: `New Feedback: ${validatedData.type.replace("_", " ").toUpperCase()}`,
                description: validatedData.message,
                color: validatedData.type === "bug" ? 0xef4444 : validatedData.type === "feature_request" ? 0x3b82f6 : 0x10b981,
                fields: [
                  { name: "User ID", value: session.user.id, inline: true },
                  { name: "Page Route", value: validatedData.route || "Unknown", inline: true },
                  { name: "Database Status", value: dbError ? "❌ Failed (Table missing?)" : "✅ Saved", inline: true },
                ],
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
        if (discordRes.ok) discordSuccess = true;
      } catch (err) {
        console.error("Failed to send Discord notification:", err);
      }
    }

    if (dbError && !discordSuccess) {
      return NextResponse.json(
        { error: "Failed to process feedback. Database error and Discord notification failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      db_status: dbError ? "failed" : "ok",
      discord_status: discordSuccess ? "ok" : (webhookUrl ? "failed" : "not_configured")
    }, { status: 201 });
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
