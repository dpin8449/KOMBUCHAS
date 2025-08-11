import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { z } from 'zod';
import cors from 'cors';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
app.use(express.json());

const batchSchema = z.object({
  id: z.string(),
  type: z.enum(['BASE', 'FINAL']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  days: z.number().int().optional(),
  origin_batch_id: z.string().nullable().optional(),
  temperature: z.number().int().optional(),
  comment: z.string().optional(),
  result: z.string().optional(),
  production: z.string().optional(),
  total_time: z.number().int().optional(),
  final_status: z.string().optional()
});

// CRUD routes
app.get('/batches', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM batch');
  res.json(rows);
});

app.get('/batches/:id', async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM batch WHERE id = $1', [id]);
  if (rows.length === 0) return res.status(404).send('Not found');
  res.json(rows[0]);
});

app.post('/batches', async (req, res) => {
  const parse = batchSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error);
  const b = parse.data;
  await pool.query(
  'INSERT INTO batch (id, type, start_date, end_date, days, origin_batch_id, temperature, comment, result, production, total_time, final_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
  [b.id, b.type, b.start_date, b.end_date, b.days, b.origin_batch_id, b.temperature, b.comment, b.result, b.production, b.total_time, b.final_status]
  );
  res.status(201).send('Created');
});

app.put('/batches/:id', async (req, res) => {
  const parse = batchSchema.partial().safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error);
  const b = parse.data;
  const fields = Object.keys(b).filter(k => (b as any)[k] !== undefined);
  if (fields.length === 0) return res.status(400).send('No fields to update');
  const set = fields.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = fields.map(k => (b as any)[k]);
  await pool.query(`UPDATE batch SET ${set} WHERE id = $1`, [req.params.id, ...values]);
  res.send('Updated');
});

app.delete('/batches/:id', async (req, res) => {
  await pool.query('DELETE FROM batch WHERE id = $1', [req.params.id]);
  res.send('Deleted');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
