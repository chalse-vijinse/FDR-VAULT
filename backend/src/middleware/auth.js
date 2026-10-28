import { verifyToken } from '../config/jwt.js';
import db from '../config/db.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Fetch fresh user from DB
    const users = await db.query('SELECT id, email, full_name, role, institution_id, designation, status FROM users WHERE id = ?', [decoded.id]);
    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    const user = users[0];
    if (user.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact Super Admin.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
}

export default authenticate;
