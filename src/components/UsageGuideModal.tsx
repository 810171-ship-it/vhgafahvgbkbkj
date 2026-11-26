import { useEffect } from 'react';
import { X } from 'lucide-react';

interface UsageGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDemo: () => void;
}

export function UsageGuideModal({ isOpen, onClose, onLoadDemo }: UsageGuideModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h2 id="guide-modal-title" className="text-lg font-semibold text-slate-900">
            教師快速操作說明
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉說明"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ol className="mt-5 space-y-4 text-sm text-slate-700 leading-relaxed">
          <li>
            <span className="font-semibold text-slate-900">01. 建立或匯入班級名單：</span>
            可直接點選右上角「載入模擬名單」體驗完整流程，或貼上學生姓名、上傳 CSV 檔案（支援「座號,姓名,出席狀態」格式）。
          </li>
          <li>
            <span className="font-semibold text-slate-900">02. 檢查重複姓名與出席狀態：</span>
            若名單中出現重複的學生姓名，系統會在預覽區以橘黃色警告標記，點選「一鍵移除重複姓名」即可自動保留第一筆並清除多餘項目。
          </li>
          <li>
            <span className="font-semibold text-slate-900">03. 課堂自動分組與隨機抽籤：</span>
            可依「組數」或「每組人數」進行智慧均分，並點選「下載分組 CSV」儲存為 Excel 可直接開啟的檔案；或切換至「隨機抽籤」進行轉盤點名與抽獎。
          </li>
        </ol>

        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              onLoadDemo();
              onClose();
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            載入模擬名單體驗
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
