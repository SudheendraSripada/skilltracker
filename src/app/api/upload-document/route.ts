import { NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
// Polyfill for Next.js build collecting page data
if (typeof global !== 'undefined') {
  (global as any).DOMMatrix = (global as any).DOMMatrix || class DOMMatrix {};
  (global as any).ImageData = (global as any).ImageData || class ImageData {};
  (global as any).Path2D = (global as any).Path2D || class Path2D {};
}

const pdfParse = require('pdf-parse');

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const topicId = formData.get('topicId') as string;
    const title = formData.get('title') as string || file.name;

    if (!file || !topicId) {
      return NextResponse.json({ error: 'Missing file or topicId' }, { status: 400 });
    }

    const supabase = await createClient();

    // Extract text
    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';
    try {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } catch (e) {
      console.warn("Could not extract text using pdf-parse", e);
      return NextResponse.json({ error: 'Could not parse the PDF file.' }, { status: 400 });
    }

    // Upload to Storage
    const fileName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('class_documents')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from('class_documents').getPublicUrl(fileName);
    const fileUrl = publicUrlData.publicUrl;

    // Insert to DB
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        topic_id: topicId,
        title,
        file_url: fileUrl,
        extracted_text: extractedText,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
