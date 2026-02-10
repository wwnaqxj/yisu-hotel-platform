const bcrypt = require('bcryptjs');

// In-memory demo DB (for scaffold). Replace with real DB later.

const users = [];
const hotels = [];
const rooms = [];

function seed() {
  if (users.length > 0) return;

  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  users.push({
    id: 'u_admin',
    username: 'admin',
    passwordHash: adminPasswordHash,
    role: 'admin',
  });
}

seed();

module.exports = {
  users,
  hotels,
  rooms,
};
