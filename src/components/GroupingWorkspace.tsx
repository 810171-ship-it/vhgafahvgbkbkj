import { useMemo, useState } from 'react';
import { Download, Minus, Plus, Shuffle, Sparkles, Users } from 'lucide-react';
import { GroupResult, GroupingMode, Student } from '../types';
import { exportGroupsToCsv, generateGroups } from '../utils/rosterUtils';

interface GroupingWorkspaceProps {
  students: Student[];
  groups: GroupResult[];
  onGroupsChange: (groups: GroupResult[]) => void;
  onLoadDemo: () => void;
}

export function GroupingWorkspace({
  students,
  groups,
  onGroupsChange,
  onLoadDemo,
}: GroupingWorkspaceProps) {
  const [mode, setMode] = useState<GroupingMode>('byGroupCount');
  const [value, setValue] = useState<number>(4);
  const [presentOnly, setPresentOnly] = useState<boolean>(true);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const eligibleStudents = useMemo(
    () => (presentOnly ? students.filter((s) => s.present) : students),
    [students, presentOnly]
  );

  const maxLimit = Math.max(1, eligibleStudents.length || 20);
  const clampedValue = Math.min(Math.max(1, value), maxLimit);

  const handleRunGrouping = () => {
    if (eligibleStudents.length === 0) return;
    const result = generateGroups(eligibleStudents, mode, clampedValue);
    onGroupsChange(result);
    setExportSuccess(false);
  };

  const handleDownloadCsv = () => {
    if (groups.length === 0) return;
    exportGroupsToCsv(groups);
    setExportSuccess(true);
    window.setTimeout(() => setExportSuccess(false), 3000);
  };

  const totalAssigned = useMemo(
    () => groups.reduce((acc, g) => acc + g.members.length, 0),
    [groups]
  );

  const sizeRangeText = useMemo(() => {
    if (groups.length === 0) return '';
    const sizes = groups.map((g) => g.members.length);
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    return min === max ? `每組 ${min} 人` : `每組 ${min}–${max} 人`;
  }, [groups]);

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Grouping mode segmented toggle */}
            <div
              className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
              role="group"
              aria-label="分組依據"
            >
              <button
                type="button"
                onClick={() => setMode('byGroupCount')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === 'byGroupCount'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                依組數分組
              </button>
              <button
                type="button"
                onClick={() => setMode('byGroupSize')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === 'byGroupSize'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                依每組人數
              </button>
            </div>

            {/* Numeric stepper */}
            <div className="inline-flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden">
              <button
                type="button"
                aria-label="減少數量"
                onClick={() => setValue((v) => Math.max(1, v - 1))}
                className="px-2.5 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={1}
                max={maxLimit}
                aria-label={mode === 'byGroupCount' ? '組數' : '每組人數'}
                value={clampedValue}
                onChange={(e) => {
                  const num = parseInt(e.target.value, 10);
                  if (!Number.isNaN(num)) {
                    setValue(Math.min(Math.max(1, num), maxLimit));
                  }
                }}
                className="w-12 text-center text-sm font-semibold font-mono-nums text-slate-900 focus:outline-none"
              />
              <span className="pr-2.5 text-xs text-slate-500 select-none">
                {mode === 'byGroupCount' ? '組' : '人/組'}
              </span>
              <button
                type="button"
                aria-label="增加數量"
                onClick={() => setValue((v) => Math.min(maxLimit, v + 1))}
                className="px-2.5 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l border-slate-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={presentOnly}
              onChange={(e) => setPresentOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
            />
            <span>僅納入「出席」學生</span>
          </label>
        </div>

        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-mono-nums">
            可參與分組人數：<span className="font-semibold text-slate-900">{eligibleStudents.length}</span> 人
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={eligibleStudents.length === 0}
              onClick={handleRunGrouping}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Shuffle className="w-4 h-4" />
              <span>{groups.length > 0 ? '重新隨機分組' : '開始自動分組'}</span>
            </button>

            <button
              type="button"
              disabled={groups.length === 0}
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>{exportSuccess ? '已下載 CSV' : '下載分組 CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Area */}
      {students.length === 0 ? (
        <div className="py-16 px-6 text-center border border-slate-200 rounded-xl bg-white">
          <Users className="w-9 h-9 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">請先匯入或載入班級名單</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5 max-w-md mx-auto">
            左側可貼上學生姓名或上傳 CSV 檔案；若想先了解操作方式，可一鍵載入模擬名單。
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
      ) : groups.length === 0 ? (
        <div className="py-16 px-6 text-center border border-slate-200 rounded-xl bg-white">
          <Shuffle className="w-9 h-9 text-blue-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">準備就緒，可開始自動分組</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            目前共有 {eligibleStudents.length} 位學生可參與分組，分組後可直接匯出為 CSV 檔案。
          </p>
          <button
            type="button"
            disabled={eligibleStudents.length === 0}
            onClick={handleRunGrouping}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            立即自動分組
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-mono-nums">
              <span className="text-sm font-semibold text-slate-900">分組結果</span>
              <span aria-hidden="true">·</span>
              <span>共 {groups.length} 組</span>
              <span aria-hidden="true">·</span>
              <span>{sizeRangeText}</span>
              <span aria-hidden="true">·</span>
              <span>合計 {totalAssigned} 人</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              匯出分組名單 (.csv)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div
                key={group.groupIndex}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">{group.groupName}</h4>
                  <span className="text-xs font-mono-nums text-slate-500">
                    {group.members.length} 人
                  </span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {group.members.map((member) => (
                    <li
                      key={member.id}
                      className="px-4 py-2.5 flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 text-xs font-mono-nums text-slate-400 text-right shrink-0">
                          {member.seatNumber}
                        </span>
                        <span className="font-medium text-slate-800 truncate">
                          {member.name}
                        </span>
                      </div>
                      {!member.present && (
                        <span className="text-xs text-slate-400 shrink-0">缺席</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
