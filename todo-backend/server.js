require('dotenv').config()
const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// Подключение к PostgreSQL
const pool = new Pool({
	user: process.env.DB_USER || 'postgres',
	host: process.env.DB_HOST || 'localhost',
	database: process.env.DB_NAME || 'todo_db',
	password: process.env.DB_PASSWORD || '12345',
	port: process.env.DB_PORT || 5432,
})

// Создаем таблицу задач при запуске
;(async () => {
	try {
		await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)
		console.log('Таблица tasks готова')
	} catch (err) {
		console.error('Ошибка создания таблицы:', err)
	}
})()

// Роуты API
// 1. Получить все задачи
app.get('/api/tasks', async (req, res) => {
	try {
		const { rows } = await pool.query(
			'SELECT * FROM tasks ORDER BY created_at DESC'
		)
		res.json(rows)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// 2. Добавить задачу
app.post('/api/tasks', async (req, res) => {
	const { title } = req.body
	if (!title) return res.status(400).json({ error: 'Title is required' })

	try {
		const { rows } = await pool.query(
			'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
			[title]
		)
		res.status(201).json(rows[0])
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// 3. Удалить задачу
app.delete('/api/tasks/:id', async (req, res) => {
	const { id } = req.params

	try {
		await pool.query('DELETE FROM tasks WHERE id = $1', [id])
		res.status(204).send()
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// 4. Обновить статус задачи
app.patch('/api/tasks/:id', async (req, res) => {
	const { id } = req.params
	const { completed } = req.body

	try {
		const { rows } = await pool.query(
			'UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *',
			[completed, id]
		)
		res.json(rows[0])
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

// Запуск сервера
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
	console.log(`Сервер запущен на http://localhost:${PORT}`)
})
