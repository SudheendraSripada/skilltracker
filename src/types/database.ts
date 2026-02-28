/**
 * Database Types for Tests and Test Questions
 * Mirrors the Supabase schema for type safety
 */

/**
 * Test record from the public.tests table
 * RLS Policy: Users can only access their own tests (user_id = auth.uid())
 */
export interface Test {
  id: string;
  topic_id: string;
  user_id: string;
  status: 'offered' | 'in_progress' | 'completed';
  total_questions: number;
  score: number | null;
  max_score: number | null;
  attempted_at: string | null;
  created_at: string;
}

/**
 * Test Question record from the public.test_questions table
 * RLS Policy: Users can only access questions from their own tests
 * (via exists check: t.id = test_id and t.user_id = auth.uid())
 */
export interface TestQuestion {
  id: string;
  test_id: string;
  prompt: string;
  options: Record<string, string>; // JSONB field
  correct_answer: string;
  explanation: string | null;
  user_answer: string | null;
  is_correct: boolean | null;
  created_at: string;
}

/**
 * Type for creating a new test (omits server-generated fields)
 */
export interface CreateTestInput {
  topic_id: string;
  status?: 'offered' | 'in_progress' | 'completed';
  total_questions?: number;
  max_score?: number;
}

/**
 * Type for creating a new test question (omits server-generated fields)
 */
export interface CreateTestQuestionInput {
  test_id: string;
  prompt: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation?: string;
}

/**
 * Type for updating a test question (only user_answer and is_correct)
 */
export interface UpdateTestQuestionInput {
  user_answer: string;
  is_correct?: boolean;
}

/**
 * Type for updating test metadata (score, status, etc.)
 */
export interface UpdateTestInput {
  status?: 'offered' | 'in_progress' | 'completed';
  score?: number;
  max_score?: number;
  attempted_at?: string;
}