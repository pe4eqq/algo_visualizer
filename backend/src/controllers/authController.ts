import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';

// Функція генерації токена
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

// 1. РЕЄСТРАЦІЯ КОРИСТУВАЧА
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Перевіряємо, чи є вже такий email
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ error: 'Користувач з таким email вже існує' });
      return;
    }

    // Створюємо нового користувача через модель (IUser)
    const user = new User({
      username,
      email,
      password,
    });

    // Зберігаємо (спрацює хешування пароля в pre('save'))
    await user.save();

    res.status(201).json({
      success: true,
      token: generateToken(user.id),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Помилка при реєстрації:', error);
    res.status(500).json({ error: 'Помилка сервера при реєстрації' });
  }
};

// 2. ВХІД КОРИСТУВАЧА (ЛОГІН)
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Шукаємо за email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Неправильне ім\'я користувача або пароль' });
      return;
    }

    // Перевіряємо пароль за допомогою нашого нового методу
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Неправильне ім\'я користувача або пароль' });
      return;
    }

    res.json({
      success: true,
      token: generateToken(user.id),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Помилка при логіні:', error);
    res.status(500).json({ error: 'Помилка сервера під час авторизації' });
  }
};