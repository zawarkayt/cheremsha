import React, { useState, useEffect } from 'react'

const API = '/api'

// ── helpers ──────────────────────────────────────────────
const mono = { fontFamily: "'Share Tech Mono', monospace" }
const orb  = { fontFamily: "'Orbitron', monospace" }

function GlowText({ children, style }) {
  return <span style={{ color: 'var(--green)', textShadow: '0 0 20px rgba(0,255,136,0.4)', ...orb, ...style }}>{children}</span>
}

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      padding: '24px', ...style
    }}>
      {children}
    </div>
  )
}

function Input({ label, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ ...mono, fontSize: 11, letterSpacing: 2, color: 'rgba(200,230,201,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>}
      <input
        style={{
          width: '100%', background: '#0a1a0f',
          border: `1px solid ${focused ? 'var(--green)' : 'var(--border)'}`,
          color: 'var(--text)', padding: '10px 14px',
          ...mono, fontSize: 13, letterSpacing: 1, transition: 'border-color 0.2s',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </div>
  )
}

function Btn({ children, variant = 'primary', style, ...props }) {
  const [hov, setHov] = useState(false)
  const base = {
    padding: '11px 24px', border: 'none', ...orb,
    fontSize: 12, fontWeight: 700, letterSpacing: 2,
    textTransform: 'uppercase', transition: 'all 0.2s', ...style,
  }
  const styles = variant === 'primary'
    ? { ...base, background: hov ? 'white' : 'var(--green)', color: 'var(--bg)', boxShadow: hov ? '0 0 24px rgba(0,255,136,0.4)' : 'none' }
    : { ...base, background: 'transparent', color: 'var(--green)', border: '1px solid var(--green)', ...(hov ? { background: 'rgba(0,255,136,0.08)' } : {}) }
  return <button style={styles} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} {...props}>{children}</button>
}

function Stars({ value }) {
  return (
    <span>
      {'★'.repeat(value).split('').map((s, i) => <span key={i} style={{ color: 'var(--green)' }}>★</span>)}
      {'★'.repeat(5 - value).split('').map((s, i) => <span key={i} style={{ color: 'var(--border)' }}>★</span>)}
    </span>
  )
}

const STATUS_MAP = {
  pending:   { label: 'Принят',           icon: '📦', step: 1 },
  warehouse: { label: 'На складе',        icon: '🏭', step: 2 },
  shipped:   { label: 'Передан курьеру',  icon: '🚚', step: 3 },
  transit:   { label: 'В пути',           icon: '🛣️', step: 4 },
  delivered: { label: 'Доставлен 🌿',     icon: '🌿', step: 5 },
}

// ── TABS ─────────────────────────────────────────────────
const TABS = ['Заказы', 'Отзывы', 'Статистика', 'Отслеживание']

// ── ORDERS TAB ───────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', address: '', items: 'Черемша Pro × 2', total: '' })
  const [msg, setMsg] = useState('')

  const load = () => {
    setLoading(true)
    fetch(`${API}/orders`).then(r => r.json()).then(d => { setOrders(d); setLoading(false) })
  }

  useEffect(load, [])

  const submit = async () => {
    if (!form.name || !form.address || !form.total) return setMsg('Заполни все поля')
    const itemsArr = form.items.split(',').map(s => s.trim()).filter(Boolean)
    const r = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items: itemsArr, total: Number(form.total) }),
    })
    const d = await r.json()
    if (!r.ok) return setMsg(d.error)
    setMsg(`✅ Заказ создан: ${d.order_id}`)
    setForm({ name: '', address: '', items: 'Черемша Pro × 2', total: '' })
    load()
  }

  const updateStatus = async (orderId, status) => {
    await fetch(`${API}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Form */}
      <Card>
        <div style={{ ...orb, fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 20, letterSpacing: 2 }}>НОВЫЙ ЗАКАЗ</div>
        <Input label="Имя" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Иван Черемшев" />
        <Input label="Адрес" value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} placeholder="ул. Черемшовая, 1" />
        <Input label="Товары (через запятую)" value={form.items} onChange={e => setForm(p => ({...p, items: e.target.value}))} />
        <Input label="Сумма ₽" type="number" value={form.total} onChange={e => setForm(p => ({...p, total: e.target.value}))} placeholder="499" />
        {msg && <div style={{ ...mono, fontSize: 12, color: msg.startsWith('✅') ? 'var(--green)' : 'var(--red)', marginBottom: 16, letterSpacing: 1 }}>{msg}</div>}
        <Btn onClick={submit} style={{ width: '100%' }}>Создать заказ</Btn>
      </Card>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <div style={{ ...mono, color: 'rgba(200,230,201,0.4)', fontSize: 13 }}>Загрузка...</div>}
        {!loading && orders.length === 0 && <div style={{ ...mono, color: 'rgba(200,230,201,0.3)', fontSize: 13 }}>Заказов пока нет</div>}
        {orders.map(o => (
          <Card key={o.id} style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <GlowText style={{ fontSize: 13 }}>{o.order_id}</GlowText>
              <span style={{ ...mono, fontSize: 10, color: 'rgba(200,230,201,0.4)', letterSpacing: 1 }}>
                {new Date(o.created_at).toLocaleDateString('ru')}
              </span>
            </div>
            <div style={{ ...mono, fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>{o.name} · {o.address}</div>
            <div style={{ ...mono, fontSize: 11, color: 'rgba(200,230,201,0.5)', marginBottom: 10 }}>
              {Array.isArray(o.items) ? o.items.join(', ') : JSON.stringify(o.items)} · <span style={{ color: 'var(--green)' }}>₽ {o.total}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <button key={k} onClick={() => updateStatus(o.order_id, k)} style={{
                  padding: '4px 10px', ...mono, fontSize: 10, letterSpacing: 1,
                  background: o.status === k ? 'var(--green)' : 'transparent',
                  color: o.status === k ? 'var(--bg)' : 'rgba(200,230,201,0.4)',
                  border: `1px solid ${o.status === k ? 'var(--green)' : 'var(--border)'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── REVIEWS TAB ──────────────────────────────────────────
function ReviewsTab() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ author: '', city: '', product: 'Черемша Pro', stars: 5, text: '' })
  const [msg, setMsg] = useState('')

  const load = () => {
    setLoading(true)
    fetch(`${API}/reviews`).then(r => r.json()).then(d => { setReviews(d); setLoading(false) })
  }

  useEffect(load, [])

  const submit = async () => {
    if (!form.author || !form.city || !form.text) return setMsg('Заполни все поля')
    const r = await fetch(`${API}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await r.json()
    if (!r.ok) return setMsg(d.error)
    setMsg('✅ Отзыв добавлен!')
    setForm({ author: '', city: '', product: 'Черемша Pro', stars: 5, text: '' })
    load()
  }

  const del = async (id) => {
    await fetch(`${API}/reviews/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <Card>
        <div style={{ ...orb, fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 20, letterSpacing: 2 }}>НОВЫЙ ОТЗЫВ</div>
        <Input label="Имя" value={form.author} onChange={e => setForm(p => ({...p, author: e.target.value}))} placeholder="Иван К." />
        <Input label="Город" value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} placeholder="Москва" />
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...mono, fontSize: 11, letterSpacing: 2, color: 'rgba(200,230,201,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Товар</div>
          <select value={form.product} onChange={e => setForm(p => ({...p, product: e.target.value}))} style={{
            width: '100%', background: '#0a1a0f', border: '1px solid var(--border)',
            color: 'var(--text)', padding: '10px 14px', ...mono, fontSize: 13,
          }}>
            <option>Черемша</option>
            <option>Черемша Pro</option>
            <option>Черемша Ultra</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...mono, fontSize: 11, letterSpacing: 2, color: 'rgba(200,230,201,0.5)', marginBottom: 8, textTransform: 'uppercase' }}>Оценка</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setForm(p => ({...p, stars: n}))} style={{
                background: 'none', border: 'none', fontSize: 24, cursor: 'pointer',
                color: n <= form.stars ? 'var(--green)' : 'var(--border)', transition: 'color 0.15s',
              }}>★</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...mono, fontSize: 11, letterSpacing: 2, color: 'rgba(200,230,201,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Текст</div>
          <textarea value={form.text} onChange={e => setForm(p => ({...p, text: e.target.value}))}
            placeholder="Запах пришёл за 2 дня до доставки..."
            style={{
              width: '100%', height: 90, background: '#0a1a0f', border: '1px solid var(--border)',
              color: 'var(--text)', padding: '10px 14px', ...mono, fontSize: 13, resize: 'vertical',
            }}
          />
        </div>
        {msg && <div style={{ ...mono, fontSize: 12, color: msg.startsWith('✅') ? 'var(--green)' : 'var(--red)', marginBottom: 16 }}>{msg}</div>}
        <Btn onClick={submit} style={{ width: '100%' }}>Добавить отзыв</Btn>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflowY: 'auto' }}>
        {loading && <div style={{ ...mono, color: 'rgba(200,230,201,0.4)', fontSize: 13 }}>Загрузка...</div>}
        {reviews.map(r => (
          <Card key={r.id} style={{ padding: 16, position: 'relative' }}>
            <button onClick={() => del(r.id)} style={{
              position: 'absolute', top: 12, right: 12, background: 'none',
              border: '1px solid var(--border)', color: 'rgba(200,230,201,0.3)',
              width: 24, height: 24, fontSize: 12, cursor: 'pointer',
            }}>×</button>
            <div style={{ marginBottom: 8 }}><Stars value={r.stars} /></div>
            <div style={{ fontSize: 13, color: 'rgba(200,230,201,0.8)', lineHeight: 1.6, marginBottom: 12 }}>"{r.text}"</div>
            <div style={{ ...mono, fontSize: 11, color: 'rgba(200,230,201,0.5)', letterSpacing: 1 }}>
              {r.author} · {r.city} · <span style={{ color: 'var(--green)' }}>{r.product}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── STATS TAB ────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch(`${API}/stats`).then(r => r.json()).then(setStats)
    const t = setInterval(() => fetch(`${API}/stats`).then(r => r.json()).then(setStats), 5000)
    return () => clearInterval(t)
  }, [])

  if (!stats) return <div style={{ ...mono, color: 'rgba(200,230,201,0.4)' }}>Загрузка...</div>

  const items = [
    { label: 'Заказов', value: stats.orders_count, suffix: 'шт' },
    { label: 'Выручка', value: `₽ ${stats.revenue.toLocaleString('ru')}`, suffix: '' },
    { label: 'Отзывов', value: stats.reviews_count, suffix: 'шт' },
    { label: 'Средняя оценка', value: stats.avg_stars || '—', suffix: '/ 5' },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {items.map(item => (
          <Card key={item.label} style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ ...orb, fontSize: 40, fontWeight: 900, color: 'var(--green)', textShadow: '0 0 30px rgba(0,255,136,0.3)', marginBottom: 8 }}>
              {item.value}
            </div>
            <div style={{ ...mono, fontSize: 10, letterSpacing: 3, color: 'rgba(200,230,201,0.4)', textTransform: 'uppercase' }}>
              {item.label} {item.suffix}
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{ ...mono, fontSize: 11, letterSpacing: 3, color: 'var(--green)', marginBottom: 12 }}>// СТАТУС СИСТЕМЫ</div>
        {[
          { k: 'API сервер', v: '🟢 ONLINE' },
          { k: 'База данных', v: '🟢 PostgreSQL' },
          { k: 'Черемша', v: '🟢 РАСТЁТ' },
          { k: 'Запах', v: '🟢 АКТИВЕН' },
        ].map(row => (
          <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ ...mono, fontSize: 12, color: 'rgba(200,230,201,0.5)', letterSpacing: 1 }}>{row.k}</span>
            <span style={{ ...mono, fontSize: 12, letterSpacing: 1 }}>{row.v}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── TRACK TAB ────────────────────────────────────────────
function TrackTab() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const track = async () => {
    if (!query.trim()) return
    setLoading(true); setError(''); setResult(null)
    const r = await fetch(`${API}/orders/${query.trim()}`)
    const d = await r.json()
    setLoading(false)
    if (!r.ok) return setError('Заказ не найден. Проверь номер.')
    setResult(d)
  }

  const steps = Object.entries(STATUS_MAP)
  const currentStep = result ? STATUS_MAP[result.status]?.step : 0

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          value={query} onChange={e => setQuery(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && track()}
          placeholder="ЧЕРМ-XXXXX"
          style={{
            flex: 1, background: '#0a1a0f', border: '1px solid var(--border)',
            color: 'var(--text)', padding: '12px 18px', ...mono, fontSize: 14, letterSpacing: 3,
          }}
        />
        <Btn onClick={track}>Найти</Btn>
      </div>

      {loading && <div style={{ ...mono, color: 'rgba(200,230,201,0.4)', fontSize: 13 }}>Ищем черемшу...</div>}
      {error && <div style={{ ...mono, color: 'var(--red)', fontSize: 13 }}>{error}</div>}

      {result && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <GlowText style={{ fontSize: 16 }}>{result.order_id}</GlowText>
              <span style={{ ...mono, fontSize: 11, color: 'rgba(200,230,201,0.4)' }}>{new Date(result.created_at).toLocaleDateString('ru')}</span>
            </div>
            <div style={{ ...mono, fontSize: 12, color: 'rgba(200,230,201,0.6)', marginBottom: 4 }}>{result.name} · {result.address}</div>
            <div style={{ ...mono, fontSize: 12, color: 'rgba(200,230,201,0.4)' }}>
              {Array.isArray(result.items) ? result.items.join(', ') : JSON.stringify(result.items)} · <span style={{ color: 'var(--green)' }}>₽ {result.total}</span>
            </div>
          </Card>

          <div style={{ paddingLeft: 8 }}>
            {steps.map(([key, s], i) => {
              const done = s.step <= currentStep
              const active = s.step === currentStep
              return (
                <div key={key} style={{ display: 'flex', gap: 16, marginBottom: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: active ? 'var(--green)' : done ? '#00b35a' : '#0a1a0f',
                      border: `2px solid ${done || active ? 'var(--green)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>{s.icon}</div>
                    {i < steps.length - 1 && <div style={{ width: 2, height: 28, background: done && s.step < currentStep ? 'var(--green)' : 'var(--border)' }} />}
                  </div>
                  <div style={{ padding: '6px 0 20px' }}>
                    <div style={{ ...orb, fontSize: 13, fontWeight: 700, color: active ? 'var(--green)' : done ? 'white' : 'rgba(200,230,201,0.3)', marginBottom: 2 }}>{s.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── APP ──────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState(0)

  return (
    <div>
      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 40px', borderBottom: '1px solid var(--border)',
        background: 'rgba(5,14,8,0.95)', position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ ...orb, fontSize: 20, fontWeight: 900, color: 'var(--green)', letterSpacing: 4, textShadow: '0 0 20px var(--green)' }}>
          ЧЕРЕМ<span style={{ color: 'white' }}>ША</span>
          <span style={{ ...mono, fontSize: 11, color: 'rgba(200,230,201,0.4)', letterSpacing: 2, marginLeft: 12 }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: '8px 20px', background: tab === i ? 'rgba(0,255,136,0.1)' : 'transparent',
              border: `1px solid ${tab === i ? 'var(--green)' : 'transparent'}`,
              color: tab === i ? 'var(--green)' : 'rgba(200,230,201,0.5)',
              ...mono, fontSize: 12, letterSpacing: 2, transition: 'all 0.2s',
            }}>{t}</button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main style={{ padding: '40px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ ...mono, fontSize: 11, color: 'var(--green)', letterSpacing: 4, marginBottom: 6 }}>// {TABS[tab].toUpperCase()}</div>
          <h1 style={{ ...orb, fontSize: 28, fontWeight: 700, color: 'white', letterSpacing: -1 }}>{TABS[tab]}</h1>
        </div>
        {tab === 0 && <OrdersTab />}
        {tab === 1 && <ReviewsTab />}
        {tab === 2 && <StatsTab />}
        {tab === 3 && <TrackTab />}
      </main>
    </div>
  )
}
