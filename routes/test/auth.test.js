const request = require("supertest");
const app = require("../../server");

describe('POST /api/register', () => {
  
  test('should register a new user', async () => {
    const newUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      isAdmin: false,
    };

    const response = await request(app)
      .post('/api/register')
      .send(newUser)
      .expect(201);

    // Add assertions here
    expect(response.body.msg).toBe('User registered successfully');
    expect(response.body).toHaveProperty('msg');
  });

  // Add more tests for admin registration scenarios
});
