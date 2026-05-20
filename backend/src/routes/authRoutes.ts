import { Router } from 'express';
// Імпортуємо registerUser (як вона названа в контролері) та login
import { registerUser, login } from '../controllers/authController';

const router = Router();

// Маршрут для реєстрації: /api/auth/register
router.post('/register', registerUser);

// Маршрут для входу: /api/auth/login
router.post('/login', login);

export default router;