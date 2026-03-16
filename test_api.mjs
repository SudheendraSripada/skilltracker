

const baseUrl = 'http://localhost:3000';

async function runTests() {
  console.log('--- Testing API Endpoints ---');
  try {
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `testuser_${Date.now()}`,
        password: 'password123',
        fullName: 'Test User',
        primarySkill: 'React',
        experienceLevel: 'beginner',
        learningGoal: 'test everything',
      }),
    });
    console.log('Signup:', signupRes.status, await signupRes.text());
  } catch (err) {
    console.error('Signup Error:', err);
  }
}

runTests();
