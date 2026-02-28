/**
 * Server Actions for test management
 * All operations are RLS-compliant and execute with authenticated user context
 * 
 * Key security features:
 * - User ID is extracted from the server session, never from client input
 * - All database operations use createServerClient for proper RLS evaluation
 * - Zod schemas validate input before database operations
 * - Error handling prevents information leakage
 */

'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import {
  CreateTestSchema,
  CreateTestQuestionSchema,
  UpdateTestQuestionSchema,
  UpdateTestSchema,
} from '@/lib/schemas/tests';
import type {
  Test,
  TestQuestion,
  CreateTestInput,
  UpdateTestQuestionInput,
} from '@/types/database';

/**
 * Response type for all server actions
 */
interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Creates a new test for the authenticated user
 * 
 * Security:
 * - Fetches user ID from secure session (not client input)
 * - RLS policy verifies auth.uid() = user_id on insert
 * - Validates input against CreateTestSchema
 * 
 * @param input - Test creation data (topic_id, status, etc.)
 * @returns Response containing created test or error
 */
export async function createTest(
  input: CreateTestInput
): Promise<ActionResponse<Test>> {
  try {
    // Validate input
    const validatedInput = CreateTestSchema.parse(input);

    // Get authenticated user (throws if not authenticated)
    const user = await getCurrentUser();

    // Create Supabase client (RLS enforced for this user)
    const supabase = await createClient();

    // Insert test with user_id from session
    // RLS policy: tests_write checks auth.uid() = user_id
    const { data, error } = await supabase
      .from('tests')
      .insert({
        topic_id: validatedInput.topic_id,
        user_id: user.id, // Securely obtained from session
        status: validatedInput.status,
        total_questions: validatedInput.total_questions,
        max_score: validatedInput.max_score,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating test:', error);
      return {
        success: false,
        error: 'Failed to create test. Please try again.',
      };
    }

    return {
      success: true,
      data: data as Test,
    };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'User not authenticated') {
        return {
          success: false,
          error: 'You must be logged in to create a test.',
        };
      }
      // Zod validation error
      if ('issues' in err) {
        return {
          success: false,
          error: 'Invalid input. Please check your data.',
        };
      }
    }
    console.error('Error in createTest:', err);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}

/**
 * Fetches all tests for the authenticated user
 * 
 * Security:
 * - RLS policy automatically filters to user's tests (auth.uid() = user_id)
 * - Returns empty array if no tests exist for user
 * 
 * @returns Response containing array of user's tests or error
 */
export async function getTests(): Promise<ActionResponse<Test[]>> {
  try {
    // Get authenticated user
    const user = await getCurrentUser();

    // Create Supabase client
    const supabase = await createClient();

    // Fetch tests - RLS automatically filters to user's records
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching tests:', error);
      return {
        success: false,
        error: 'Failed to fetch tests. Please try again.',
      };
    }

    return {
      success: true,
      data: (data || []) as Test[],
    };
  } catch (err) {
    if (err instanceof Error && err.message === 'User not authenticated') {
      return {
        success: false,
        error: 'You must be logged in to view tests.',
      };
    }
    console.error('Error in getTests:', err);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}

/**
 * Fetches a specific test with all its questions
 * 
 * Security:
 * - RLS policies ensure user can only access their own test and its questions
 * 
 * @param testId - UUID of the test
 * @returns Response containing test with questions or error
 */
export async function getTestWithQuestions(
  testId: string
): Promise<
  ActionResponse<{
    test: Test;
    questions: TestQuestion[];
  }>
> {
  try {
    // Get authenticated user
    const user = await getCurrentUser();

    // Create Supabase client
    const supabase = await createClient();

    // Fetch test
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', testId)
      .eq('user_id', user.id)
      .single();

    if (testError || !testData) {
      return {
        success: false,
        error: 'Test not found.',
      };
    }

    // Fetch questions for this test
    const { data: questionsData, error: questionsError } = await supabase
      .from('test_questions')
      .select('*')
      .eq('test_id', testId)
      .order('created_at', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return {
        success: false,
        error: 'Failed to fetch test questions.',
      };
    }

    return {
      success: true,
      data: {
        test: testData as Test,
        questions: (questionsData || []) as TestQuestion[],
      },
    };
  } catch (err) {
    if (err instanceof Error && err.message === 'User not authenticated') {
      return {
        success: false,
        error: 'You must be logged in.',
      };
    }
    console.error('Error in getTestWithQuestions:', err);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}

/**
 * Adds a new question to a test
 * 
 * Security:
 * - Verifies user owns the test via RLS policy
 * - RLS policy: test_questions_write checks test ownership via subquery
 * - Validates input against CreateTestQuestionSchema
 * 
 * @param input - Question creation data (test_id, prompt, options, etc.)
 * @returns Response containing created question or error
 */
export async function addTestQuestion(
  input: {
    test_id: string;
    prompt: string;
    options: Record<string, string>;
    correct_answer: string;
    explanation?: string;
  }
): Promise<ActionResponse<TestQuestion>> {
  try {
    // Validate input
    const validatedInput = CreateTestQuestionSchema.parse(input);

    // Get authenticated user
    const user = await getCurrentUser();

    // Create Supabase client
    const supabase = await createClient();

    // Verify test exists and belongs to user
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select('id')
      .eq('id', validatedInput.test_id)
      .eq('user_id', user.id)
      .single();

    if (testError || !testData) {
      return {
        success: false,
        error: 'Test not found or you do not have permission to add questions.',
      };
    }

    // Insert question
    // RLS policy: test_questions_write verifies test ownership
    const { data, error } = await supabase
      .from('test_questions')
      .insert({
        test_id: validatedInput.test_id,
        prompt: validatedInput.prompt,
        options: validatedInput.options,
        correct_answer: validatedInput.correct_answer,
        explanation: validatedInput.explanation,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error adding question:', error);
      return {
        success: false,
        error: 'Failed to add question. Please try again.',
      };
    }

    return {
      success: true,
      data: data as TestQuestion,
    };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'User not authenticated') {
        return {
          success: false,
          error: 'You must be logged in to add questions.',
        };
      }
    }
    console.error('Error in addTestQuestion:', err);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}

/**
 * Updates a test question with user's answer
 * 
 * Security:
 * - Only updates user_answer and is_correct fields
 * - RLS policy ensures user owns the test this question belongs to
 * - Validates input against UpdateTestQuestionSchema
 * 
 * @param questionId - UUID of the question
 * @param input - Update data (user_answer, is_correct)
 * @returns Response containing updated question or error
 */
export async function updateTestQuestion(
  questionId: string,
  input: UpdateTestQuestionInput
): Promise<ActionResponse<TestQuestion>> {
  try {
    // Validate input
    const validatedInput = UpdateTestQuestionSchema.parse(input);

    // Get authenticated user
    const user = await getCurrentUser();

    // Create Supabase client
    const supabase = await createClient();

    // Update question
    // RLS policy: test_questions_update verifies test ownership via subquery
    const { data, error } = await supabase
      .from('test_questions')
      .update({
        user_answer: validatedInput.user_answer,
        is_correct: validatedInput.is_correct,
      })
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating question:', error);
      return {
        success: false,
        error: 'Failed to update question. Please try again.',
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Question not found or you do not have permission to update it.',
      };
    }

    return {
      success: true,
      data: data as TestQuestion,
    };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'User not authenticated') {
        return {
          success: false,
          error: 'You must be logged in to update questions.',
        };
      }
    }
    console.error('Error in updateTestQuestion:', err);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}

/**
 * Updates test metadata (status, score, etc.)
 * 
 * Security:
 * - RLS policy ensures user owns the test
 * - Can only update status, score, max_score, and attempted_at
 * 
 * @param testId - UUID of the test
 * @param input - Update data (status, score, max_score, attempted_at)
 * @returns Response containing updated test or error
 */
export async function updateTest(
  testId: string,
  input: Partial<UpdateTestInput>
): Promise<ActionResponse<Test>> {
  try {
    // Validate input
    const validatedInput = UpdateTestSchema.parse(input);

    // Get authenticated user
    const user = await getCurrentUser();

    // Create Supabase client
    const supabase = await createClient();

    // Update test
    // RLS policy: tests_update checks auth.uid() = user_id
    const { data, error } = await supabase
      .from('tests')
      .update(validatedInput)
      .eq('id', testId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating test:', error);
      return {
        success: false,
        error: 'Failed to update test. Please try again.',
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Test not found or you do not have permission to update it.',
      };
    }

    return {
      success: true,
      data: data as Test,
    };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'User not authenticated') {
        return {
          success: false,
          error: 'You must be logged in to update tests.',
        };
      }
    }
    console.error('Error in updateTest:', err);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}