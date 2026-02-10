const jwt = require('jsonwebtoken');
const { httpError } = require('../utils/errors');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) return next(httpError(401, 'Unauthorized'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload;
    return next();
  } catch (e) {
    return next(httpError(401, 'Invalid token'));
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return next(httpError(401, 'Unauthorized'));
    if (req.user.role !== role) return next(httpError(403, 'Forbidden'));
    return next();
  };
}

module.exports = {
  authRequired,
  requireRole,
};
