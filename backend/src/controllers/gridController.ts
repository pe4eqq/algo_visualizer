import { Request, Response } from 'express';
import Grid from '../models/Grid';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// 1. Зберегти карту для конкретного юзера
export const saveGrid = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, grid, start, end } = req.body;

    if (!name || !grid || !start || !end) {
      res.status(400).json({ error: 'Заповніть усі поля' });
      return;
    }

    // Створюємо карту, передаючи ID авторизованого юзера з токена
    const newGrid = new Grid({
      user: req.user._id,
      name,
      grid,
      start,
      end
    });

    await newGrid.save();
    res.status(201).json({ success: true, message: 'Карту успішно збережено за вашим акаунтом!', data: newGrid });
  } catch (error: any) {
    res.status(500).json({ error: 'Помилка при збереженні карти' });
  }
};

// 2. Отримати карти тільки ПОТОЧНОГО користувача
export const getAllGrids = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Шукаємо в базі тільки ті карти, де поле user збігається з ID з токена
    const grids = await Grid.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: grids.length, data: grids });
  } catch (error: any) {
    res.status(500).json({ error: 'Помилка при отриманні карт' });
  }
};

// 3. Оновити існуючу карту за її ID (Update)
export const updateGrid = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, grid, start, end } = req.body;

    // Шукаємо карту за ID та оновлюємо її новими даними
    const updatedGrid = await Grid.findByIdAndUpdate(
      id,
      { name, grid, start, end },
      { new: true, runValidators: true } // new: true повертає вже оновлений документ
    );

    if (!updatedGrid) {
      res.status(404).json({ error: 'Карту з таким ID не знайдено' });
      return;
    }

    res.json({ success: true, message: 'Карту успішно оновлено!', data: updatedGrid });
  } catch (error: any) {
    res.status(500).json({ error: 'Помилка при оновленні карти в базі даних' });
  }
};

// 4. Видалити карту за її ID (Delete)
export const deleteGrid = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedGrid = await Grid.findByIdAndDelete(id);

    if (!deletedGrid) {
      res.status(404).json({ error: 'Карту з таким ID не знайдено' });
      return;
    }

    res.json({ success: true, message: 'Карту успішно видалено із бази!' });
  } catch (error: any) {
    res.status(500).json({ error: 'Помилка при видаленні карти з бази даних' });
  }
};