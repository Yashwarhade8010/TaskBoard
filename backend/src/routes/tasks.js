const express = require('express');
const { z } = require('zod');

const STATUSES = ['todo', 'in_progress', 'done'];

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).nullish(),
  status: z.enum(STATUSES).default('todo'),
});
const updateSchema = createSchema.partial().refine((v) => Object.keys(v).length > 0, {
  message: 'At least one field is required',
});
const listSchema = z.object({
  status: z.enum(STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
const idSchema = z.coerce.number().int().positive();

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = function tasksRouter(pool) {
  const router = express.Router();

  router.get('/', wrap(async (req, res) => {
    const { status, limit, offset } = listSchema.parse(req.query);
    const where = status ? 'WHERE status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.query(
      `SELECT id, title, description, status, created_at, updated_at
       FROM tasks ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ data: rows, limit, offset });
  }));

  router.get('/:id', wrap(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  }));

  router.post('/', wrap(async (req, res) => {
    const body = createSchema.parse(req.body);
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)',
      [body.title, body.description ?? null, body.status]
    );
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  }));

  router.put('/:id', wrap(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const body = updateSchema.parse(req.body);
    // Column names come from the validated schema keys only, never from user input.
    const sets = Object.keys(body).map((k) => `${k} = ?`).join(', ');
    const [result] = await pool.query(`UPDATE tasks SET ${sets} WHERE id = ?`, [
      ...Object.values(body),
      id,
    ]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Task not found' });
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(rows[0]);
  }));

  router.delete('/:id', wrap(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Task not found' });
    res.status(204).end();
  }));

  return router;
};
