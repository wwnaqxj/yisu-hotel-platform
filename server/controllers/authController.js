const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users } = require('../data/db');
const { httpError } = require('../utils/errors');

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );
}

async function register(req, res, next) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) throw httpError(400, 'username/password/role required');
    if (!['admin', 'merchant'].includes(role)) throw httpError(400, 'invalid role');

    const exists = users.some((u) => u.username === username);
    if (exists) throw httpError(409, 'username already exists');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = { id: `u_${Date.now()}`, username, passwordHash, role };
    users.push(user);

    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) {
    next(e);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) throw httpError(400, 'username/password required');

    const user = users.find((u) => u.username === username);
    if (!user) throw httpError(401, 'invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw httpError(401, 'invalid credentials');

    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) {
    next(e);
  }
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = {
  register,
  login,
  me,
};
