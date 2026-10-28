import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'securefdr_super_secret_jwt_key_sih26265_demo_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export default {
  generateToken,
  verifyToken
};
