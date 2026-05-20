import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db'; // Імпортуємо наш конфіг бази
import algoRoutes from './routes/algoRoutes';
import gridRoutes from './routes/gridRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

// Підключаємося до MongoDB
connectDB();

const app = express();
// Якщо в .env немає порту, беремо 5001
const PORT = process.env.PORT || 5001; 

app.use(cors());
app.use(express.json());

// 1. Спочатку підключаємо всі маршрути!
app.use('/api/algos', algoRoutes);
app.use('/api/grids', gridRoutes);
app.use('/api/auth', authRoutes);

// Тестовий маршрут
app.get('/', (req, res) => {
  res.send('Сервер візуалізатора алгоритмів працює успішно!');
});

// 2. І тільки в самому кінці запускаємо сервер!
app.listen(PORT, () => {
  console.log(`Сервер успішно запущено на порту: ${PORT}`);
});