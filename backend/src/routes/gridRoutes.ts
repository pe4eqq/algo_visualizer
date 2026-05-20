import { Router } from 'express';
import { saveGrid, getAllGrids, updateGrid, deleteGrid } from '../controllers/gridController';
import { protect } from '../middleware/authMiddleware';
const router = Router();

// Застосовуємо middleware protect до всіх маршрутів нижче
router.use(protect as any); 

router.post('/save', saveGrid);
router.get('/all', getAllGrids);
router.put('/:id', updateGrid);
router.delete('/:id', deleteGrid);

export default router;