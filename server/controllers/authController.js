const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPrisma } = require('../prismaClient');
const { httpError } = require('../utils/errors');

function signToken(user) {
  return jwt.sign(
    { id: Number(user.id), username: user.username, role: user.role },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );
}

async function register(req, res, next) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) throw httpError(400, 'username/password/role required');
    if (!['admin', 'merchant'].includes(role)) throw httpError(400, 'invalid role');

    const prisma = getPrisma();
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) throw httpError(409, 'username already exists');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, passwordHash, role },
    });

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

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { username } });
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
  const prisma = getPrisma();
  prisma.user
    .findUnique({ where: { id: Number(req.user.id) } })
    .then((u) => {
      if (!u) throw httpError(401, 'Unauthorized');
      res.json({ user: { id: u.id, username: u.username, role: u.role } });
    })
    .catch((e) => {
      res.status(e.status || 500).json({ message: e.message || 'Server error' });
    });
}

async function updateProfile(req, res, next) {
  try {
    const { username } = req.body;
    if (!username) throw httpError(400, 'username required');
    if (String(username).trim().length < 3) throw httpError(400, 'username too short');

    const prisma = getPrisma();
    const uid = Number(req.user.id);

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists && exists.id !== uid) throw httpError(409, 'username already exists');

    const updated = await prisma.user.update({
      where: { id: uid },
      data: { username },
    });

    res.json({ user: { id: updated.id, username: updated.username, role: updated.role } });
  } catch (e) {
    next(e);
  }
}

async function updatePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) throw httpError(400, 'oldPassword/newPassword required');
    if (String(newPassword).length < 6) throw httpError(400, 'newPassword too short');

    const prisma = getPrisma();
    const uid = Number(req.user.id);
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) throw httpError(401, 'Unauthorized');

    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) throw httpError(401, 'invalid credentials');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: uid },
      data: { passwordHash },
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  register,
  login,
  me,
  updateProfile,
  updatePassword,
};
