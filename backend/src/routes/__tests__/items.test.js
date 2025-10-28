const express = require('express');
const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;

// Mock fs.promises
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

const itemsRouter = require('../items');

// Test data
const mockItems = [
  { id: 1, name: 'Item 1', price: 10.99 },
  { id: 2, name: 'Item 2', price: 20.99 },
  { id: 3, name: 'Test Item', price: 15.99 }
];

// Setup Express app for testing
let app;
beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use('/api/items', itemsRouter);
  // Test-only error handler: ensure errors returned as JSON so tests can assert message/status
  // Mirrors production error handling middleware which formats JSON responses
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
  });
});

describe('GET /api/items', () => {
  it('should return all items', async () => {
    // Mock readFile implementation
    fs.readFile.mockResolvedValueOnce(JSON.stringify(mockItems));
    const res = await request(app)
      .get('/api/items?limit=500')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBeTruthy();
    expect(res.body.items).toHaveLength(3);
    expect(res.body.items[0]).toHaveProperty('id', 1);
  });

  it('should filter items by search query', async () => {
    fs.readFile.mockResolvedValueOnce(JSON.stringify(mockItems));
    const res = await request(app)
      .get('/api/items?q=test&limit=500')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBeTruthy();
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].name).toContain('Test');
  });

  it('should limit number of returned items', async () => {
    fs.readFile.mockResolvedValueOnce(JSON.stringify(mockItems));
    const res = await request(app)
      .get('/api/items?limit=2')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBeTruthy();
    expect(res.body.items).toHaveLength(2);
  });

  it('should handle file read errors', async () => {
    fs.readFile.mockRejectedValueOnce(new Error('File read error'));
    await request(app)
      .get('/api/items')
      .expect(500);
  });
});

describe('GET /api/items/:id', () => {
  it('should return a single item by id', async () => {
    fs.readFile.mockResolvedValueOnce(JSON.stringify(mockItems));

    const res = await request(app)
      .get('/api/items/1')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('name', 'Item 1');
  });

  it('should return 404 for non-existent item', async () => {
    fs.readFile.mockResolvedValueOnce(JSON.stringify(mockItems));

    const res = await request(app)
      .get('/api/items/999')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(res.body).toHaveProperty('message', 'Item not found');
  });

  it('should handle invalid id format', async () => {
    fs.readFile.mockResolvedValueOnce(JSON.stringify(mockItems));

    await request(app)
      .get('/api/items/invalid')
      .expect(404);
  });
});

describe('POST /api/items', () => {
  const newItem = { name: 'New Item', price: 25.99 };

  it('should create a new item', async () => {
    fs.readFile.mockResolvedValueOnce(JSON.stringify(mockItems));
    fs.writeFile.mockResolvedValueOnce();

    const res = await request(app)
      .post('/api/items')
      .send(newItem)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res.body).toHaveProperty('name', 'New Item');
    expect(res.body).toHaveProperty('price', 25.99);
    expect(res.body).toHaveProperty('id');
    expect(typeof res.body.id).toBe('number');
  });

  it('should handle file write errors', async () => {
    fs.readFile.mockResolvedValueOnce(JSON.stringify(mockItems));
    fs.writeFile.mockRejectedValueOnce(new Error('Write error'));

    await request(app)
      .post('/api/items')
      .send(newItem)
      .expect(500);
  });

  // Note: Additional validation tests could be added here once payload validation is implemented
});

// Clean up mocks after all tests
afterEach(() => {
  jest.clearAllMocks();
});