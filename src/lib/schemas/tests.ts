/**
 * Zod schemas for test data validation
 * These schemas ensure data integrity and type safety at runtime
 */

import { z } from 'zod';

/**
 * Schema for the complete Test record
 */
export const TestSchema = z.object({
  id: z.string().uuid('Invalid test ID'),
  topic_id: z.string().uuid('Invalid topic ID'),
  user_id: z.string().uuid('Invalid user ID'),
  status: z.enum(['offered', 'in_progress', 'completed']),
  total_questions: z.number().int().nonnegative(),
  score: z.number().int().nullable(),
  max_score: z.number().int().nullable(),
  attempted_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export type TestData = z.infer<typeof TestSchema>;

/**
 * Schema for creating a new test (client input)
 * Note: user_id is NOT included; it will be extracted from the server session
 */
export const CreateTestSchema = z.object({
  topic_id: z.string().uuid('Topic ID is required and must be a valid UUID'),
  status: z
    .enum(['offered', 'in_progress', 'completed'])
    .optional()
    .default('offered'),
  total_questions: z
    .number()
    .int('Total questions must be an integer')
    .nonnegative('Total questions must be non-negative')
    .optional()
    .default(0),
  max_score: z
    .number()
    .int('Max score must be an integer')
    .positive('Max score must be positive')
    .optional(),
});

export type CreateTestData = z.infer<typeof CreateTestSchema>;

/**
 * Schema for the complete TestQuestion record
 */
export const TestQuestionSchema = z.object({
  id: z.string().uuid('Invalid question ID'),
  test_id: z.string().uuid('Invalid test ID'),
  prompt: z.string().min(1, 'Question prompt cannot be empty'),
  options: z.record(z.string(), z.string()),
  correct_answer: z.string().min(1, 'Correct answer cannot be empty'),
  explanation: z.string().nullable(),
  user_answer: z.string().nullable(),
  is_correct: z.boolean().nullable(),
  created_at: z.string().datetime(),
});

export type TestQuestionData = z.infer<typeof TestQuestionSchema>;

/**
 * Schema for creating a new test question (client input)
 */
export const CreateTestQuestionSchema = z.object({
  test_id: z.string().uuid('Test ID is required and must be a valid UUID'),
  prompt: z
    .string()
    .min(5, 'Question prompt must be at least 5 characters')
    .max(2000, 'Question prompt must not exceed 2000 characters'),
  options: z
    .record(z.string(), z.string()),
  correct_answer: z.string().min(1, 'Correct answer is required'),
  explanation: z
    .string()
    .max(1000, 'Explanation must not exceed 1000 characters')
    .optional(),
});

export type CreateTestQuestionData = z.infer<typeof CreateTestQuestionSchema>;

/**
 * Schema for updating a test question answer
 */
export const UpdateTestQuestionSchema = z.object({
  user_answer: z.string().min(1, 'User answer cannot be empty'),
  is_correct: z
    .boolean()
    .optional()
    .describe('Optionally provide whether the answer is correct'),
});

export type UpdateTestQuestionData = z.infer<typeof UpdateTestQuestionSchema>;

/**
 * Schema for updating test metadata
 */
export const UpdateTestSchema = z.object({
  status: z
    .enum(['offered', 'in_progress', 'completed'])
    .optional(),
  score: z
    .number()
    .int('Score must be an integer')
    .nonnegative('Score must be non-negative')
    .optional(),
  max_score: z
    .number()
    .int('Max score must be an integer')
    .positive('Max score must be positive')
    .optional(),
  attempted_at: z.string().datetime().optional(),
});


export type UpdateTestData = z.infer<typeof UpdateTestSchema>;
