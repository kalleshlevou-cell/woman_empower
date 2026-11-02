const jwt = require('jsonwebtoken');

/**
 * protect — verifies JWT Bearer token and attaches req.user = { id, role }.
 */
function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Not authenticated. Token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
}

/**
 * adminOnly — must come after protect.
 * Returns 403 for any non-admin user on /api/admin/* routes.
 */
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  next();
}

module.exports = { protect, adminOnly };
