import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://stuqektzzijkocvocjjr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0dXFla3R6emlqa29jdm9jampyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDE3MjksImV4cCI6MjA4MDc3NzcyOX0.D8FGHge5LJHI32AVrWw3lpqmSinLUgOAX0Q-ktZqgHU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('documents').select('id').limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
}

check();
