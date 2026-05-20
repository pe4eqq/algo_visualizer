import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import API from '../services/api';
import { Play, Pause, Square, RefreshCw, Compass, Save, Gauge, Maximize2, Zap } from 'lucide-react';

const PSEUDOCODES: Record<string, string[]> = {
  bfs: [
    "function BFS(grid, start, end) {",
    "  let queue = [start];",
    "  let visited = new Set([start]);",
    "  while (queue.length > 0) {",
    "    let current = queue.shift();",
    "    if (current == end) break;",
    "    for (let neighbor of current.neighbors) {",
    "      if (!visited.has(neighbor)) {",
    "        visited.add(neighbor);",
    "        queue.push(neighbor);",
    "      }",
    "    }",
    "  }",
    "  return reconstruct_path(end);",
    "}"
  ],
  dfs: [
    "function DFS(grid, start, end) {",
    "  let stack = [start];",
    "  let visited = new Set();",
    "  while (stack.length > 0) {",
    "    let current = stack.pop();",
    "    if (current == end) break;",
    "    if (!visited.has(current)) {",
    "      visited.add(current);",
    "      for (let neighbor of current.neighbors) {",
    "        stack.push(neighbor);",
    "      }",
    "    }",
    "  }",
    "  return reconstruct_path(end);",
    "}"
  ],
  dijkstra: [
    "function Dijkstra(grid, start, end) {",
    "  let distances = { all: Infinity, start: 0 };",
    "  let pq = new PriorityQueue([start]);",
    "  while (!pq.isEmpty()) {",
    "    let current = pq.extractMin();",
    "    if (current == end) break;",
    "    for (let neighbor of current.neighbors) {",
    "      let alt = distances[current] + weight;",
    "      if (alt < distances[neighbor]) {",
    "        distances[neighbor] = alt;",
    "        pq.decreaseKey(neighbor, alt);",
    "      }",
    "    }",
    "  }",
    "  return shortest_path;",
    "}"
  ],
  astar: [
    "function AStar(grid, start, end) {",
    "  let gScore = { start: 0 }, fScore = { start: h(start) };",
    "  let openSet = new PriorityQueue([start]);",
    "  while (!openSet.isEmpty()) {",
    "    let current = openSet.extractMin();",
    "    if (current == end) break;",
    "    for (let neighbor of current.neighbors) {",
    "      let tentative_g = gScore[current] + 1;",
    "      if (tentative_g < gScore[neighbor]) {",
    "        gScore[neighbor] = tentative_g;",
    "        fScore[neighbor] = tentative_g + h(neighbor);",
    "        openSet.insertOrUpdate(neighbor, fScore[neighbor]);",
    "      }",
    "    }",
    "  }",
    "  return path;",
    "}"
  ],
  greedy: [
    "function GreedyBestFirst(grid, start, end) {",
    "  let openSet = new PriorityQueue([start]);",
    "  let visited = new Set();",
    "  while (!openSet.isEmpty()) {",
    "    let current = openSet.extractMin();",
    "    if (current == end) break;",
    "    visited.add(current);",
    "    for (let neighbor of current.neighbors) {",
    "      if (!visited.has(neighbor)) {",
    "        openSet.insert(neighbor, h(neighbor));",
    "      }",
    "    }",
    "  }",
    "  return path;",
    "}"
  ]
};

interface SavedMaze {
  _id: string;
  name: string;
  grid: number[][];
  start: [number, number];
  end: [number, number];
}

interface Step {
  type: 'visited' | 'path';
  key: string;
}

interface MazeVisualizerProps {
  // Оновлено: тепер onRecordHistory вміє приймати повну структуру карти
  onRecordHistory?: (
    algoName: string, 
    algoKey: string, 
    gridSizeInfo: string, 
    executionTimeMs: number,
    grid?: number[][],
    start?: [number, number],
    end?: [number, number],
    gridSize?: number
  ) => void;
  restoredAlgo?: { 
    algoKey: string; 
    timestamp: number;
    grid?: number[][];
    start?: [number, number];
    end?: [number, number];
    gridSize?: number;
  } | null;
  addToHistory?: (historyItem: {
    type: "sorting" | "maze";
    algoName: string;
    info: string;
    metrics: {
      time?: string;
      details?: string;
    };
    grid?: number[][];
    start?: [number, number];
    end?: [number, number];
    gridSize?: number;
    algoKey?: string;
  }) => void;
}

export default function MazeVisualizer({ addToHistory, onRecordHistory, restoredAlgo }: MazeVisualizerProps) {
  const [gridSize, setGridSize] = useState<number>(15);
  const [grid, setGrid] = useState<number[][]>(Array.from({ length: 15 }, () => Array(15).fill(0)));
  
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [pathfindingTime, setPathfindingTime] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [savedMazes, setSavedMazes] = useState<SavedMaze[]>([]);
  const [isLoadingMazes, setIsLoadingMazes] = useState<boolean>(false);
  
  const [startPoint, setStartPoint] = useState<[number, number]>([1, 1]);
  const [endPoint, setEndPoint] = useState<[number, number]>([13, 13]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedPathAlgo, setSelectedPathAlgo] = useState<string>('bfs');

  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1);
  const [isVisualizing, setIsVisualizing] = useState<boolean>(false);

  const [visitedCells, setVisitedCells] = useState<string[]>([]);
  const [finalPath, setFinalPath] = useState<string[]>([]);
  const [activeLine, setActiveLine] = useState<number | null>(null);

  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Слідкуємо за відновленням лабіринту та алгоритму з історії
  // Слідкуємо за відновленням лабіринту та алгоритму з історії
  useEffect(() => {
    if (restoredAlgo) {
      if (restoredAlgo.algoKey) setSelectedPathAlgo(restoredAlgo.algoKey);
      
      // РОБИМО ГЛИБОКУ КОПІЮ масивів, щоб React завжди бачив новий стан і рендерив його
      if (restoredAlgo.grid) {
        setGrid(restoredAlgo.grid.map(row => [...row]));
      }
      if (restoredAlgo.gridSize) setGridSize(restoredAlgo.gridSize);
      if (restoredAlgo.start) setStartPoint([...restoredAlgo.start]);
      if (restoredAlgo.end) setEndPoint([...restoredAlgo.end]);

      resetPlayer(); // Готуємо карту до нового запуску з відновленими даними
    }
  }, [restoredAlgo, restoredAlgo?.timestamp]); // ⚠️ Додали timestamp!

  const fetchSavedMazes = async () => {
    setIsLoadingMazes(true);
    try {
      const response = await API.get('/grids/all');
      setSavedMazes(response.data.data || response.data); 
    } catch (error) {
      console.error('Помилка при отримані лабіринту:', error);
    } finally {
      setIsLoadingMazes(false);
    }
  };

  useEffect(() => {
    fetchSavedMazes();
  }, []);

  const handleGenerateMaze = async () => {
    if (isProcessing || isVisualizing) return;
    setIsProcessing(true);
    resetPlayer();
    setGenerationTime(null);
    setPathfindingTime(null);
    try {
      const response = await API.post('/algos/generate-maze', { rows: gridSize, cols: gridSize });
      if (response.data.success) {
        setGrid(response.data.grid);
        setStartPoint(response.data.start);
        setEndPoint(response.data.end);
        const pTime = response.data.pureExecutionTime || 0;
        setGenerationTime(pTime); 

        if (addToHistory) {
          addToHistory({
            type: "maze",
            algoName: "Генерація лабіринту",
            info: `Розмір: ${gridSize}x${gridSize}`,
            metrics: { time: `${pTime.toFixed(2)} мс` },
            grid: response.data.grid,
            start: response.data.start,
            end: response.data.end,
            gridSize,
            algoKey: selectedPathAlgo
          });
        }
      }
    } catch (error) {
      console.error('Помилка при генерації лабіринту:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPlayer = () => {
    if (animationRef.current) clearTimeout(animationRef.current);
    setIsVisualizing(false);
    setIsPaused(false);
    setCurrentStepIdx(0);
    setSteps([]);
    setVisitedCells([]);
    setFinalPath([]);
    setActiveLine(null);
  };

  const handleStartPathfinding = async () => {
    if (isProcessing || isVisualizing || !grid.length) return;
    resetPlayer();
    setIsProcessing(true);
    setPathfindingTime(null);

    try {
      const response = await API.post(`/algos/${selectedPathAlgo}`, {
        grid,
        start: startPoint,
        end: endPoint,
      });

      if (response.data.success) {
        const pTime = response.data.pureExecutionTime;
        setPathfindingTime(pTime);
        const { visitedOrder, shortestPath } = response.data;

        const compiledSteps: Step[] = [];
        visitedOrder.forEach(([x, y]: [number, number]) => {
          compiledSteps.push({ type: 'visited', key: `${x}-${y}` });
        });
        shortestPath.forEach(([x, y]: [number, number]) => {
          compiledSteps.push({ type: 'path', key: `${x}-${y}` });
        });

        setSteps(compiledSteps);
        setIsVisualizing(true);

        // === ЗАПИС В ІСТОРІЮ ЗАПУСКІВ (Тепер з повною картою) ===
        if (onRecordHistory) {
          const algoNames: Record<string, string> = {
            bfs: 'BFS (Пошук в ширину)',
            dijkstra: 'Алгоритм Дейкстри',
            dfs: 'DFS (Пошук в глибину)',
            astar: 'Алгоритм A* (Розумний)',
            greedy: 'Жадібний пошук',
          };
          const name = algoNames[selectedPathAlgo] || selectedPathAlgo.toUpperCase();
          
          const sizeLabels: Record<number, string> = { 15: 'Малий', 25: 'Середній', 35: 'Великий', 51: 'Екстремальний' };
          const sizeLabel = sizeLabels[gridSize] || 'Кастомний';
          const gridSizeInfo = `${sizeLabel} (${gridSize}x${gridSize})`;

          // Передаємо grid, startPoint, endPoint та gridSize, щоб історія їх зберегла!
          onRecordHistory(name, selectedPathAlgo, gridSizeInfo, pTime, grid, startPoint, endPoint, gridSize);
        }

        // === ДОДАВАННЯ У КОРОТКУ ІСТОРІЮ ===
        if (addToHistory) {
          addToHistory({
            type: "maze",
            algoName: selectedPathAlgo.toUpperCase(),
            info: `Пошук у лабіринті ${gridSize}x${gridSize}`,
            metrics: { 
              time: `${pTime.toFixed(2)} мс`,
              details: `Клітин відвідано: ${visitedOrder.length}`
            },
            grid,
            start: startPoint,
            end: endPoint,
            gridSize,
            algoKey: selectedPathAlgo
          });
        }
      }
    } catch (error) {
      console.error('Помилка пошуку шляху:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isVisualizing || isPaused || steps.length === 0) return;

    if (currentStepIdx >= steps.length) {
      setIsVisualizing(false);
      setActiveLine(null);
      return;
    }

    const delay = 25 / animationSpeed;

    animationRef.current = setTimeout(() => {
      const currentStep = steps[currentStepIdx];
      const maxLines = PSEUDOCODES[selectedPathAlgo].length - 1;
      
      if (currentStep.type === 'visited') {
        setVisitedCells((prev) => [...prev, currentStep.key]);
        setActiveLine(Math.min(4 + (currentStepIdx % 5), maxLines)); 
      } else {
        setFinalPath((prev) => [...prev, currentStep.key]);
        setActiveLine(Math.max(0, maxLines - 1)); 
      }

      setCurrentStepIdx((prev) => prev + 1);
    }, delay);

    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [isVisualizing, isPaused, currentStepIdx, steps, animationSpeed, selectedPathAlgo]);

  const handleStepSliderChange = (idx: number) => {
    if (steps.length === 0) return;
    setIsPaused(true);
    
    const targetIdx = Math.min(idx, steps.length - 1);
    setCurrentStepIdx(targetIdx);

    const visited: string[] = [];
    const path: string[] = [];

    for (let i = 0; i <= targetIdx; i++) {
      if (steps[i].type === 'visited') {
        visited.push(steps[i].key);
      } else {
        path.push(steps[i].key);
      }
    }
    setVisitedCells(visited);
    setFinalPath(path);

    if (steps[targetIdx]) {
      const maxLines = PSEUDOCODES[selectedPathAlgo].length - 1;
      setActiveLine(
        steps[targetIdx].type === 'visited' 
          ? Math.min(4 + (targetIdx % 5), maxLines) 
          : Math.max(0, maxLines - 1)
      );
    }
  };
  

 const handleSelectMaze = (mazeId: string) => {
    if (!mazeId) return;
    const selected = savedMazes.find(m => m._id === mazeId);
    if (selected) {
      resetPlayer();
      // Глибока копія карти та координат
      setGrid(selected.grid.map(row => [...row]));
      setGridSize(selected.grid.length);
      setStartPoint([...selected.start]);
      setEndPoint([...selected.end]);
      setGenerationTime(null);
      setPathfindingTime(null);
    }
  };
  

  return (
    <div style={{ padding: '24px 0', background: 'transparent', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', width: '100%' }}>
      
      {/* ПАНЕЛЬ ПЛЕЄРА АНІМАЦІЇ */}
      {isVisualizing && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '1.5rem', gap: '1.5rem', flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => setIsPaused(!isPaused)} style={{ background: '#334155', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {isPaused ? <Play size={16} color="#10b981" /> : <Pause size={16} color="#eab308" />}
              {isPaused ? 'Продовжити' : 'Пауза'}
            </button>
            <button type="button" onClick={resetPlayer} style={{ background: '#ef4444', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
              <Square size={14} /> Стоп
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Gauge size={16} color="#94a3b8" />
            <span style={{ color: '#94a3b8', fontSize: '13px', minWidth: '90px' }}>Швидкість: <b>{animationSpeed}x</b></span>
            <input type="range" min="0.5" max="5" step="0.5" value={animationSpeed} onChange={(e: ChangeEvent<HTMLInputElement>) => setAnimationSpeed(Number(e.target.value))} style={{ accentColor: '#6366f1', cursor: 'pointer', width: '100px' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '200px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px', whiteSpace: 'nowrap' }}>Крок: <b>{currentStepIdx}</b> / {steps.length}</span>
            <input type="range" min="0" max={steps.length > 0 ? steps.length - 1 : 0} value={currentStepIdx} onChange={(e: ChangeEvent<HTMLInputElement>) => handleStepSliderChange(Number(e.target.value))} style={{ flex: '1', accentColor: '#6366f1', cursor: 'pointer' }} />
          </div>
        </div>
      )}

      {/* ГОЛОВНИЙ КОНТЕЙНЕР */}
      <div style={{ 
        display: 'flex', 
        gap: '24px', 
        alignItems: 'flex-start', 
        justifyContent: 'center', 
        width: '100%',
        boxSizing: 'border-box',
        flexWrap: 'wrap'
      }}>
        
        {/* 1. ЛІВА ПАНЕЛЬ */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '6px' }}>
            <Maximize2 size={16} color="#94a3b8" />
            <select
              value={gridSize}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const size = Number(e.target.value);
                setGridSize(size);
                setGrid(Array.from({ length: size }, () => Array(size).fill(0)));
                setStartPoint([1, 1]);
                setEndPoint([size - 2, size - 2]);
                resetPlayer();
              }}
              disabled={isProcessing || isVisualizing}
              style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', fontSize: '14px', cursor: 'pointer', width: '100%' }}
            >
              <option value="15" style={{ background: '#1e293b' }}>Малий (15 x 15)</option>
              <option value="25" style={{ background: '#1e293b' }}>Середній (25 x 25)</option>
              <option value="35" style={{ background: '#1e293b' }}>Великий (35 x 35)</option>
              <option value="51" style={{ background: '#1e293b' }}>Екстремальний (51 x 51)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '6px' }}>
            <Compass size={16} color="#94a3b8" />
            <select
              value={selectedPathAlgo}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setSelectedPathAlgo(e.target.value);
                setActiveLine(null);
              }}
              disabled={isProcessing || isVisualizing}
              style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', fontSize: '14px', cursor: 'pointer', width: '100%' }}
            >
              <option value="bfs" style={{ background: '#1e293b' }}>BFS (Пошук в ширину)</option>
              <option value="dijkstra" style={{ background: '#1e293b' }}>Алгоритм Дейкстри</option>
              <option value="dfs" style={{ background: '#1e293b' }}>DFS (Пошук в глибину)</option>
              <option value="astar" style={{ background: '#1e293b' }}>Алгоритм A* (Розумний)</option>
              <option value="greedy" style={{ background: '#1e293b' }}>Жадібний пошук</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleStartPathfinding}
            disabled={isProcessing || !grid.length || isVisualizing}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.75rem 1.5rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', opacity: (isProcessing || !grid.length || isVisualizing) ? 0.6 : 1 }}
          >
            <Play size={16} /> {isProcessing ? 'Пошук...' : 'Запустити пошук'}
          </button>

          <button
            type="button"
            onClick={handleGenerateMaze}
            disabled={isProcessing || isVisualizing}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.75rem 1.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', opacity: (isProcessing || isVisualizing) ? 0.6 : 1 }}
          >
            <RefreshCw size={16} /> Згенерувати лабіринт
          </button>

          <button
            type="button"
            onClick={() => {
              const mazeName = window.prompt('Введіть назву для цього лабіринту:');
              if (!mazeName || mazeName.trim() === '') return;
              API.post('/grids/save', { name: mazeName, grid, start: startPoint, end: endPoint })
                .then(() => { alert('✅ Збережено!'); fetchSavedMazes(); })
                .catch(err => console.error(err));
            }}
            disabled={isProcessing || isVisualizing}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: (isProcessing || isVisualizing) ? 0.6 : 1 }}
          >
            <Save size={16} /> Зберегти у хмару
          </button>

          <div style={{ position: 'relative', width: '100%' }}>
            <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', color: '#fff', padding: '12px 18px', borderRadius: '10px', border: '1px solid #475569', cursor: 'pointer', width: '100%', fontSize: '14px' }}>
              <span>{isLoadingMazes ? '⏳ Завантаження...' : '📁 Мої лабіринти'}</span>
              <span>{isDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {isDropdownOpen && (
              <div style={{ position: 'absolute', width: '100%', marginTop: '8px', borderRadius: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', zIndex: 50, maxHeight: '200px', overflowY: 'auto' }}>
                {savedMazes.length === 0 ? (
                  <div style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>Немає збережених лабіринтів</div>
                ) : (
                  savedMazes.map((m) => (
                    <button key={m._id} type="button" onClick={() => { handleSelectMaze(m._id); setIsDropdownOpen(false); }} style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', borderBottom: '1px solid #1e293b', color: '#fff', textAlign: 'left', cursor: 'pointer' }}>{m.name}</button>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={{ background: '#0f172a', borderRadius: '10px', border: '1px solid #1e293b', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold', color: '#eab308', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
              <Zap size={16} />
              <span>Швидкість алгоритмів</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Генерація карти:</span>
                <span style={{ fontWeight: '600', color: generationTime !== null ? '#10b981' : '#475569' }}>
                  {generationTime !== null ? `${generationTime.toFixed(2)} мс` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Пошук шляху:</span>
                <span style={{ fontWeight: '600', color: pathfindingTime !== null ? '#6366f1' : '#475569' }}>
                  {pathfindingTime !== null ? `${pathfindingTime.toFixed(2)} мс` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ЦЕНТРАЛЬНИЙ ЛАБІРИНТ */}
        <div style={{ 
          flex: '1 1 400px', 
          maxWidth: '550px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          background: '#0f172a', 
          padding: '20px', 
          borderRadius: '12px', 
          border: '1px solid #1e293b', 
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${grid.length > 0 ? grid[0].length : gridSize}, 1fr)`, 
            gap: '1px', 
            width: '100%', 
            aspectRatio: '1 / 1', 
            background: '#1e293b', 
            borderRadius: '6px', 
            overflow: 'hidden' 
           }}>
            {grid.map((row, rIdx) => 
              row.map((cell, cIdx) => {
                const key = `${rIdx}-${cIdx}`;
                let bg = '#0f172a';
                if (cell === 1) bg = '#334155';
                if (visitedCells.includes(key)) bg = '#22d3ee';
                if (finalPath.includes(key)) bg = '#eab308';
                if (startPoint && startPoint[0] === rIdx && startPoint[1] === cIdx) bg = '#10b981';
                if (endPoint && endPoint[0] === rIdx && endPoint[1] === cIdx) bg = '#ef4444';

                return (
                  <div key={key} style={{ backgroundColor: bg, transition: 'background-color 0.04s ease', width: '100%', height: '100%' }} />
                );
              })
            )}
          </div>
        </div>

        {/* 3. ПСЕВДОКОД */}
        <div style={{ 
          width: '340px', 
          background: '#0f172a', 
          borderRadius: '12px', 
          border: '1px solid #1e293b', 
          display: 'flex',
          flexDirection: 'column', 
          flexShrink: 0,
          height: '550px'
        }}>
          <div style={{ background: '#1e293b', padding: '12px 16px', borderBottom: '1px solid #1e293b', flexShrink: 0, borderRadius: '12px 12px 0 0' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📝 Псевдокод: {selectedPathAlgo.toUpperCase()}
            </span>
          </div>
          
          <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.7', overflowY: 'auto', overflowX: 'auto', whiteSpace: 'pre', textAlign: 'left', flex: 1 }}>
            {PSEUDOCODES[selectedPathAlgo].map((line, index) => {
              const isCurrentLine = activeLine === index;
              return (
                <div
                  key={index}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '4px',
                    background: isCurrentLine ? 'rgba(234, 179, 8, 0.22)' : 'transparent',
                    borderLeft: isCurrentLine ? '4px solid #eab308' : '4px solid transparent',
                    color: isCurrentLine ? '#fef08a' : '#94a3b8',
                    transition: 'all 0.05s ease'
                  }}
                >
                  {line}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}