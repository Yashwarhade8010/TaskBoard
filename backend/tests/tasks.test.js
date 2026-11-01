const request = require('supertest');
const { createApp } = require('../src/app');

const task = { id: 1, title: 'Write tests', description: null, status: 'todo' };

function appWith(query) {
  return createApp({ pool: { query } });
}

describe('tasks API', () => {
  test('lists tasks', async () => {
    const q = jest.fn().mockResolvedValue([[task]]);
    const res = await request(appWith(q)).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([task]);
  });

  test('rejects an invalid status filter', async () => {
    const res = await request(appWith(jest.fn())).get('/api/tasks?status=nope');
    expect(res.status).toBe(400);
  });

  test('creates a task', async () => {
    const q = jest.fn()
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([[task]]);
    const res = await request(appWith(q)).post('/api/tasks').send({ title: 'Write tests' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
  });

  test('rejects an empty title', async () => {
    const res = await request(appWith(jest.fn())).post('/api/tasks').send({ title: '  ' });
    expect(res.status).toBe(400);
  });

  test('returns 404 for a missing task', async () => {
    const res = await request(appWith(jest.fn().mockResolvedValue([[]]))).get('/api/tasks/99');
    expect(res.status).toBe(404);
  });

  test('updates a task', async () => {
    const q = jest.fn()
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ ...task, status: 'done' }]]);
    const res = await request(appWith(q)).put('/api/tasks/1').send({ status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
  });

  test('ignores unknown fields on update (no SQL injection via keys)', async () => {
    const res = await request(appWith(jest.fn())).put('/api/tasks/1').send({ 'title=1; DROP TABLE tasks; --': 'x' });
    expect(res.status).toBe(400);
  });

  test('deletes a task', async () => {
    const res = await request(appWith(jest.fn().mockResolvedValue([{ affectedRows: 1 }]))).delete('/api/tasks/1');
    expect(res.status).toBe(204);
  });

  test('returns 400 for malformed JSON', async () => {
    const res = await request(appWith(jest.fn()))
      .post('/api/tasks').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
  });
});
