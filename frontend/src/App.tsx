import Auth from './components/Auth';
import { useState, useEffect, useRef } from 'react';
import API from './services/api';
import MazeVisualizer from './components/MazeVisualizer';
import { BarChart2, Play, Pause, Square, RefreshCw, Layers, Grid, Sliders, Gauge } from 'lucide-react';
import './App.css';

interface HistoryItem {
  id: string;
  type: 'sorting' | 'maze';
  algoName: string;
  algoKey: string;
  details: string;
  executionTime: string;
  timestamp: string;
  arraySnapshot?: number[]; 
  gridSnapshot?: number[][];
  startNode?: [number, number];
  endNode?: [number, number];
  gridSize?: number;
}

interface SortingStep {
  array: number[];
  comparing?: number[];
  swapping?: number[];
}

// === СЛОВНИК ПСЕВДОКОДІВ ДЛЯ ВСІХ АЛГОРИТМІВ ===
const SORTING_PSEUDOCODES: Record<string, string[]> = {
  'selection-sort': [
    "function SelectionSort(arr) {",
    "  for i = 0 to arr.length - 1",
    "    let minIdx = i",
    "    for j = i + 1 to arr.length",
    "      if arr[j] < arr[minIdx]",
    "        minIdx = j",
    "    swap(arr[i], arr[minIdx])",
    "  return arr",
    "}"
  ],
  'insertion-sort': [
    "function InsertionSort(arr) {",
    "  for i = 1 to arr.length - 1",
    "    let key = arr[i]",
    "    let j = i - 1",
    "    while j >= 0 and arr[j] > key",
    "      arr[j + 1] = arr[j]",
    "      j = j - 1",
    "    arr[j + 1] = key",
    "  return arr",
    "}"
  ],
  'bubble-sort': [
    "function BubbleSort(arr) {",
    "  for i = 0 to arr.length - 1",
    "    for j = 0 to arr.length - i - 1",
    "      if arr[j] > arr[j+1]",
    "        swap(arr[j], arr[j+1])",
    "  return arr",
    "}"
  ],
  'quick-sort': [
    "function QuickSort(arr, low, high) {",
    "  if low < high",
    "    pivotIdx = Partition(arr, low, high)",
    "    QuickSort(arr, low, pivotIdx - 1)",
    "    QuickSort(arr, pivotIdx + 1, high)",
    "}",
    "// всередині Partition:",
    "  if arr[j] < pivot",
    "    swap(arr[i], arr[j])",
    "  swap(arr[i + 1], arr[high])"
  ],
  'merge-sort': [
    "function MergeSort(arr) {",
    "  if arr.length <= 1 return arr",
    "  mid = arr.length / 2",
    "  left = MergeSort(arr[0..mid])",
    "  right = MergeSort(arr[mid..end])",
    "  return Merge(left, right)",
    "}",
    "// всередині Merge:",
    "  if left[0] <= right[0]",
    "    result.push(left.shift())",
    "  // інакше додаємо з right"
  ],
  'heap-sort': [
    "function HeapSort(arr) {",
    "  for i = n / 2 - 1 down to 0",
    "    Heapify(arr, n, i)",
    "  for i = n - 1 down to 0",
    "    swap(arr[0], arr[i])",
    "    Heapify(arr, i, 0)",
    "}",
    "// всередині Heapify:",
    "  if child > root",
    "    swap(root, child)"
  ],
  'shell-sort': [
    "function ShellSort(arr) {",
    "  for gap = n / 2 down to 1",
    "    for i = gap to n - 1",
    "      temp = arr[i]",
    "      while j >= gap and arr[j - gap] > temp",
    "        arr[j] = arr[j - gap]",
    "      arr[j] = temp",
    "  return arr",
    "}"
  ],
  'bogo-sort': [
    "function BogoSort(arr) {",
    "  while not isSorted(arr)",
    "    shuffle(arr)",
    "  return arr",
    "}",
    "// Сподівайся на удачу 🍀",
    "// Може тривати вічність..."
  ],
  'default': [
    "function Sort(arr) {",
    "  // Виконуємо магію...",
    "  if (comparing)",
    "    // думаємо...",
    "  swap(a, b)",
    "  return arr",
    "}"
  ]
};

// Хелпер для визначення активного рядка псевдокоду
const getActiveLineIndex = (step: SortingStep, pseudo: string[]) => {
  if (step.swapping && step.swapping.length > 0) {
    const idx = pseudo.findIndex(l => l.includes('swap') || l.includes('arr[j] =') || l.includes('push(') || l.includes('shuffle'));
    return idx !== -1 ? idx : pseudo.length - 2;
  }
  if (step.comparing && step.comparing.length > 0) {
    const idx = pseudo.findIndex(l => l.includes('if') || l.includes('while'));
    return idx !== -1 ? idx : Math.floor(pseudo.length / 2);
  }
  return 1;
};
// ================================================

function App() {
  const [user, setUser] = useState<string | null>(localStorage.getItem('username'));

  const handleLogOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
  };

  const [activeTab, setActiveTab] = useState<'sorting' | 'maze'>('sorting');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Стан для відновлення лабіринту
  const [restoredMazeAlgo, setRestoredMazeAlgo] = useState<{ 
    algoKey: string; 
    timestamp: number;
    grid?: number[][];           
    start?: [number, number];    
    end?: [number, number];      
    gridSize?: number;
  } | null>(null);

  const [arraySize, setArraySize] = useState<number>(15);
  const [array, setArray] = useState<number[]>([40, 15, 60, 30, 80, 10, 50, 25, 70, 5, 90, 45]);
  const [selectedAlgo, setSelectedAlgo] = useState<string>('selection-sort');
  
  const [isSorting, setIsSorting] = useState<boolean>(false);
  const [comparingIdxs, setComparingIdxs] = useState<number[]>([]);
  const [swappingIdxs, setSwappingIdxs] = useState<number[]>([]);
  const [sortingTime, setSortingTime] = useState<number | null>(null);

  const [steps, setSteps] = useState<SortingStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1);
  
  const [comparisonsCount, setComparisonsCount] = useState<number>(0);
  const [swapsCount, setSwapsCount] = useState<number>(0);

  // СТАН ДЛЯ ПСЕВДОКОДУ
  const [activeLine, setActiveLine] = useState<number | null>(null);

  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateNewArray = (size: number = arraySize) => {
    resetAnimation();
    const newArr = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
    setArray(newArr);
    setSortingTime(null);
  };

  const handleSizeChange = (newSize: number) => {
    setArraySize(newSize);
    generateNewArray(newSize);
  };

  const resetAnimation = () => {
    if (animationRef.current) clearTimeout(animationRef.current);
    setIsSorting(false);
    setIsPaused(false);
    setCurrentStepIdx(0);
    setSteps([]);
    setComparingIdxs([]);
    setSwappingIdxs([]);
    setComparisonsCount(0);
    setSwapsCount(0);
    setActiveLine(null); // Скидаємо підсвітку коду
  };

  const handleRecordMazeHistory = (
    algoName: string, 
    algoKey: string, 
    gridSizeInfo: string, 
    executionTimeMs: number,
    gridSnapshot?: number[][],
    startNode?: [number, number],
    endNode?: [number, number],
    gridSize?: number
  ) => {
    const newHistoryItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'maze',
      algoName,
      algoKey,
      details: `Розмір сітки: ${gridSizeInfo}`,
      executionTime: `${executionTimeMs.toFixed(4)} мс`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      gridSnapshot: gridSnapshot ? JSON.parse(JSON.stringify(gridSnapshot)) : undefined,
      startNode: startNode ? [...startNode] : undefined,
      endNode: endNode ? [...endNode] : undefined,
      gridSize
    };
    setHistory(prev => [newHistoryItem, ...prev]);
  };

  const handleHistoryItemClick = (item: HistoryItem) => {
    setActiveTab(item.type); 
    resetAnimation();
    
    if (item.type === 'sorting') {
      setSelectedAlgo(item.algoKey);
      if (item.arraySnapshot) {
        setArray([...item.arraySnapshot]);
        setArraySize(item.arraySnapshot.length);
      }
      setSortingTime(null);
    } else if (item.type === 'maze') {
      setRestoredMazeAlgo({ 
        algoKey: item.algoKey, 
        timestamp: Date.now(), 
        grid: item.gridSnapshot ? JSON.parse(JSON.stringify(item.gridSnapshot)) : undefined,
        start: item.startNode ? [...item.startNode] : undefined,
        end: item.endNode ? [...item.endNode] : undefined,
        gridSize: item.gridSize
      });
    }
  };

  const startSorting = async () => {
    if (isSorting) return;
    resetAnimation();
    setIsSorting(true);

    try {
      const response = await API.post(`/algos/${selectedAlgo}`, { array });
      
      if (response.data.success) {
        const { steps: fetchedSteps, pureExecutionTime } = response.data;
        setSortingTime(pureExecutionTime);
        setSteps(fetchedSteps);
        setCurrentStepIdx(0);

        const algoNamesMap: Record<string, string> = {
          'selection-sort': 'Selection Sort',
          'insertion-sort': 'Insertion Sort',
          'bubble-sort': 'Bubble Sort',
          'quick-sort': 'Quick Sort',
          'merge-sort': 'Merge Sort',
          'heap-sort': 'Heap Sort',
          'shell-sort': 'Shell Sort',
          'bogo-sort': 'Bogo Sort 🤡',
        };

        const newHistoryItem: HistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
          type: 'sorting',
          algoName: algoNamesMap[selectedAlgo] || selectedAlgo,
          algoKey: selectedAlgo,
          details: `Елементів: ${array.length}`,
          executionTime: pureExecutionTime ? `${pureExecutionTime.toFixed(4)} мс` : '—',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          arraySnapshot: [...array] 
        };
        setHistory(prev => [newHistoryItem, ...prev]);

      } else {
        setIsSorting(false);
      }
    } catch (error) {
      console.error('Помилка при сортуванні:', error);
      setIsSorting(false);
    }
  };

  useEffect(() => {
    if (!isSorting || isPaused || steps.length === 0) return;

    if (currentStepIdx >= steps.length) {
      setIsSorting(false);
      setComparingIdxs([]);
      setSwappingIdxs([]);
      setActiveLine(null);
      return;
    }

    const delay = 300 / animationSpeed;

    animationRef.current = setTimeout(() => {
      const currentStep = steps[currentStepIdx];
      
      setArray(currentStep.array);
      setComparingIdxs(currentStep.comparing || []);
      setSwappingIdxs(currentStep.swapping || []);

      // Підсвічуємо рядок у псевдокоді
      const pseudo = SORTING_PSEUDOCODES[selectedAlgo] || SORTING_PSEUDOCODES['default'];
      setActiveLine(getActiveLineIndex(currentStep, pseudo));

      if (currentStep.comparing && currentStep.comparing.length > 0) {
        setComparisonsCount((prev) => prev + 1);
      }
      if (currentStep.swapping && currentStep.swapping.length > 0) {
        setSwapsCount((prev) => prev + 1);
      }

      setCurrentStepIdx((prev) => prev + 1);
    }, delay);

    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [isSorting, isPaused, currentStepIdx, steps, animationSpeed, selectedAlgo]);

  const handleStepSliderChange = (idx: number) => {
    if (steps.length === 0) return;
    setIsPaused(true);
    
    const targetIdx = Math.min(idx, steps.length - 1);
    setCurrentStepIdx(targetIdx);
    
    const step = steps[targetIdx];
    setArray(step.array);
    setComparingIdxs(step.comparing || []);
    setSwappingIdxs(step.swapping || []);

    // Оновлюємо підсвітку коду при перемотуванні повзунком
    const pseudo = SORTING_PSEUDOCODES[selectedAlgo] || SORTING_PSEUDOCODES['default'];
    setActiveLine(getActiveLineIndex(step, pseudo));

    let comps = 0;
    let swps = 0;
    for (let i = 0; i <= targetIdx; i++) {
      if (steps[i]?.comparing && (steps[i].comparing?.length ?? 0) > 0) comps++;
      if (steps[i]?.swapping && (steps[i].swapping?.length ?? 0) > 0) swps++;
    }
    setComparisonsCount(comps);
    setSwapsCount(swps);
  };

 return (
  <div style={{ 
    display: 'flex', gap: '2rem', padding: '2rem', width: '100%', boxSizing: 'border-box', margin: '0 auto', minHeight: '100vh'
  }}>
    
    {user && (
      <aside style={{ 
        width: '320px', flexShrink: 0, position: 'sticky', top: '2rem', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ background: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🕒</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Історія запусків
            </span>
          </div>
          
          <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.length === 0 ? (
              <div style={{ color: '#475569', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>
                Історія порожня.<br />Запустіть алгоритм...
              </div>
            ) : (
              history.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => handleHistoryItemClick(item)}
                  style={{ background: 'rgba(9, 13, 22, 0.5)', border: '1px solid #1e293b', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer', transition: 'all 0.2s ease', userSelect: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)'; e.currentTarget.style.borderColor = item.type === 'sorting' ? '#6366f1' : '#10b981'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(9, 13, 22, 0.5)'; e.currentTarget.style.borderColor = '#1e293b'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: item.type === 'sorting' ? '#6366f1' : '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {item.type === 'sorting' ? '📊' : '🕸️'} {item.algoName}
                    </strong> 
                    <span style={{ color: '#475569', fontSize: '11px' }}>{item.timestamp}</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>{item.details}</div>
                  <div style={{ color: '#10b981', fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', marginTop: '2px' }}>
                    ⚡ {item.executionTime}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    )}

    <div style={{ flex: 1, minWidth: 0 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', background: 'linear-gradient(to bottom, #0f172a, rgba(15, 23, 42, 0.4))', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '2.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)' }}>
            <BarChart2 size={26} color="#6366f1" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px', background: 'linear-gradient(135deg, #ffffff 40%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textTransform: 'uppercase' }}>
              Алгоритмічний Візуалізатор
            </h1>
            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '600' }}>
              Interactive Algo Suite v1.0
            </span>
          </div>
        </div>
        
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
              Привіт, <b style={{ color: '#fff', background: 'rgba(99, 102, 241, 0.15)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>{user}</b>!
            </span>
            <button 
              type="button" onClick={handleLogOut}
              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'} onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
            >
              Вийти
            </button>
          </div>
        )}
      </header>

      {!user ? (
        <Auth onAuthSuccess={(username) => setUser(username)} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', borderBottom: '2px solid #1e293b', paddingBottom: '10px' }}>
            <button 
              type="button" onClick={() => setActiveTab('sorting')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', background: activeTab === 'sorting' ? '#6366f1' : 'transparent', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
            >
              <BarChart2 size={16} /> Сортування масивів
            </button>
            <button 
              type="button" onClick={() => { resetAnimation(); setActiveTab('maze'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', background: activeTab === 'maze' ? '#6366f1' : 'transparent', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
            >
              <Grid size={16} /> Лабіринти та Графи
            </button>
          </div>

          {activeTab === 'sorting' ? (
            <div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => generateNewArray()} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.75rem 1.5rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  <RefreshCw size={16} /> Новий масив
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e293b', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                  <Sliders size={16} color="#94a3b8" />
                  <span style={{ color: '#fff', fontSize: '14px', minWidth: '95px' }}>Розмір: <b>{arraySize}</b></span>
                  <input type="range" min="5" max="40" value={arraySize} disabled={isSorting} onChange={(e) => handleSizeChange(Number(e.target.value))} style={{ cursor: isSorting ? 'not-allowed' : 'pointer', accentColor: '#6366f1' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                  <Layers size={16} color="#94a3b8" />
                  <select value={selectedAlgo} onChange={(e) => setSelectedAlgo(e.target.value)} disabled={isSorting} style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', fontSize: '15px', cursor: 'pointer' }}>
                    <option value="selection-sort" style={{ background: '#1e293b' }}>Selection Sort</option>
                    <option value="insertion-sort" style={{ background: '#1e293b' }}>Insertion Sort</option>
                    <option value="bubble-sort" style={{ background: '#1e293b' }}>Bubble Sort</option>
                    <option value="quick-sort" style={{ background: '#1e293b' }}>Quick Sort</option>
                    <option value="merge-sort" style={{ background: '#1e293b' }}>Merge Sort (Злиттям)</option>
                    <option value="heap-sort" style={{ background: '#1e293b' }}>Heap Sort (Пірамідальне)</option>
                    <option value="shell-sort" style={{ background: '#1e293b' }}>Shell Sort (Шелла)</option>
                    <option value="bogo-sort" style={{ background: '#1e293b' }}>🤡 Bogo Sort (Рандом)</option>
                  </select>
                </div>

                {!isSorting && (
                  <button type="button" onClick={startSorting} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.75rem 1.5rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <Play size={16} /> Запустити
                  </button>
                )}
              </div>

              {isSorting && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '1rem', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setIsPaused(!isPaused)} style={{ background: '#334155', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {isPaused ? <Play size={16} color="#10b981" /> : <Pause size={16} color="#eab308" />}
                      {isPaused ? 'Продовжити' : 'Пауза'}
                    </button>
                    <button type="button" onClick={resetAnimation} style={{ background: '#ef4444', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                      <Square size={14} /> Стоп
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Gauge size={16} color="#94a3b8" />
                    <span style={{ color: '#94a3b8', fontSize: '13px', minWidth: '90px' }}>Швидкість: <b>{animationSpeed}x</b></span>
                    <input type="range" min="0.5" max="5" step="0.5" value={animationSpeed} onChange={(e) => setAnimationSpeed(Number(e.target.value))} style={{ accentColor: '#6366f1', cursor: 'pointer', width: '100px' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '200px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      Крок: <b>{currentStepIdx}</b> / {steps.length}
                    </span>
                    <input type="range" min="0" max={steps.length > 0 ? steps.length - 1 : 0} value={currentStepIdx} onChange={(e) => handleStepSliderChange(Number(e.target.value))} style={{ flex: '1', accentColor: '#6366f1', cursor: 'pointer' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#cbd5e1', borderLeft: '2px solid #1e293b', paddingLeft: '15px' }}>
                    <div>Порівнянь: <strong style={{ color: '#eab308' }}>{comparisonsCount}</strong></div>
                    <div>Перестановок: <strong style={{ color: '#ef4444' }}>{swapsCount}</strong></div>
                  </div>
                </div>
              )}

              {sortingTime !== null && (
                <div style={{ background: '#1e293b', padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', marginBottom: '1.5rem', display: 'inline-block', fontSize: '14px', color: '#94a3b8' }}>
                  ⚡ Чистий час алгоритму (без мережі): <strong style={{ color: '#10b981' }}>{sortingTime.toFixed(4)} мс</strong>
                </div>
              )}

              {/* МАКЕТ З ГРАФІКОМ І ПСЕВДОКОДОМ */}
              <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                
                {/* ГРАФІК СТОВПЧИКІВ */}
                <div style={{ flex: '1 1 400px', display: 'flex', alignItems: 'end', justifyContent: 'center', gap: '6px', background: '#1e293b', padding: '3rem 2rem', borderRadius: '12px', height: '350px' }}>
                  {array.map((value, idx) => {
                    let barColor = '#6366f1';
                    if (swappingIdxs.includes(idx)) barColor = '#ef4444';
                    else if (comparingIdxs.includes(idx)) barColor = '#eab308';

                    return (
                      <div
                        key={idx}
                        style={{ height: `${value * 3}px`, flex: '1', maxWidth: '45px', minWidth: '10px', backgroundColor: barColor, borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'end', justifyContent: 'center', paddingBottom: '5px', fontSize: arraySize > 20 ? '0px' : '12px', fontWeight: 'bold', color: '#fff', transition: 'background-color 0.05s ease, height 0.05s ease' }}
                      >
                        {value}
                      </div>
                    );
                  })}
                </div>

                {/* БЛОК ПСЕВДОКОДУ СОРТУВАННЯ */}
                <div style={{ width: '340px', background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '350px' }}>
                  <div style={{ background: '#1e293b', padding: '12px 16px', borderBottom: '1px solid #1e293b', flexShrink: 0, borderRadius: '12px 12px 0 0' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📝 Псевдокод: {selectedAlgo.replace('-sort', '').toUpperCase()}
                    </span>
                  </div>
                  
                  <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.7', overflowY: 'auto', overflowX: 'auto', whiteSpace: 'pre', textAlign: 'left', flex: 1 }}>
                    {(SORTING_PSEUDOCODES[selectedAlgo] || SORTING_PSEUDOCODES['default']).map((line, index) => {
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
          ) : (
            <MazeVisualizer 
              onRecordHistory={handleRecordMazeHistory}
              restoredAlgo={restoredMazeAlgo}
            />
          )}
        </>
      )}
    </div>
  </div>
 );
}

export default App;