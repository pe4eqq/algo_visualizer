import { Request, Response } from 'express';
import { performance } from 'perf_hooks';

// ==========================================
// 1. БУЛЬБАШКОВЕ СОРТУВАННЯ (Bubble Sort)
// ==========================================
export const visualizeBubbleSort = (req: Request, res: Response): void => {
  try {
    const { array } = req.body;
    if (!array || !Array.isArray(array)) {
      res.status(400).json({ error: 'Будь ласка, передайте масив чисел' });
      return;
    }

    const arr = [...array];
    const steps: any[] = [];

    // ⏱️ СТАРТ ТАЙМЕРА
    const startTime = performance.now();

    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        steps.push({
          array: [...arr],
          comparing: [j, j + 1],
          swapping: []
        });

        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          
          steps.push({
            array: [...arr],
            comparing: [],
            swapping: [j, j + 1]
          });
        }
      }
    }

    // ⏱️ СТОП ТАЙМЕРА
    const endTime = performance.now();

    res.json({ 
      success: true, 
      steps, 
      pureExecutionTime: endTime - startTime 
    });
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера при сортуванні' });
  }
};

// ==========================================
// 2. ШВИДКЕ СОРТУВАННЯ (Quick Sort)
// ==========================================
export const visualizeQuickSort = (req: Request, res: Response): void => {
  try {
    const { array } = req.body;
    if (!array || !Array.isArray(array)) {
      res.status(400).json({ error: 'Будь ласка, передайте масив чисел' });
      return;
    }

    const arr = [...array];
    const steps: any[] = [];

    const partition = (low: number, high: number): number => {
      const pivot = arr[high];
      let i = low - 1;

      for (let j = low; j < high; j++) {
        steps.push({
          array: [...arr],
          comparing: [j, high],
          swapping: []
        });

        if (arr[j] < pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          steps.push({
            array: [...arr],
            comparing: [],
            swapping: [i, j]
          });
        }
      }

      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      steps.push({
        array: [...arr],
        comparing: [],
        swapping: [i + 1, high]
      });

      return i + 1;
    };

    const quickSortHelper = (low: number, high: number) => {
      if (low < high) {
        const pivotIdx = partition(low, high);
        quickSortHelper(low, pivotIdx - 1);
        quickSortHelper(pivotIdx + 1, high);
      }
    };

    // ⏱️ СТАРТ ТАЙМЕРА
    const startTime = performance.now();
    
    quickSortHelper(0, arr.length - 1);
    
    // ⏱️ СТОП ТАЙМЕРА
    const endTime = performance.now();

    res.json({ 
      success: true, 
      steps, 
      pureExecutionTime: endTime - startTime 
    });
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера при сортуванні' });
  }
};

// ==========================================
// 3. ПОШУК У ШИРИНУ (BFS)
// ==========================================
export const visualizeBFS = (req: Request, res: Response): void => {
  try {
    const { grid, start, end } = req.body;

    if (!grid || !start || !end) {
      res.status(400).json({ error: 'Надайте сітку (grid), старт (start) та фініш (end)' });
      return;
    }

    const rows = grid.length;
    const cols = grid[0].length;
    const queue: [number, number][] = [start];
    
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    visited[start[0]][start[1]] = true;

    const parent: { [key: string]: string } = {};
    const visitedOrder: [number, number][] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let found = false;

    // ⏱️ СТАРТ ТАЙМЕРА
    const startTime = performance.now();

    while (queue.length > 0) {
      const curr = queue.shift()!;
      visitedOrder.push(curr);

      if (curr[0] === end[0] && curr[1] === end[1]) {
        found = true;
        break;
      }

      for (const [dx, dy] of directions) {
        const nextX = curr[0] + dx;
        const nextY = curr[1] + dy;

        if (
          nextX >= 0 && nextX < rows &&
          nextY >= 0 && nextY < cols &&
          grid[nextX][nextY] !== 1 &&
          !visited[nextX][nextY]
        ) {
          queue.push([nextX, nextY]);
          visited[nextX][nextY] = true;
          parent[`${nextX},${nextY}`] = `${curr[0]},${curr[1]}`;
        }
      }
    }

    const shortestPath: [number, number][] = [];
    if (found) {
      let currStr = `${end[0]},${end[1]}`;
      const startStr = `${start[0]},${start[1]}`;

      while (currStr !== startStr) {
        const [x, y] = currStr.split(',').map(Number);
        shortestPath.push([x, y]);
        currStr = parent[currStr];
      }
      shortestPath.push(start);
      shortestPath.reverse();
    }

    // ⏱️ СТОП ТАЙМЕРА
    const endTime = performance.now();

    res.json({
      success: true,
      visitedOrder,
      shortestPath,
      pureExecutionTime: endTime - startTime
    });
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера під час обробки BFS' });
  }
};

// ==========================================
// 4. АЛГОРИТМ ДЕЙКСТРИ (Dijkstra)
// ==========================================
export const visualizeDijkstra = (req: Request, res: Response): void => {
  try {
    const { grid, start, end } = req.body;

    if (!grid || !start || !end) {
      res.status(400).json({ error: 'Надайте сітку (grid), старт (start) та фініш (end)' });
      return;
    }

    const rows = grid.length;
    const cols = grid[0].length;

    const distances = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
    distances[start[0]][start[1]] = 0;

    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const parent: { [key: string]: string } = {};
    const visitedOrder: [number, number][] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    // ⏱️ СТАРТ ТАЙМЕРА
    const startTime = performance.now();

    while (true) {
      let minDistance = Infinity;
      let curr: [number, number] | null = null;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!visited[r][c] && distances[r][c] < minDistance) {
            minDistance = distances[r][c];
            curr = [r, c];
          }
        }
      }

      if (!curr || minDistance === Infinity) break;

      const [currX, currY] = curr;
      visited[currX][currY] = true;
      visitedOrder.push(curr);

      if (currX === end[0] && currY === end[1]) break;

      for (const [dx, dy] of directions) {
        const nextX = currX + dx;
        const nextY = currY + dy;

        if (
          nextX >= 0 && nextX < rows &&
          nextY >= 0 && nextY < cols &&
          grid[nextX][nextY] !== 999 &&
          !visited[nextX][nextY]
        ) {
          const newDist = distances[currX][currY] + grid[nextX][nextY];

          if (newDist < distances[nextX][nextY]) {
            distances[nextX][nextY] = newDist;
            parent[`${nextX},${nextY}`] = `${currX},${currY}`;
          }
        }
      }
    }

    const shortestPath: [number, number][] = [];
    const endStr = `${end[0]},${end[1]}`;
    const startStr = `${start[0]},${start[1]}`;

    if (distances[end[0]][end[1]] !== Infinity) {
      let currStr = endStr;
      while (currStr !== startStr) {
        const [x, y] = currStr.split(',').map(Number);
        shortestPath.push([x, y]);
        currStr = parent[currStr];
      }
      shortestPath.push(start);
      shortestPath.reverse();
    }

    // ⏱️ СТОП ТАЙМЕРА
    const endTime = performance.now();

    res.json({
      success: true,
      distance: distances[end[0]][end[1]],
      visitedOrder,
      shortestPath,
      pureExecutionTime: endTime - startTime
    });
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера під час обробки алгоритму Дейкстри' });
  }
};

// ==========================================
// 5. ГЕНЕРАЦІЯ ЛАБІРИНТУ (Maze Generator)
// ==========================================
export const generateMaze = (req: Request, res: Response): void => {
  try {
    const { rows = 15, cols = 15 } = req.body;

    const rCount = rows % 2 === 0 ? rows + 1 : rows;
    const cCount = cols % 2 === 0 ? cols + 1 : cols;

    // ⏱️ СТАРТ ТАЙМЕРА
    const startTime = performance.now();

    const grid: number[][] = Array.from({ length: rCount }, () => Array(cCount).fill(1));
    const stack: [number, number][] = [];
    
    grid[1][1] = 0;
    stack.push([1, 1]);

    while (stack.length > 0) {
      const [currentX, currentY] = stack[stack.length - 1];
      const neighbors: [number, number, number, number][] = [];
      const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];

      for (const [dx, dy] of directions) {
        const nextX = currentX + dx;
        const nextY = currentY + dy;

        if (nextX > 0 && nextX < rCount - 1 && nextY > 0 && nextY < cCount - 1) {
          if (grid[nextX][nextY] === 1) {
            neighbors.push([nextX, nextY, dx / 2, dy / 2]);
          }
        }
      }

      if (neighbors.length > 0) {
        const [nextX, nextY, wallX, wallY] = neighbors[Math.floor(Math.random() * neighbors.length)];
        grid[currentX + wallX][currentY + wallY] = 0;
        grid[nextX][nextY] = 0;
        stack.push([nextX, nextY]);
      } else {
        stack.pop();
      }
    }

    const start: [number, number] = [1, 1];
    const end: [number, number] = [rCount - 2, cCount - 2];
    grid[start[0]][start[1]] = 0;
    grid[end[0]][end[1]] = 0;

    // ⏱️ СТОП ТАЙМЕРА
    const endTime = performance.now();

    res.json({
      success: true,
      grid,
      start,
      end,
      pureExecutionTime: endTime - startTime
    });
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера під час генерації лабіринту' });
  }
};

// ==========================================
// 6. СОРТУВАННЯ ВИБОРОМ (Selection Sort)
// ==========================================
export const visualizeSelectionSort = (req: Request, res: Response): void => {
  try {
    const { array } = req.body;
    if (!array || !Array.isArray(array)) {
      res.status(400).json({ error: 'Будь ласка, передайте масив чисел' });
      return;
    }

    const arr = [...array];
    const steps: any[] = [];

    // ⏱️ СТАРТ ТАЙМЕРА
    const startTime = performance.now();

    for (let i = 0; i < arr.length - 1; i++) {
      let minIdx = i;
      
      for (let j = i + 1; j < arr.length; j++) {
        steps.push({
          array: [...arr],
          comparing: [minIdx, j],
          swapping: []
        });

        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }
      }

      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [i, minIdx]
        });
      }
    }

    // ⏱️ СТОП ТАЙМЕРА
    const endTime = performance.now();

    res.json({ 
      success: true, 
      steps, 
      pureExecutionTime: endTime - startTime 
    });
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера при сортуванні' });
  }
};

// ==========================================
// 7. СОРТУВАННЯ ВСТАВКАМИ (Insertion Sort)
// ==========================================
export const visualizeInsertionSort = (req: Request, res: Response): void => {
  try {
    const { array } = req.body;
    if (!array || !Array.isArray(array)) {
      res.status(400).json({ error: 'Будь ласка, передайте масив чисел' });
      return;
    }

    const arr = [...array];
    const steps: any[] = [];

    // ⏱️ СТАРТ ТАЙМЕРА
    const startTime = performance.now();

    for (let i = 1; i < arr.length; i++) {
      let key = arr[i];
      let j = i - 1;

      while (j >= 0 && arr[j] > key) {
        steps.push({
          array: [...arr],
          comparing: [j, j + 1],
          swapping: [j, j + 1]
        });

        arr[j + 1] = arr[j];
        j = j - 1;
      }
      arr[j + 1] = key;
      
      steps.push({
        array: [...arr],
        comparing: [],
        swapping: [j + 1, i]
      });
    }

    // ⏱️ СТОП ТАЙМЕРА
    const endTime = performance.now();

    res.json({ 
      success: true, 
      steps, 
      pureExecutionTime: endTime - startTime 
    });
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера при сортуванні' });
  }
};

// ==========================================
// 8. СОРТУВАННЯ ЗЛИИТТЯМ (Merge Sort)
// ==========================================
export const visualizeMergeSort = (req: Request, res: Response): void => {
  try {
    const { array } = req.body;
    if (!array || !Array.isArray(array)) {
      res.status(400).json({ error: "Масив не надано" });
      return;
    }

    const steps: any[] = [];
    const currentArray = [...array];

    function merge(arr: number[], l: number, m: number, r: number) {
      let n1 = m - l + 1;
      let n2 = r - m;

      let L = new Array(n1);
      let R = new Array(n2);

      for (let i = 0; i < n1; i++) L[i] = arr[l + i];
      for (let j = 0; j < n2; j++) R[j] = arr[m + 1 + j];

      let i = 0, j = 0, k = l;

      while (i < n1 && j < n2) {
        steps.push({
          array: [...arr],
          comparing: [l + i, m + 1 + j],
          swapping: []
        });

        if (L[i] <= R[j]) {
          arr[k] = L[i];
          i++;
        } else {
          arr[k] = R[j];
          j++;
        }
        
        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [k]
        });
        k++;
      }

      while (i < n1) {
        arr[k] = L[i];
        steps.push({ array: [...arr], comparing: [], swapping: [k] });
        i++;
        k++;
      }

      while (j < n2) {
        arr[k] = R[j];
        steps.push({ array: [...arr], comparing: [], swapping: [k] });
        j++;
        k++;
      }
    }

    function mergeSort(arr: number[], l: number, r: number) {
      if (l >= r) return;
      let m = l + Math.floor((r - l) / 2);
      mergeSort(arr, l, m);
      mergeSort(arr, m + 1, r);
      merge(arr, l, m, r);
    }

    // ⏱️ СТАРТ ТАЙМЕРА
    const startTime = performance.now();

    mergeSort(currentArray, 0, currentArray.length - 1);

    // ⏱️ СТОП ТАЙМЕРА
    const endTime = performance.now();

    res.json({ 
      success: true, 
      steps, 
      pureExecutionTime: endTime - startTime 
    });
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера при сортуванні' });
  }
};

// ==========================================
// 9. ПІРАМІДАЛЬНЕ СОРТУВАННЯ (Heap Sort)
// ==========================================
export const visualizeHeapSort = (req: Request, res: Response): void => {
  try {
    const { array } = req.body;
    if (!array || !Array.isArray(array)) {
      res.status(400).json({ error: "Масив не надано" });
      return;
    }

    const steps: any[] = [];
    const arr = [...array];
    const n = arr.length;

    function heapify(arr: number[], n: number, i: number) {
      let largest = i;
      let l = 2 * i + 1;
      let r = 2 * i + 2;

      if (l < n) {
        steps.push({ array: [...arr], comparing: [l, largest], swapping: [] });
        if (arr[l] > arr[largest]) largest = l;
      }

      if (r < n) {
        steps.push({ array: [...arr], comparing: [r, largest], swapping: [] });
        if (arr[r] > arr[largest]) largest = r;
      }

      if (largest !== i) {
        steps.push({ array: [...arr], comparing: [], swapping: [i, largest] });
        let swap = arr[i];
        arr[i] = arr[largest];
        arr[largest] = swap;

        steps.push({ array: [...arr], comparing: [], swapping: [i, largest] });

        heapify(arr, n, largest);
      }
    }

    // ⏱️ СТАРТ ТАЙМЕРА
    const startTime = performance.now();

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      heapify(arr, n, i);
    }

    for (let i = n - 1; i > 0; i--) {
      steps.push({ array: [...arr], comparing: [], swapping: [0, i] });
      let temp = arr[0];
      arr[0] = arr[i];
      arr[i] = temp;
      
      steps.push({ array: [...arr], comparing: [], swapping: [0, i] });
      heapify(arr, i, 0);
    }

    // ⏱️ СТОП ТАЙМЕРА
    const endTime = performance.now();

    res.json({ 
      success: true, 
      steps, 
      pureExecutionTime: endTime - startTime 
    });
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера при сортуванні' });
  }
};

// ==========================================
// 10. СОРТУВАННЯ ШЕЛЛА (Shell Sort)
// ==========================================
export const visualizeShellSort = (req: Request, res: Response): void => {
  try {
    const { array } = req.body;
    if (!array || !Array.isArray(array)) {
      res.status(400).json({ error: "Масив не надано" });
      return;
    }

    const steps: any[] = [];
    const arr = [...array];
    const n = arr.length;

    // ⏱️ СТАРТ ТАЙМЕРА
    const startTime = performance.now();

    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < n; i += 1) {
        let temp = arr[i];
        let j;
        
        for (j = i; j >= gap; j -= gap) {
          steps.push({
            array: [...arr],
            comparing: [j - gap, j],
            swapping: []
          });

          if (arr[j - gap] > temp) {
            steps.push({ array: [...arr], comparing: [], swapping: [j, j - gap] });
            arr[j] = arr[j - gap];
            steps.push({ array: [...arr], comparing: [], swapping: [j, j - gap] });
          } else {
            break;
          }
        }
        arr[j] = temp;
        steps.push({ array: [...arr], comparing: [], swapping: [j] });
      }
    }

    // ⏱️ СТОП ТАЙМЕРА
    const endTime = performance.now();

    res.json({ 
      success: true, 
      steps, 
      pureExecutionTime: endTime - startTime 
    });
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера при сортуванні' });
  }
};

// ==========================================
// 11. БОГОСОРТ (Bogo Sort)
// ==========================================
export const visualizeBogoSort = (req: Request, res: Response): void => {
  try {
    const { array } = req.body;
    if (!array || !Array.isArray(array)) {
      res.status(400).json({ error: "Масив не надано" });
      return;
    }

    const steps: any[] = [];
    const arr = [...array];

    function isSorted(a: number[]) {
      for (let i = 0; i < a.length - 1; i++) {
        if (a[i] > a[i + 1]) return false;
      }
      return true;
    }

    function shuffle(a: number[]) {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
    }

    let safetyCounter = 0;
    const MAX_ATTEMPTS = 20000;

    // ⏱️ СТАРТ ТАЙМЕРА
    const startTime = performance.now();

    while (!isSorted(arr) && safetyCounter < MAX_ATTEMPTS) {
      shuffle(arr);
      safetyCounter++;

      steps.push({
        array: [...arr],
        comparing: [],
        swapping: Array.from({ length: arr.length }, (_, i) => i)
      });
    }

    // ⏱️ СТОП ТАЙМЕРА
    const endTime = performance.now();

    res.json({ 
      success: true, 
      steps, 
      pureExecutionTime: endTime - startTime 
    });
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера при сортуванні' });
  }
};
// Допоміжна функція валідації меж (переконайся, що вона є вгорі файлу algoController.ts)
const isValid = (r: number, c: number, rows: number, cols: number): boolean => {
  return r >= 0 && r < rows && c >= 0 && c < cols;
};

// Манхеттенська відстань для евристик
const getManhattanDistance = (p1: [number, number], p2: [number, number]): number => {
  return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1]);
};


// 3. Пошук у глибину (DFS) — ТВОЯ НОВА ФУНКЦІЯ
export const visualizeDFS = async (req: Request, res: Response): Promise<void> => {
  try {
    const { grid, start, end } = req.body;
    const startTime = performance.now();
    const rows = grid.length;
    const cols = grid[0].length;
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const parent: { [key: string]: string } = {};
    const visitedOrder: [number, number][] = [];
    let found = false;

    const stack: [number, number][] = [start];
    visited[start[0]][start[1]] = true;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      if (!(r === start[0] && c === start[1]) && !(r === end[0] && c === end[1])) {
        visitedOrder.push([r, c]);
      }
      if (r === end[0] && c === end[1]) {
        found = true;
        break;
      }
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (isValid(nr, nc, rows, cols) && !visited[nr][nc] && grid[nr][nc] !== 1) {
          visited[nr][nc] = true;
          parent[`${nr}-${nc}`] = `${r}-${c}`;
          stack.push([nr, nc]);
        }
      }
    }

    const shortestPath: [number, number][] = [];
    if (found) {
      let currKey = `${end[0]}-${end[1]}`;
      while (currKey !== `${start[0]}-${start[1]}`) {
        const [r, c] = currKey.split('-').map(Number);
        if (!(r === end[0] && c === end[1])) shortestPath.push([r, c]);
        currKey = parent[currKey];
      }
      shortestPath.reverse();
    }
    const endTime = performance.now();
    res.json({ success: true, visitedOrder, shortestPath, pureExecutionTime: endTime - startTime });
  } catch (error) {
    res.status(500).json({ error: 'Помилка DFS' });
  }
};

// 4. Алгоритм A* (A-STAR) — ТВОЯ НОВА ФУНКЦІЯ
export const visualizeAStar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { grid, start, end } = req.body;
    const startTime = performance.now();
    const rows = grid.length;
    const cols = grid[0].length;
    const visitedOrder: [number, number][] = [];
    const shortestPath: [number, number][] = [];

    const gScore = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
    const fScore = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
    const parent: { [key: string]: string } = {};
    const inOpenSet = Array.from({ length: rows }, () => Array(cols).fill(false));

    gScore[start[0]][start[1]] = 0;
    fScore[start[0]][start[1]] = getManhattanDistance(start, end);

    const openSet: [number, number][] = [start];
    inOpenSet[start[0]][start[1]] = true;
    let found = false;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (openSet.length > 0) {
      let minIdx = 0;
      for (let i = 1; i < openSet.length; i++) {
        const [r1, c1] = openSet[i];
        const [r2, c2] = openSet[minIdx];
        if (fScore[r1][c1] < fScore[r2][c2]) minIdx = i;
      }

      const current = openSet.splice(minIdx, 1)[0];
      const [r, c] = current;
      inOpenSet[r][c] = false;

      if (!(r === start[0] && c === start[1]) && !(r === end[0] && c === end[1])) {
        visitedOrder.push([r, c]);
      }
      if (r === end[0] && c === end[1]) {
        found = true;
        break;
      }

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (isValid(nr, nc, rows, cols) && grid[nr][nc] !== 1) {
          const tentativeGScore = gScore[r][c] + 1;
          if (tentativeGScore < gScore[nr][nc]) {
            parent[`${nr}-${nc}`] = `${r}-${c}`;
            gScore[nr][nc] = tentativeGScore;
            fScore[nr][nc] = tentativeGScore + getManhattanDistance([nr, nc], end);
            if (!inOpenSet[nr][nc]) {
              openSet.push([nr, nc]);
              inOpenSet[nr][nc] = true;
            }
          }
        }
      }
    }

    if (found) {
      let currKey = `${end[0]}-${end[1]}`;
      while (currKey !== `${start[0]}-${start[1]}`) {
        const [r, c] = currKey.split('-').map(Number);
        if (!(r === end[0] && c === end[1])) shortestPath.push([r, c]);
        currKey = parent[currKey];
      }
      shortestPath.reverse();
    }
    const endTime = performance.now();
    res.json({ success: true, visitedOrder, shortestPath, pureExecutionTime: endTime - startTime });
  } catch (error) {
    res.status(500).json({ error: 'Помилка A*' });
  }
};

// 5. Жадібний пошук (Greedy Best-First) — ТВОЯ НОВА ФУНКЦІЯ
export const visualizeGreedy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { grid, start, end } = req.body;
    const startTime = performance.now();
    const rows = grid.length;
    const cols = grid[0].length;
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const parent: { [key: string]: string } = {};
    const visitedOrder: [number, number][] = [];
    const shortestPath: [number, number][] = [];

    const openSet: { pos: [number, number]; h: number }[] = [
      { pos: start, h: getManhattanDistance(start, end) }
    ];
    visited[start[0]][start[1]] = true;
    let found = false;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.h - b.h);
      const { pos } = openSet.shift()!;
      const [r, c] = pos;

      if (!(r === start[0] && c === start[1]) && !(r === end[0] && c === end[1])) {
        visitedOrder.push([r, c]);
      }
      if (r === end[0] && c === end[1]) {
        found = true;
        break;
      }

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (isValid(nr, nc, rows, cols) && !visited[nr][nc] && grid[nr][nc] !== 1) {
          visited[nr][nc] = true;
          parent[`${nr}-${nc}`] = `${r}-${c}`;
          openSet.push({ pos: [nr, nc], h: getManhattanDistance([nr, nc], end) });
        }
      }
    }

    if (found) {
      let currKey = `${end[0]}-${end[1]}`;
      while (currKey !== `${start[0]}-${start[1]}`) {
        const [r, c] = currKey.split('-').map(Number);
        if (!(r === end[0] && c === end[1])) shortestPath.push([r, c]);
        currKey = parent[currKey];
      }
      shortestPath.reverse();
    }
    const endTime = performance.now();
    res.json({ success: true, visitedOrder, shortestPath, pureExecutionTime: endTime - startTime });
  } catch (error) {
    res.status(500).json({ error: 'Помилка Greedy' });
  }
};