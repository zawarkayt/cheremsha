import express from 'express'
import cors from 'cors'
import pg from 'pg'

const { Pool } = pg

// ── DB ────────────────────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'cheremsha',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
})

// Create tables if they don't exist
await pool.query(`
  CREATE TABLE IF NOT EXISTS orders (
    id         SERIAL PRIMARY KEY,
    order_id   TEXT UNIQUE NOT NULL,
    name       TEXT NOT NULL,
    address    TEXT NOT NULL,
    items      JSONB NOT NULL,
    total      INTEGER NOT NULL,
    status     TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id         SERIAL PRIMARY KEY,
    author     TEXT NOT NULL,
    city       TEXT NOT NULL,
    product    TEXT NOT NULL,
    stars      INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
    text       TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`)

console.log('✅ База данных готова')

// ── APP ───────────────────────────────────────────────────
const app = express()
app.use(cors())
app.use(express.json())

// ── ORDERS ────────────────────────────────────────────────

// GET /orders — все заказы
app.get('/orders', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM orders ORDER BY created_at DESC'
  )
  res.json(rows)
})

// GET /orders/:id — один заказ по order_id (ЧЕРМ-XXXXX)
app.get('/orders/:id', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE order_id = $1',
    [req.params.id.toUpperCase()]
  )
  if (!rows.length) return res.status(404).json({ error: 'Заказ не найден' })
  res.json(rows[0])
})

// POST /orders — создать заказ
app.post('/orders', async (req, res) => {
  const { name, address, items, total } = req.body
  if (!name || !address || !items || !total) {
    return res.status(400).json({ error: 'Заполни все поля' })
  }
  const orderId = 'ЧЕРМ-' + Math.floor(10000 + Math.random() * 90000)
  const { rows } = await pool.query(
    `INSERT INTO orders (order_id, name, address, items, total)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [orderId, name, address, JSON.stringify(items), total]
  )
  res.status(201).json(rows[0])
})

// PATCH /orders/:id/status — обновить статус
app.patch('/orders/:id/status', async (req, res) => {
  const validStatuses = ['pending', 'warehouse', 'shipped', 'transit', 'delivered']
  const { status } = req.body
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Неверный статус' })
  }
  const { rows } = await pool.query(
    `UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *`,
    [status, req.params.id.toUpperCase()]
  )
  if (!rows.length) return res.status(404).json({ error: 'Заказ не найден' })
  res.json(rows[0])
})

// ── REVIEWS ───────────────────────────────────────────────

// GET /reviews — все отзывы
app.get('/reviews', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM reviews ORDER BY created_at DESC'
  )
  res.json(rows)
})

// POST /reviews — добавить отзыв
app.post('/reviews', async (req, res) => {
  const { author, city, product, stars, text } = req.body
  if (!author || !city || !product || !stars || !text) {
    return res.status(400).json({ error: 'Заполни все поля' })
  }
  const { rows } = await pool.query(
    `INSERT INTO reviews (author, city, product, stars, text)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [author, city, product, Number(stars), text]
  )
  res.status(201).json(rows[0])
})

// DELETE /reviews/:id — удалить отзыв
app.delete('/reviews/:id', async (req, res) => {
  await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

// ── STATS ─────────────────────────────────────────────────
app.get('/stats', async (req, res) => {
  const [orders, reviews] = await Promise.all([
    pool.query('SELECT COUNT(*), SUM(total) FROM orders'),
    pool.query('SELECT COUNT(*), ROUND(AVG(stars),1) as avg_stars FROM reviews'),
  ])
  res.json({
    orders_count: Number(orders.rows[0].count),
    revenue:      Number(orders.rows[0].sum) || 0,
    reviews_count: Number(reviews.rows[0].count),
    avg_stars:    Number(reviews.rows[0].avg_stars) || 0,
  })
})

// ── START ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🌿 Сервер черемши запущен на http://localhost:${PORT}`)
})
