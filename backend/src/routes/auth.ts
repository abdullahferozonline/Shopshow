import express from 'express';
import { z } from 'zod';
import { pool } from '../utils/db';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const hashed = hashPassword(parsed.password);

    const q = `INSERT INTO users (email, password_hash, name, role) VALUES ($1,$2,$3,$4) RETURNING id, email, name, role, created_at`;
    const values = [parsed.email, hashed, parsed.name || null, 'admin'];

    const { rows } = await pool.query(q, values);
    const user = rows[0];
    return res.status(201).json({ user });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'User already exists' });
    }
    return res.status(400).json({ error: err.message ?? String(err) });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const q = `SELECT id, email, password_hash, name, role FROM users WHERE email = $1 LIMIT 1`;
    const { rows } = await pool.query(q, [parsed.email]);
    if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const ok = comparePassword(parsed.password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ id: user.id, email: user.email, role: user.role }, '8h');
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err: any) {
    return res.status(400).json({ error: err.message ?? String(err) });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
  try {
    const parts = authHeader.split(' ');
    const payload: any = JSON.parse(JSON.stringify(require('jsonwebtoken').decode(parts[1])));
    // payload contains id/email; fetch latest user info
    const { rows } = await pool.query('SELECT id, email, name, role, created_at FROM users WHERE id = $1 LIMIT 1', [payload.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: rows[0] });
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
