const request = require('supertest');
const { app, db, insertStmt } = require('../src/app');

/**
 * Helper to insert a test item and return its id.
 * Only one value (name) is required for insertStmt.
 */
function insertTestItem(name = 'Test Item') {
  const info = insertStmt.run(name);
  return info.lastInsertRowid;
}

describe('DELETE /api/items/:id', () => {
  let itemId;

  beforeEach(() => {
    // Insert a test item before each test
    itemId = insertTestItem();
  });

  afterEach(() => {
    // Clean up items table after each test
    db.prepare('DELETE FROM items').run();
  });

  it('should delete an existing item and return 204', async () => {
    // Set created_at to 6 days ago to pass age check
    db.prepare('UPDATE items SET created_at = ? WHERE id = ?')
      .run(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), itemId);
    const res = await request(app).delete(`/api/items/${itemId}`);
    expect(res.status).toBe(204);
    // Verify item is deleted
    const row = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
    expect(row).toBeUndefined();
  });

  it('should return 403 if item is newer than 5 days', async () => {
    // Set created_at to 2 days ago
    db.prepare('UPDATE items SET created_at = ? WHERE id = ?')
      .run(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), itemId);
    const res = await request(app).delete(`/api/items/${itemId}`);
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/5 days or older/);
    // Verify item is not deleted
    const row = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
    expect(row).toBeDefined();
  });

  it('should return 404 if item does not exist', async () => {
    const res = await request(app).delete('/api/items/99999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Item not found');
  });

  it('should return 400 for invalid id', async () => {
    const res = await request(app).delete('/api/items/invalid');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid item id');
  });

  it('should handle server errors gracefully', async () => {
    // Temporarily break the DB to simulate error
    const origPrepare = db.prepare;
    db.prepare = () => { throw new Error('DB error'); };
    const res = await request(app).delete(`/api/items/${itemId}`);
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Failed to delete item');
    db.prepare = origPrepare;
  });
});

describe('API Endpoints', () => {
  describe('GET /api/items', () => {
    it('should return all items', async () => {
      const response = await request(app).get('/api/items');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      // Check if items have the expected structure
      const item = response.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('created_at');
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const newItem = { name: 'Test Item' };
      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .set('Accept', 'application/json');
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newItem.name);
      expect(response.body).toHaveProperty('created_at');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .set('Accept', 'application/json');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '' })
        .set('Accept', 'application/json');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });
  });
});
