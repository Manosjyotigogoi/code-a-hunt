import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { findOne, insertOne } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });

    const existing = findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing)
      return res.status(409).json({ error: 'An account with this email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      createdAt: new Date().toISOString(),
      hasCompletedDataCollection: false,
    };
    insertOne('users', user);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, hasCompletedDataCollection: false },
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        hasCompletedDataCollection: user.hasCompletedDataCollection,
      },
    });
  } catch {
    res.status(500).json({ error: 'Login failed.' });
  }
});

// GET /api/auth/me — verify token & return user
router.get('/me', authMiddleware, (req, res) => {
  const user = findOne('users', u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      hasCompletedDataCollection: user.hasCompletedDataCollection,
    },
  });
});

export default router;
