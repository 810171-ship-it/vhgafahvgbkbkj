import { useEffect, useMemo, useRef, useState } from 'react';
import { Award, RotateCcw, Sparkles, Users } from 'lucide-react';
import { DrawRecord, Student } from '../types';
import { shuffleArray } from '../utils/rosterUtils';

interface LuckyDrawWorkspaceProps {
  students: Student[];
  onLoadDemo: () => void;
}

const WHEEL_COLORS = [
  '#2563EB', // blue-600
  '#0F766E', // teal-700
  '#D97706', // amber-600
  '#4F46E5', // indigo-600
  '#0284C7', // sky-600
  '#059669', // emerald-600
  '#7C3AED', // violet-600
  '#E11D48', // rose-600
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M',
    cx,
    cy,
    'L',
    start.x,
    start.y,
    'A',
    r,
    r,
    0,
    largeArc,
    0,
    end.x,
    end.y,
    'Z',
  ].join(' ');
}

export function LuckyDrawWorkspace({ students, onLoadDemo }: LuckyDrawWorkspaceProps) {
  const [drawCount, setDrawCount] = useState<number>(1);
  const [withoutReplacement, setWithoutReplacement] = useState<boolean>(true);
  const [presentOnly, setPresentOnly] = useState<boolean>(true);
  const [drawnIds, setDrawnIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<DrawRecord[]>([]);
  const [latestWinners, setLatestWinners] = useState<Student[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Reset drawn IDs if student roster is replaced completely
  useEffect(() => {
    const validIds = new Set(students.map((s) => s.id));
    setDrawnIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [students]);

  const baseEligible = useMemo(
    () => (presentOnly ? students.filter((s) => s.present) : students),
    [students, presentOnly]
  );

  const remainingPool = useMemo(() => {
    if (!withoutReplacement) return baseEligible;
    return baseEligible.filter((s) => !drawnIds.has(s.id));
  }, [baseEligible, drawnIds, withoutReplacement]);

  // Slices displayed on the wheel (cap at 24 slices for clean legibility)
  const wheelSlices = useMemo(() => {
    if (remainingPool.length === 0) return [];
    return remainingPool.slice(0, 24);
  }, [remainingPool]);

  const handleDraw = () => {
    if (isSpinning || remainingPool.length === 0) return;

    const countToDraw = Math.min(drawCount, remainingPool.length);
    const picked = shuffleArray(remainingPool).slice(0, countToDraw);
    const primaryWinner = picked[0];

    // Calculate target rotation so primaryWinner lands under the top pointer (0 deg)
    const sliceCount = Math.max(1, wheelSlices.length);
    const sliceAngle = 360 / sliceCount;
    const foundIdx = wheelSlices.findIndex((s) => s.id === primaryWinner.id);
    const targetIdx = foundIdx >= 0 ? foundIdx : Math.floor(Math.random() * sliceCount);
    const sliceCenterAngle = targetIdx * sliceAngle + sliceAngle / 2;
    const desiredNormalizedMod = (360 - sliceCenterAngle) % 360;

    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = (desiredNormalizedMod - currentMod + 360) % 360;
    const extraTurns = 5 * 360;
    const nextRotation = rotation + extraTurns + delta;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setIsSpinning(true);
    setRotation(nextRotation);

    const finalizeDraw = () => {
      setLatestWinners(picked);
      const now = new Date();
      const timestamp = now.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      setHistory((prev) => [
        {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          round: prev.length + 1,
          winners: picked,
          timestamp,
        },
        ...prev,
      ]);

      if (withoutReplacement) {
        setDrawnIds((prev) => {
          const next = new Set(prev);
          picked.forEach((w) => next.add(w.id));
          return next;
        });
      }
      setIsSpinning(false);
    };

    if (prefersReducedMotion) {
      finalizeDraw();
    } else {
      timerRef.current = window.setTimeout(finalizeDraw, 2900);
    }
  };

  const handleResetHistory = () => {
    if (isSpinning) return;
    setDrawnIds(new Set());
    setHistory([]);
    setLatestWinners([]);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-slate-600">每次抽出</span>
            <div
              className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
              role="group"
              aria-label="每次抽取人數"
            >
              {[1, 2, 3, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  disabled={isSpinning}
                  onClick={() => setDrawCount(count)}
                  className={`px-3 py-1.5 text-xs font-medium font-mono-nums rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    drawCount === count
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {count} 人
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={withoutReplacement}
                disabled={isSpinning}
                onChange={(e) => setWithoutReplacement(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <span>抽出不放回（不重複中選）</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={presentOnly}
                disabled={isSpinning}
                onChange={(e) => setPresentOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <span>僅抽「出席」學生</span>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-mono-nums">
            待抽籤池：<span className="font-semibold text-slate-900">{remainingPool.length}</span> / {baseEligible.length} 人
          </div>

          <div className="flex items-center gap-2.5">
            {(history.length > 0 || drawnIds.size > 0) && (
              <button
                type="button"
                disabled={isSpinning}
                onClick={handleResetHistory}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置抽籤池</span>
              </button>
            )}
            <button
              type="button"
              disabled={isSpinning || remainingPool.length === 0}
              onClick={handleDraw}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>{isSpinning ? '抽籤中...' : '開始抽籤'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stage Area */}
      {students.length === 0 ? (
        <div className="py-16 px-6 text-center border border-slate-200 rounded-xl bg-white">
          <Users className="w-9 h-9 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">請先匯入或載入班級名單</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5 max-w-md mx-auto">
            載入學生名單後，即可轉動幸運轉盤進行課堂點名或獎勵抽籤。
          </p>
          <button
            type="button"
            onClick={onLoadDemo}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            載入模擬名單
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Wheel Stage */}
          <div className="md:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Top Pointer */}
              <div
                aria-hidden="true"
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-slate-900"
              />

              {wheelSlices.length === 0 ? (
                <div className="w-full h-full rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-sm font-semibold text-slate-800">所有學生皆已抽過</p>
                  <p className="text-xs text-slate-500 mt-1 mb-3">請重置抽籤池繼續使用</p>
                  <button
                    type="button"
                    onClick={handleResetHistory}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                  >
                    重置抽籤池
                  </button>
                </div>
              ) : wheelSlices.length === 1 ? (
                <div className="w-full h-full rounded-full bg-blue-600 text-white flex flex-col items-center justify-center p-4 text-center shadow-inner border-4 border-white ring-1 ring-slate-200">
                  <span className="text-xs font-mono-nums opacity-80">
                    {wheelSlices[0].seatNumber} 號
                  </span>
                  <span className="text-2xl font-bold mt-1">{wheelSlices[0].name}</span>
                </div>
              ) : (
                <svg
                  viewBox="0 0 300 300"
                  className="w-full h-full drop-shadow-sm"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning
                      ? 'transform 2.85s cubic-bezier(0.12, 0.85, 0.22, 1)'
                      : 'none',
                  }}
                >
                  {wheelSlices.map((student, idx) => {
                    const sliceAngle = 360 / wheelSlices.length;
                    const startAngle = idx * sliceAngle;
                    const endAngle = startAngle + sliceAngle;
                    const midAngle = startAngle + sliceAngle / 2;
                    const color = WHEEL_COLORS[idx % WHEEL_COLORS.length];

                    return (
                      <g key={student.id}>
                        <path
                          d={describeSlice(150, 150, 146, startAngle, endAngle)}
                          fill={color}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x="150"
                          y="150"
                          fill="#ffffff"
                          fontSize={wheelSlices.length > 16 ? '9.5' : '11.5'}
                          fontWeight="600"
                          textAnchor="end"
                          dominantBaseline="middle"
                          transform={`rotate(${midAngle - 90} 150 150) translate(132 0)`}
                        >
                          {student.name.length > 5
                            ? `${student.name.slice(0, 4)}…`
                            : student.name}
                        </text>
                      </g>
                    );
                  })}
                  <circle cx="150" cy="150" r="20" fill="#ffffff" stroke="#E2E8F0" strokeWidth="2" />
                </svg>
              )}
            </div>

            {remainingPool.length > 24 && (
              <p className="mt-3 text-xs text-slate-500 text-center">
                轉盤顯示前 24 位代表，實際抽籤仍從全部 {remainingPool.length} 位學生公平隨機選出。
              </p>
            )}
          </div>

          {/* Winner Spotlight & History */}
          <div className="md:col-span-6 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-slate-500 mb-3">本次抽籤結果</h3>
              {isSpinning ? (
                <div className="py-8 text-center">
                  <p className="text-base font-semibold text-blue-700">正在隨機抽選中...</p>
                </div>
              ) : latestWinners.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  點擊上方「開始抽籤」按鈕抽出幸運學生
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {latestWinners.map((winner, idx) => (
                    <div
                      key={winner.id}
                      className="px-4 py-3 bg-blue-50/80 border border-blue-200 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono-nums font-semibold text-blue-700">
                          #{idx + 1}
                        </span>
                        <span className="text-lg font-bold text-slate-900">{winner.name}</span>
                      </div>
                      <span className="text-xs font-mono-nums text-slate-600">
                        座號 {winner.seatNumber}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500">抽籤紀錄</h3>
                <span className="text-xs font-mono-nums text-slate-400">
                  共 {history.length} 次
                </span>
              </div>
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">尚無抽籤紀錄</p>
              ) : (
                <ul className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {history.map((item) => (
                    <li
                      key={item.id}
                      className="py-2.5 flex items-baseline justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-mono-nums text-slate-400 mr-2">
                          第 {item.round} 輪
                        </span>
                        <span className="font-medium text-slate-800">
                          {item.winners
                            .map((w) => `${w.name} (${w.seatNumber}號)`)
                            .join('、')}
                        </span>
                      </div>
                      <span className="font-mono-nums text-slate-400 shrink-0">
                        {item.timestamp}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
