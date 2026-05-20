import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Розширюємо стандартний інтерфейс Request в Express, щоб додати туди поле user
export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  // Токен передається в заголовках як "Authorization: Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Дістаємо чистий токен із рядка
      token = req.headers.authorization.split(' ')[1];

      // Розшифровуємо токен за допомогою нашого секрету
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // Знаходимо юзера в базі за ID з токена (але без пароля) і закидуємо в запит
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Передаємо керування далі контролеру
    } catch (error) {
      res.status(401).json({ error: 'Неавторизований доступ, токен недійсний' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Доступ заборонено, токен відсутній' });
  }
};