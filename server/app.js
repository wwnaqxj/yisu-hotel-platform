const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const hotelRoutes = require('./routes/hotel');
const adminRoutes = require('./routes/admin');
const merchantRoutes = require('./routes/merchant');
const uploadRoutes = require('./routes/upload');
const mediaRoutes = require('./routes/media');
const { ensureAdmin, ensureMerchant } = require('./seed');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/hotel', hotelRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/media', mediaRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Server error',
  });
});

const port = Number(process.env.PORT || 3001);
Promise.all([ensureAdmin(), ensureMerchant()])
  .catch((e) => {
    console.error('Seed failed:', e);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  });
