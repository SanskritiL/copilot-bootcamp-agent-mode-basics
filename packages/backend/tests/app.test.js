const request = require('supertest');
const { app, db, insertStmt } = require('../src/app');

describe('DELETE /api/items/:id', () => {
  let itemId;

  beforeEach(() => {
    // Insert a test item before each test
    const info = insertStmt.run('Test Item', 'Test Description');
    itemId = info.lastInsertRowid;
  });

  afterEach(() => {
    // Clean up items table after each test
    db.prepare('DELETE FROM items').run();
  });

  it('should delete an existing item and return 204', async () => {
    const res = await request(app).delete(`/api/items/${itemId}`);
    expect(res.status).toBe(204);
    // Verify item is deleted
    const row = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
    expect(row).toBeUndefined();
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
    const origRun = db.prepare;
    db.prepare = () => { throw new Error('DB error'); };
    const res = await request(app).delete(`/api/items/${itemId}`);
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Failed to delete item');
    db.prepare = origRun;
  });
});
