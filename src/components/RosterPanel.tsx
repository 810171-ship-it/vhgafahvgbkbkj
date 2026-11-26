import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  FileUp,
  Plus,
  Sparkles,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { Student } from '../types';
import {
  countExtraDuplicates,
  getNameOccurrenceCounts,
  parseRosterText,
  readFileAsTextSmart,
} from '../utils/rosterUtils';

interface RosterPanelProps {
  students: Student[];
  isDemoActive: boolean;
  dedupFeedback: string | null;
  onReplaceStudents: (next: Student[], isDemo?: boolean) => void;
  onAppendStudents: (added: Student[]) => void;
  onToggleAttendance: (id: string) => void;
  onRemoveStudent: (id: string) => void;
  onDeduplicate: () => void;
  onClearAll: () => void;
  onLoadDemo: () => void;
}

type InputTab = 'paste' | 'csv';

export function RosterPanel({
  students,
  isDemoActive,
  dedupFeedback,
  onReplaceStudents,
  onAppendStudents,
  onToggleAttendance,
  onRemoveStudent,
  onDeduplicate,
  onClearAll,
  onLoadDemo,
}: RosterPanelProps) {
  const [inputTab, setInputTab] = useState<InputTab>('paste');
  const [pasteText, setPasteText] = useState('');
  const [quickName, setQuickName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const nameCounts = useMemo(() => getNameOccurrenceCounts(students), [students]);
  const extraDuplicateCount = useMemo(() => countExtraDuplicates(students), [students]);
  const presentCount = useMemo(
    () => students.filter((s) => s.present).length,
    [students]
  );

  const handlePasteSubmit = (mode: 'replace' | 'append') => {
    setImportError(null);
    setImportSuccess(null);
    const startingSeat = mode === 'append' ? students.length + 1 : 1;
    const parsed = parseRosterText(pasteText, startingSeat);
    if (parsed.length === 0) {
      setImportError('無法解析到有效的學生姓名，請確認每行至少有一個姓名。');
      return;
    }
    if (mode === 'replace') {
      onReplaceStudents(parsed, false);
    } else {
      onAppendStudents(parsed);
    }
    setPasteText('');
    setImportSuccess(`已成功${mode === 'replace' ? '匯入' : '加入'} ${parsed.length} 位學生`);
  };

  const processCsvFile = async (file: File) => {
    setImportError(null);
    setImportSuccess(null);
    try {
      const content = await readFileAsTextSmart(file);
      const parsed = parseRosterText(content, 1);
      if (parsed.length === 0) {
        setImportError(`檔案「${file.name}」未包含可讀取的學生姓名資料。`);
        return;
      }
      onReplaceStudents(parsed, false);
      setImportSuccess(`已從「${file.name}」匯入 ${parsed.length} 位學生`);
    } catch {
      setImportError('讀取檔案時發生錯誤，請確認檔案格式為 CSV 或純文字檔。');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processCsvFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processCsvFile(file);
    }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickName.trim();
    if (!trimmed) return;
    const nextSeat = String(students.length + 1);
    const newEntries = parseRosterText(`${nextSeat},${trimmed}`, students.length + 1);
    if (newEntries.length > 0) {
      onAppendStudents(newEntries);
      setQuickName('');
    }
  };

  return (
    <section
      id="roster-section"
      className="bg-white border border-slate-200 rounded-xl flex flex-col"
    >
      {/* Top Header & Input Mode Switcher */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-slate-900">班級名單匯入</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLoadDemo}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              模擬名單
            </button>
            {students.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                清空名單
              </button>
            )}
          </div>
        </div>

        {/* Segmented input mode tabs */}
        <div
          className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-4"
          role="tablist"
          aria-label="名單匯入方式"
        >
          <button
            type="button"
            role="tab"
            aria-selected={inputTab === 'paste'}
            onClick={() => {
              setInputTab('paste');
              setImportError(null);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              inputTab === 'paste'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            貼上文字名單
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputTab === 'csv'}
            onClick={() => {
              setInputTab('csv');
              setImportError(null);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              inputTab === 'csv'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            匯入 CSV 檔案
          </button>
        </div>

        {inputTab === 'paste' ? (
          <div>
            <label htmlFor="paste-roster-textarea" className="sr-only">
              貼上學生名單
            </label>
            <textarea
              id="paste-roster-textarea"
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'每行輸入一位學生，或直接從試算表複製貼上\n支援格式：「王小明」、「1,王小明」或「座號,姓名,出席狀態」'}
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-y placeholder:text-slate-400"
            />
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500">
                支援換行、逗號、Tab 分隔與座號自動辨識
              </span>
              <div className="flex items-center gap-2">
                {students.length > 0 && (
                  <button
                    type="button"
                    disabled={!pasteText.trim()}
                    onClick={() => handlePasteSubmit('append')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    加入現有名單
                  </button>
                )}
                <button
                  type="button"
                  disabled={!pasteText.trim()}
                  onClick={() => handlePasteSubmit('replace')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  {students.length > 0 ? '取代並匯入' : '匯入名單'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`border border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-blue-600 bg-blue-50/70'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileUp className="w-7 h-7 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-800">
              點擊選擇檔案，或將 CSV 拖曳至此處
            </p>
            <p className="text-xs text-slate-500 mt-1">
              支援 UTF-8 與 Big5 編碼（例如：座號,姓名,出席狀態）
            </p>
          </div>
        )}

        {importError && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 px-3 py-2 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{importError}</span>
          </div>
        )}

        {importSuccess && !importError && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{importSuccess}</span>
          </div>
        )}
      </div>

      {/* Duplicate Detection Banner */}
      {extraDuplicateCount > 0 && (
        <div
          role="status"
          className="mx-5 mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-amber-950">
              <p className="font-semibold">
                偵測到 {extraDuplicateCount} 筆重複學生姓名
              </p>
              <p className="text-amber-800">
                已在下方預覽名單標記重複項目，建議移除後再分組或抽籤。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDeduplicate}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            一鍵移除重複姓名 ({extraDuplicateCount})
          </button>
        </div>
      )}

      {dedupFeedback && extraDuplicateCount === 0 && (
        <div className="mx-5 mt-4 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-medium text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{dedupFeedback}</span>
        </div>
      )}

      {/* Roster Preview Header & Metadata */}
      <div className="px-5 pt-4 pb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-semibold text-slate-900">預覽名單</h3>
          {isDemoActive && (
            <span className="text-xs text-blue-700 font-medium">· 目前為模擬範例</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono-nums">
          <span>共 {students.length} 人</span>
          <span aria-hidden="true">·</span>
          <span>出席 {presentCount} 人</span>
          {extraDuplicateCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-amber-700">
                重複 {extraDuplicateCount} 筆
              </span>
            </>
          )}
        </div>
      </div>

      {/* Roster List */}
      <div className="px-5 pb-5 flex-1 flex flex-col">
        {students.length === 0 ? (
          <div className="py-12 px-4 text-center border border-slate-200 rounded-lg bg-slate-50/70">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2.5" />
            <p className="text-sm font-medium text-slate-700">尚未載入任何學生名單</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              請在上方貼上名單、上傳 CSV，或載入模擬名單快速體驗功能。
            </p>
            <button
              type="button"
              onClick={onLoadDemo}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              載入模擬名單試試看
            </button>
          </div>
        ) : (
          <>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                {students.map((student) => {
                  const occCount = nameCounts.get(student.name.trim()) ?? 1;
                  const isDuplicate = occCount > 1;

                  return (
                    <div
                      key={student.id}
                      className={`px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                        isDuplicate
                          ? 'bg-amber-50/80 hover:bg-amber-50'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 text-xs font-mono-nums text-slate-500 shrink-0 text-right">
                          {student.seatNumber}
                        </span>
                        <span
                          className={`text-sm font-medium truncate ${
                            student.present
                              ? 'text-slate-900'
                              : 'text-slate-400 line-through'
                          }`}
                        >
                          {student.name}
                        </span>
                        {isDuplicate && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 shrink-0">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>重複姓名 ({occCount} 筆)</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleAttendance(student.id)}
                          title={student.present ? '點擊標記為缺席' : '點擊標記為出席'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            student.present
                              ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          {student.present ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>出席</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>缺席</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveStudent(student.id)}
                          aria-label={`移除 ${student.name}`}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick single-student add */}
            <form onSubmit={handleQuickAdd} className="mt-3 flex items-center gap-2">
              <label htmlFor="quick-add-student" className="sr-only">
                快速新增學生姓名
              </label>
              <input
                id="quick-add-student"
                type="text"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="快速新增單筆學生姓名..."
                className="flex-1 min-w-0 px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={!quickName.trim()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增</span>
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
