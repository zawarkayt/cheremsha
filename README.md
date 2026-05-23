# 🌿 ЧЕРЕМША — Full Stack

React + Express + PostgreSQL

## Структура

```
cheremsha/
├── server/        Express API
│   ├── index.js
│   └── package.json
└── client/        React (Vite)
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Запуск на Eee PC

### 1. Установи Node.js (если нет)
```bash
sudo apt install nodejs npm
```

### 2. Установи PostgreSQL
```bash
sudo apt install postgresql
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE cheremsha;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

### 3. Запусти сервер
```bash
cd server
npm install
npm run dev
# работает на http://localhost:3001
```

### 4. Запусти клиент (в другом терминале)
```bash
cd client
npm install
npm run dev
# открой http://localhost:5173
```

### Для прода (nginx):
```bash
cd client && npm run build
# скопируй dist/ в /var/www/html/admin/
```

## API endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| GET | /orders | Все заказы |
| GET | /orders/:id | Заказ по номеру ЧЕРМ-XXXXX |
| POST | /orders | Создать заказ |
| PATCH | /orders/:id/status | Обновить статус |
| GET | /reviews | Все отзывы |
| POST | /reviews | Добавить отзыв |
| DELETE | /reviews/:id | Удалить отзыв |
| GET | /stats | Статистика |
