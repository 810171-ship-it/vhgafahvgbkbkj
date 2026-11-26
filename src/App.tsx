/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { Award, Shuffle } from 'lucide-react';
import { GroupResult, Student, WorkspaceTab } from './types';
import { createDemoRoster, deduplicateStudents } from './utils/rosterUtils';
import { Header } from './components/Header';
import { RosterPanel } from './components/RosterPanel';
import { GroupingWorkspace } from './components/GroupingWorkspace';
import { LuckyDrawWorkspace } from './components/LuckyDrawWorkspace';
import { UsageGuideModal } from './components/UsageGuideModal';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('grouping');
  const [groups, setGroups] = useState<GroupResult[]>([]);
  const [dedupFeedback, setDedupFeedback] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const handleLoadDemo = useCallback(() => {
    const demo = createDemoRoster();
    setStudents(demo);
    setIsDemoActive(true);
    setGroups([]);
    setDedupFeedback(null);
  }, []);

  const handleReplaceStudents = useCallback((next: Student[], isDemo = false) => {
    setStudents(next);
    setIsDemoActive(isDemo);
    setGroups([]);
    setDedupFeedback(null);
  }, []);

  const handleAppendStudents = useCallback((added: Student[]) => {
    setStudents((prev) => [...prev, ...added]);
    setGroups([]);
    setDedupFeedback(null);
  }, []);

  const handleToggleAttendance = useCallback((id: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, present: !s.present } : s))
    );
    setGroups([]);
  }, []);

  const handleRemoveStudent = useCallback((id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setGroups([]);
  }, []);

  const handleDeduplicate = useCallback(() => {
    setStudents((prev) => {
      const { deduplicated, removedCount } = deduplicateStudents(prev);
      if (removedCount > 0) {
        setDedupFeedback(`已自動保留第一筆紀錄並移除 ${removedCount} 筆重複姓名`);
      }
      return deduplicated;
    });
    setGroups([]);
  }, []);

  const handleClearAll = useCallback(() => {
    setStudents([]);
    setIsDemoActive(false);
    setGroups([]);
    setDedupFeedback(null);
  }, []);

  const handleNavigateWorkspace = useCallback((tab: WorkspaceTab) => {
    setActiveTab(tab);
    const el = document.getElementById('workspace-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        onLoadDemo={handleLoadDemo}
        onNavigateWorkspace={handleNavigateWorkspace}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
            課堂自動分組與點名抽籤工具
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            匯入 CSV 或貼上學生名單，自動檢查並移除重複姓名，快速完成課堂隨機抽籤或自動分組並匯出 CSV 檔案。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Roster Import, Duplicate Guard, and Preview */}
          <div className="lg:col-span-5">
            <RosterPanel
              students={students}
              isDemoActive={isDemoActive}
              dedupFeedback={dedupFeedback}
              onReplaceStudents={handleReplaceStudents}
              onAppendStudents={handleAppendStudents}
              onToggleAttendance={handleToggleAttendance}
              onRemoveStudent={handleRemoveStudent}
              onDeduplicate={handleDeduplicate}
              onClearAll={handleClearAll}
              onLoadDemo={handleLoadDemo}
            />
          </div>

          {/* Right Column: Interactive Classroom Workspace */}
          <section
            id="workspace-section"
            className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200">
              <div
                className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
                role="tablist"
                aria-label="課堂操作模式"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'grouping'}
                  onClick={() => setActiveTab('grouping')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'grouping'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                  <span>自動分組</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'draw'}
                  onClick={() => setActiveTab('draw')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'draw'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>隨機抽籤</span>
                </button>
              </div>

              <span className="text-xs text-slate-500">
                {activeTab === 'grouping'
                  ? '支援依組數或每組人數均分並匯出 CSV'
                  : '支援單人或多人同時抽取與不重複紀錄'}
              </span>
            </div>

            {activeTab === 'grouping' ? (
              <GroupingWorkspace
                students={students}
                groups={groups}
                onGroupsChange={setGroups}
                onLoadDemo={handleLoadDemo}
              />
            ) : (
              <LuckyDrawWorkspace
                students={students}
                onLoadDemo={handleLoadDemo}
              />
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>課堂名單分組與抽籤助手</span>
          <span>所有名單資料僅於瀏覽器本機端處理，不會上傳至外部伺服器。</span>
        </div>
      </footer>

      <UsageGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onLoadDemo={handleLoadDemo}
      />
    </div>
  );
}
