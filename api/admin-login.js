/**
 * Admin Login Endpoint
 * Validates admin credentials and returns a JWT.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!ADMIN_PASSWORD_HASH || !JWT_SECRET) {
    return res.status(500).json({ error: 'Admin credentials not configured' });
  }

  const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

  res.status(200).json({ token });
}
