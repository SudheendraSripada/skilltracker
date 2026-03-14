import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { answerDocumentChat } from "@/lib/mistral";

const RequestSchema = z.object({
  documentId: z.string().uuid(),
  message: z.string().min(1),
  model: z.string().default("mistral-small-latest"),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = RequestSchema.parse(await request.json());
    const supabase = await createClient();

    // Verify document ownership and get text
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("extracted_text, title")
      .eq("id", body.documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Save user message
    await supabase.from("document_messages").insert({
      document_id: body.documentId,
      user_id: user.id,
      role: "user",
      content: body.message,
    });

    // Get previous messages
    const { data: previousMessages } = await supabase
      .from("document_messages")
      .select("role, content")
      .eq("document_id", body.documentId)
      .order("created_at", { ascending: true })
      .limit(10);

    const aiResponse = await answerDocumentChat({
      documentText: document.extracted_text,
      messages: previousMessages || [{ role: "user", content: body.message }],
      model: body.model,
    });

    // Save assistant message
    const { data: aiMessage, error: aiError } = await supabase.from("document_messages").insert({
      document_id: body.documentId,
      user_id: user.id,
      role: "assistant",
      content: aiResponse.answer,
    }).select().single();

    if (aiError) throw aiError;

    return NextResponse.json(aiMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
