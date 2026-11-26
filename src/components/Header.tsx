import { WorkspaceTab } from '../types';

interface HeaderProps {
  onLoadDemo: () => void;
  onNavigateWorkspace: (tab: WorkspaceTab) => void;
  onOpenGuide: () => void;
}

export function Header({
  onLoadDemo,
  onNavigateWorkspace,
  onOpenGuide,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          課堂名單分組與抽籤助手
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#roster-section"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            名單預覽
          </a>
          <button
            type="button"
            onClick={() => onNavigateWorkspace('grouping')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            自動分組
          </button>
          <button
            type="button"
            onClick={() => onNavigateWorkspace('draw')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            隨機抽籤
          </button>
          <button
            type="button"
            onClick={onOpenGuide}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            使用說明
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onLoadDemo}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            載入模擬名單
          </button>
        </div>
      </div>
    </header>
  );
}
