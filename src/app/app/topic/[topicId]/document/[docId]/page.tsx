"use client";

import { useEffect, useState, useRef, use } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ModelSwitcher, AIModel } from "@/components/ModelSwitcher";
import { ArrowLeft, Send, Loader2, PlayCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DocumentPage(props: { params: Promise<{ topicId: string; docId: string }> }) {
  const params = use(props.params);
  const { topicId, docId } = params;
  
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [model, setModel] = useState<AIModel>("mistral-small-latest");
  
  const supabase = createSupabaseBrowserClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        loadData(data.session.user.id);
      } else {
        router.push("/");
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadData = async (userId: string) => {
    const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    setProfile(prof);

    const { data: doc } = await supabase.from('documents').select('*').eq('id', docId).single();
    if (doc) setDocument(doc);

    const { data: msgs } = await supabase.from('document_messages').select('*').eq('document_id', docId).order('created_at', { ascending: true });
    if (msgs) setMessages(msgs);

    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    
    const userMsg = input.trim();
    setInput("");
    setIsSending(true);

    const tempId = Math.random().toString();
    setMessages(prev => [...prev, { id: tempId, role: "user", content: userMsg }]);

    try {
      const res = await fetch("/api/document-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, message: userMsg, model }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setMessages(prev => [...prev, data]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error sending message");
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const startPractice = async () => {
    setIsSending(true);
    try {
      const res = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, documentId: docId, scope: "document_practice", forceNew: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert("AI Practice Quiz generated! Go back to the dashboard to take it.");
      router.push("/app");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error generating quiz");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">Loading document...</div>;

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/app" className="rounded-full bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white">{document?.title || "Document"}</h1>
            <p className="text-xs text-slate-400">Interactive Reader</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={startPractice}
            disabled={isSending}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 transition disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" />
            Practice Quiz
          </button>
          <ModelSwitcher
            selectedModel={model}
            onModelChange={setModel}
          />
        </div>
      </header>

      {/* Main Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: PDF Viewer */}
        <div className="w-1/2 border-r border-slate-800 bg-slate-900 h-full p-2">
          <div className="h-full w-full overflow-hidden rounded-xl border border-slate-800 bg-black/20">
            <iframe 
              src={document?.file_url ? `${document.file_url}#toolbar=0` : ''} 
              className="h-full w-full rounded-xl"
              title="PDF Reader"
            />
          </div>
        </div>

        {/* Right: Chat Interface */}
        <div className="flex w-1/2 flex-col bg-slate-950">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                <Sparkles className="h-10 w-10 text-emerald-500/20 mb-3" />
                <p>Chat with this document.</p>
                <p className="text-xs">Ask for summaries, explanations, or specific details.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30' 
                      : 'bg-slate-900 text-slate-200 border border-slate-800'
                  }`}>
                    {msg.content.split('\n').map((line: string, i: number) => (
                      <span key={i}>{line}<br/></span>
                    ))}
                  </div>
                </div>
              ))
            )}
            {isSending && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 shrink-0">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-800 bg-slate-900/50 p-4">
            <form 
              onSubmit={e => { e.preventDefault(); handleSend(); }}
              className="relative flex items-end overflow-hidden border border-slate-700 bg-slate-950 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all rounded-2xl"
            >
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask a question about the document..."
                className="w-full resize-none bg-transparent px-4 py-3.5 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none min-h-[52px] max-h-32"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="absolute right-2 bottom-2 rounded-xl bg-emerald-500/20 p-2 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-30 transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
