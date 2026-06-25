import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import authRoutes from '../backend/routes/authRoutes.ts';

let mongoServer: MongoMemoryServer;
let app: express.Express;

beforeAll(async () => {
  // Ensure JWT_SECRET is loaded for crypto/generation purposes during testing
  process.env.JWT_SECRET = 'super-test-jwt-secret-key-must-be-highly-secure';
  
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const coll of collections) {
      await mongoose.connection.db.collection(coll.name).deleteMany({});
    }
  }
});

describe('auth route integration tests', () => {
  it('POST /api/auth/register with valid data returns 201 and a JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123'
      });
      
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toBe('john@example.com');
  });

  it('POST /api/auth/register with a 6-character password returns 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Short Pass User',
        email: 'shortpass@example.com',
        password: 'pwd123'
      });
      
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toBe('shortpass@example.com');
  });

  it('POST /api/auth/register with duplicate email returns 400', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123'
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another Doe',
        email: 'john@example.com',
        password: 'otherSecurePassword123'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already exists');
  });

  it('POST /api/auth/login with correct credentials returns 200 and a JWT', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'goodPassword999'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jane@example.com',
        password: 'goodPassword999'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('POST /api/auth/login with wrong password returns 401', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'goodPassword999'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jane@example.com',
        password: 'wrongPasswordAttempts'
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Invalid email or password');
  });

  it('GET /api/auth/profile without Authorization header returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/profile');

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Not authorized');
  });

  it('POST /api/auth/login more than 10 times in a row returns 429 (rate limit)', async () => {
    let lastStatus = 0;
    
    // Perform 11 sequential login requests
    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'rate-limit-test@example.com',
          password: 'dummyPassword'
        });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });
});
