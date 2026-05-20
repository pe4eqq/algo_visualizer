import { Router } from 'express';
import { 
  visualizeBubbleSort, 
  visualizeQuickSort, 
  visualizeSelectionSort,
  visualizeInsertionSort,
  visualizeMergeSort,
  visualizeHeapSort,
  visualizeShellSort,
  visualizeBogoSort,
  // Алгоритми лабіринтів (Старі)
  generateMaze,
  visualizeBFS, 
  visualizeDijkstra,
  // 💥 НОВІ АЛГОРИТМИ ЛАБІРИНТІВ (Додаємо сюди):
  visualizeDFS,
  visualizeAStar,
  visualizeGreedy
} from '../controllers/algoController';

const router = Router();

// --- СОРТУВАННЯ ---
router.post('/bubble-sort', visualizeBubbleSort);
router.post('/quick-sort', visualizeQuickSort);
router.post('/selection-sort', visualizeSelectionSort);
router.post('/insertion-sort', visualizeInsertionSort);
router.post('/merge-sort', visualizeMergeSort);
router.post('/heap-sort', visualizeHeapSort);
router.post('/shell-sort', visualizeShellSort);
router.post('/bogo-sort', visualizeBogoSort);

// --- ЛАБІРИНТИ ---
router.post('/generate-maze', generateMaze);
router.post('/bfs', visualizeBFS); // Твоя стара назва для BFS
router.post('/dijkstra', visualizeDijkstra); // Твоя стара назва для Дейкстри

// 💥 РЕЄСТРУЄМО НОВІ РОУТИ ДЛЯ ЛАБІРИНТІВ:
router.post('/dfs', visualizeDFS);
router.post('/astar', visualizeAStar);
router.post('/greedy', visualizeGreedy);

export default router;