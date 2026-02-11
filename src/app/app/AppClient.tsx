"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  offered: "bg-sky-100 text-sky-800 border-sky-200",
  attempted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  skipped: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

type Subtopic = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  status: "pending" | "completed";
  completed_at: string | null;
};

type Resource = {
  id: string;
  title: string;
  url: string;
  type: "youtube" | "web";
  rank: number;
};

type TestSummary = {
  id: string;
  status: "offered" | "attempted" | "skipped";
  score: number | null;
  max_score: number | null;
  attempted_at: string | null;
};

type Topic = {
  id: string;
  title: string;
  created_at: string;
  subtopics: Subtopic[];
  resources: Resource[];
  tests: TestSummary[];
};

type TestQuestion = {
  id: string;
  prompt: string;
  options: string[];
};

type ActiveTest = {
  testId: string;
  topicId: string;
  topicTitle: string;
  questions: TestQuestion[];
};

type Profile = {
  user_id: string;
  username: string;
  full_name: string;
  primary_skill: string;
  experience_level: string;
  learning_goal: string;
};

function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@skilltracker.local`;
}

function normalizeUsername(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export default function AppClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [primarySkill, setPrimarySkill] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingTestTopicId, setPendingTestTopicId] = useState<string | null>(null);
  const [activeTest, setActiveTest] = useState<ActiveTest | null>(null);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ score: number; maxScore: number } | null>(null);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!session) return;
    void loadTopics();
    void loadProfile();
  }, [session]);

  const loadProfile = async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, username, full_name, primary_skill, experience_level, learning_goal")
      .eq("user_id", session.user.id)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
  };

  const loadTopics = async () => {
    const { data, error } = await supabase
      .from("topics")
      .select(
        "id, title, created_at, subtopics(id, title, description, order_index, status, completed_at), resources(id, title, url, type, rank), tests(id, status, score, max_score, attempted_at)"
      )
      .order("created_at", { ascending: false })
      .order("order_index", { foreignTable: "subtopics", ascending: true })
      .order("rank", { foreignTable: "resources", ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setTopics((data ?? []) as Topic[]);
  };

  const handleSignUp = async () => {
    setMessage(null);
    const cleanUsername = normalizeUsername(username);

    if (cleanUsername.length < 3) {
      setMessage("Username must be at least 3 characters (letters, numbers, underscore).");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (!fullName.trim() || !primarySkill.trim() || !experienceLevel.trim() || !learningGoal.trim()) {
      setMessage("Please fill all profile fields.");
      return;
    }

    const email = usernameToEmail(cleanUsername);
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data.user) {
      setMessage("Sign up failed. Please try again.");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      user_id: data.user.id,
      username: cleanUsername,
      full_name: fullName.trim(),
      primary_skill: primarySkill.trim(),
      experience_level: experienceLevel.trim(),
      learning_goal: learningGoal.trim(),
    });

    if (profileError) {
      setMessage(profileError.message);
      return;
    }

    if (!data.session) {
      setMessage("Disable email confirmation in Supabase Auth to allow instant login.");
      return;
    }

    setMessage("Account created. You are now signed in.");
  };

  const handleLogin = async () => {
    setMessage(null);
    const cleanUsername = normalizeUsername(username);

    if (cleanUsername.length < 3) {
      setMessage("Enter a valid username.");
      return;
    }
    if (!password) {
      setMessage("Enter password.");
      return;
    }

    const email = usernameToEmail(cleanUsername);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      return;
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopic.trim()) return;
    setIsGenerating(true);
    setMessage(null);
    try {
      const response = await fetch("/api/generate-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: newTopic.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate topic");
      }

      setNewTopic("");
      await loadTopics();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteSubtopic = async (topicId: string, subtopicId: string) => {
    const { error } = await supabase
      .from("subtopics")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", subtopicId);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadTopics();
    setPendingTestTopicId(topicId);
  };

  const startTest = async (topicId: string) => {
    setMessage(null);
    setTestResult(null);
    try {
      const response = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to start test");
      }

      const topic = topics.find((item) => item.id === topicId);
      setActiveTest({
        testId: data.testId,
        topicId,
        topicTitle: topic?.title ?? "Topic Test",
        questions: data.questions ?? [],
      });
      setTestAnswers({});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const submitTest = async () => {
    if (!activeTest) return;
    setMessage(null);

    const answers = Object.entries(testAnswers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));

    try {
      const response = await fetch("/api/submit-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: activeTest.testId,
          answers,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to submit test");
      }

      setTestResult({ score: data.score, maxScore: data.maxScore });
      await loadTopics();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const skipTest = async (topicId: string) => {
    setMessage(null);
    await fetch("/api/skip-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId }),
    });
    await loadTopics();
  };

  const deleteTopic = async (topicId: string) => {
    if (!confirm("Delete this topic and all its subtopics/tests?")) return;
    setDeletingTopicId(topicId);
    setMessage(null);
    try {
      const { error } = await supabase.from("topics").delete().eq("id", topicId);
      if (error) {
        throw new Error(error.message);
      }
      await loadTopics();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setDeletingTopicId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Loading</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-lg w-full rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Skill Tracker</p>
            <h1 className="text-3xl font-semibold">Simple Login</h1>
            <p className="text-slate-400 text-sm">
              Sign in using username and password. No email verification required.
            </p>
          </div>

          <div className="mt-6 flex gap-2 rounded-xl border border-slate-800 p-1">
            <button
              onClick={() => setAuthMode("login")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm ${authMode === "login" ? "bg-emerald-400 text-slate-900" : "text-slate-300"}`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode("signup")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm ${authMode === "signup" ? "bg-emerald-400 text-slate-900" : "text-slate-300"}`}
            >
              Sign up
            </button>
          </div>

          <div className="mt-5 space-y-3">
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500"
            />
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500"
            />

            {authMode === "signup" && (
              <>
                <input
                  type="text"
                  placeholder="full name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                />
                <input
                  type="text"
                  placeholder="primary skill (e.g. React, DSA)"
                  value={primarySkill}
                  onChange={(event) => setPrimarySkill(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                />
                <input
                  type="text"
                  placeholder="experience level (beginner/intermediate/advanced)"
                  value={experienceLevel}
                  onChange={(event) => setExperienceLevel(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                />
                <textarea
                  placeholder="learning goal"
                  value={learningGoal}
                  onChange={(event) => setLearningGoal(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                />
              </>
            )}

            <button
              onClick={authMode === "signup" ? handleSignUp : handleLogin}
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
            >
              {authMode === "signup" ? "Create account" : "Login"}
            </button>

            {message && <p className="text-sm text-amber-200">{message}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Skill Tracker</p>
            <h1 className="text-3xl font-semibold">Personal Learning Studio</h1>
            <p className="text-slate-400 text-sm max-w-xl">
              {profile
                ? `${profile.full_name} | ${profile.primary_skill} | ${profile.experience_level}`
                : "Organize subtopics, track completions, and validate progress in one flow."}
            </p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-full border border-slate-700 px-5 py-2 text-sm text-slate-200 hover:border-emerald-400"
          >
            Sign out
          </button>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold">Create a learning track</h2>
            <p className="text-sm text-slate-400">
              Enter a topic and build a structured learning path with supporting resources.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={newTopic}
                onChange={(event) => setNewTopic(event.target.value)}
                placeholder="e.g. Data Structures and Algorithms"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              />
              <button
                onClick={handleCreateTopic}
                disabled={isGenerating}
                className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
              >
                {isGenerating ? "Building..." : "Create"}
              </button>
            </div>
            {message && <p className="mt-3 text-sm text-amber-200">{message}</p>}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold">Assessment rule</h2>
            <p className="text-sm text-slate-400">
              Each completed subtopic generates 5 questions (1 completed = 5 questions, 2 completed = 10 questions).
            </p>
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              Tests are optional, but attempting them helps validate mastery.
            </div>
          </div>
        </section>

        <section className="mt-10 space-y-6">
          {topics.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 p-10 text-center text-slate-400">
              No topics yet. Create your first learning track to begin.
            </div>
          )}

          {topics.map((topic) => {
            const test = topic.tests?.[0];
            return (
              <div key={topic.id} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{topic.title}</h3>
                    <p className="text-sm text-slate-400">
                      {topic.subtopics.filter((subtopic) => subtopic.status === "completed").length} of {topic.subtopics.length} completed
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {test && (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${STATUS_STYLES[test.status] ?? "bg-slate-800 text-slate-200"}`}
                      >
                        {test.status === "attempted"
                          ? `Score ${test.score ?? 0}/${test.max_score ?? 0}`
                          : `Test ${test.status}`}
                      </span>
                    )}
                    <button
                      onClick={() => startTest(topic.id)}
                      className="rounded-full border border-emerald-400 px-4 py-2 text-xs text-emerald-200 hover:bg-emerald-400/10"
                    >
                      Take assessment
                    </button>
                    <button
                      onClick={() => deleteTopic(topic.id)}
                      disabled={deletingTopicId === topic.id}
                      className="rounded-full border border-rose-500 px-4 py-2 text-xs text-rose-200 hover:bg-rose-500/10 disabled:opacity-60"
                    >
                      {deletingTopicId === topic.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Subtopics</h4>
                    <div className="space-y-3">
                      {topic.subtopics.map((subtopic) => (
                        <div
                          key={subtopic.id}
                          className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                        >
                          <div>
                            <p className="text-sm font-semibold">{subtopic.title}</p>
                            {subtopic.description && (
                              <p className="text-xs text-slate-400">{subtopic.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleCompleteSubtopic(topic.id, subtopic.id)}
                            disabled={subtopic.status === "completed"}
                            className={`rounded-full border px-3 py-1 text-xs ${
                              STATUS_STYLES[subtopic.status]
                            } disabled:opacity-60`}
                          >
                            {subtopic.status}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Resources</h4>
                    <div className="space-y-3">
                      {topic.resources.map((resource) => (
                        <a
                          key={resource.id}
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm hover:border-emerald-400"
                        >
                          <p className="font-semibold">{resource.title}</p>
                          <p className="text-xs text-slate-400">{resource.type.toUpperCase()} link</p>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      {pendingTestTopicId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6">
            <h3 className="text-lg font-semibold">Take a quick assessment?</h3>
            <p className="mt-2 text-sm text-slate-400">
              You just completed a subtopic. Want to validate your understanding now?
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  const topicId = pendingTestTopicId;
                  setPendingTestTopicId(null);
                  void startTest(topicId);
                }}
                className="flex-1 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Start assessment
              </button>
              <button
                onClick={() => {
                  void skipTest(pendingTestTopicId);
                  setPendingTestTopicId(null);
                }}
                className="flex-1 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Assessment</p>
                <h3 className="text-2xl font-semibold">{activeTest.topicTitle}</h3>
                <p className="text-sm text-slate-400">
                  Answer each question once. This is a single-attempt assessment.
                </p>
              </div>
              <button
                onClick={() => setActiveTest(null)}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {activeTest.questions.map((question, index) => (
                <div key={question.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-sm font-semibold">
                    {index + 1}. {question.prompt}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {question.options.map((option) => (
                      <label
                        key={option}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                          testAnswers[question.id] === option
                            ? "border-emerald-400 bg-emerald-400/10"
                            : "border-slate-800 bg-slate-950/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={testAnswers[question.id] === option}
                          onChange={() =>
                            setTestAnswers((prev) => ({
                              ...prev,
                              [question.id]: option,
                            }))
                          }
                          className="accent-emerald-400"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {testResult ? (
              <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
                Score: {testResult.score} / {testResult.maxScore}
              </div>
            ) : (
              <button
                onClick={submitTest}
                className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900"
              >
                Submit assessment
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
