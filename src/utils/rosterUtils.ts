import { GroupResult, GroupingMode, Student } from '../types';

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `stu_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const DEMO_STUDENTS_SEED: Array<{ seatNumber: string; name: string; present: boolean }> = [
  { seatNumber: '1', name: '吳緁洳', present: true },
  { seatNumber: '2', name: '孔維雯', present: true },
  { seatNumber: '3', name: '邱芊瑜', present: true },
  { seatNumber: '4', name: '林立甄', present: true },
  { seatNumber: '5', name: '周穎珊', present: true },
  { seatNumber: '6', name: '柯貽馨', present: true },
  { seatNumber: '7', name: '陳苡瑄', present: true },
  { seatNumber: '8', name: '陳姵薰', present: true },
  { seatNumber: '9', name: '林家萱', present: true },
  { seatNumber: '10', name: '陳湋澔', present: true },
  { seatNumber: '11', name: '黃星喻', present: false },
  { seatNumber: '12', name: '吳采曀', present: true },
  { seatNumber: '13', name: '蔡依翎', present: true },
  { seatNumber: '14', name: '史子晉', present: true },
  { seatNumber: '15', name: '張晏甄', present: true },
  { seatNumber: '16', name: '吳家豪', present: true },
  { seatNumber: '17', name: '范艷瓊', present: true },
  { seatNumber: '18', name: '石島源太', present: true },
  { seatNumber: '19', name: '石島源太', present: true },
  { seatNumber: '20', name: '林家萱', present: true },
];

export function createDemoRoster(): Student[] {
  return DEMO_STUDENTS_SEED.map((item) => ({
    id: createId(),
    seatNumber: item.seatNumber,
    name: item.name,
    present: item.present,
  }));
}

function splitCsvLine(line: string, delimiter: string): string[] {
  if (delimiter !== ',') {
    return line.split(delimiter).map((cell) => cell.trim());
  }

  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseAttendance(raw?: string): boolean {
  if (!raw) return true;
  const val = raw.trim().toLowerCase();
  if (!val) return true;
  const absentKeywords = ['缺', '缺席', '請假', '未到', 'absent', 'no', 'false', '0', 'x', '×'];
  return !absentKeywords.some((kw) => val === kw || val.includes('缺') || val.includes('假'));
}

export function parseRosterText(rawText: string, startingSeat = 1): Student[] {
  const cleaned = rawText.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  if (!cleaned) return [];

  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Detect delimiter: tab vs comma
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(',') ? ',' : '';

  let seatCol = -1;
  let nameCol = 0;
  let statusCol = -1;
  let startIndex = 0;

  if (delimiter) {
    const headerCells = splitCsvLine(firstLine, delimiter).map((c) => c.toLowerCase());
    const looksLikeHeader = headerCells.some((cell) =>
      ['座號', '姓名', '名字', '學生', '出席', '狀態', 'name', 'seat', 'status', 'no'].some(
        (kw) => cell.includes(kw)
      )
    );

    if (looksLikeHeader) {
      startIndex = 1;
      headerCells.forEach((cell, idx) => {
        if (cell.includes('座號') || cell.includes('編號') || cell === 'seat' || cell === 'no') {
          seatCol = idx;
        } else if (
          cell.includes('姓名') ||
          cell.includes('名字') ||
          cell.includes('學生') ||
          cell.includes('name')
        ) {
          nameCol = idx;
        } else if (
          cell.includes('出席') ||
          cell.includes('狀態') ||
          cell.includes('status') ||
          cell.includes('attend')
        ) {
          statusCol = idx;
        }
      });
    } else {
      // No header: infer columns from first row
      const firstCells = splitCsvLine(firstLine, delimiter);
      if (firstCells.length >= 2 && /^\d+$/.test(firstCells[0])) {
        seatCol = 0;
        nameCol = 1;
        if (firstCells.length >= 3) statusCol = 2;
      } else {
        nameCol = 0;
        if (firstCells.length >= 2) statusCol = 1;
      }
    }
  }

  const parsed: Student[] = [];
  let autoSeat = startingSeat;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (delimiter) {
      const cells = splitCsvLine(line, delimiter);
      const rawName = (cells[nameCol] ?? '').trim();
      if (!rawName) continue;

      const rawSeat = seatCol >= 0 ? (cells[seatCol] ?? '').trim() : '';
      const seatNumber = rawSeat || String(autoSeat);
      const present = statusCol >= 0 ? parseAttendance(cells[statusCol]) : true;

      parsed.push({
        id: createId(),
        seatNumber,
        name: rawName,
        present,
      });
      autoSeat++;
    } else {
      // Single-column text or "1 王小明" / "01. 王小明" / "1、王小明"
      const numberedMatch = line.match(/^(\d{1,3})[\s.、,，:：-]+(.+)$/);
      if (numberedMatch) {
        const seatNumber = numberedMatch[1].trim();
        const name = numberedMatch[2].trim();
        if (name) {
          parsed.push({
            id: createId(),
            seatNumber,
            name,
            present: true,
          });
          autoSeat++;
        }
      } else {
        parsed.push({
          id: createId(),
          seatNumber: String(autoSeat),
          name: line,
          present: true,
        });
        autoSeat++;
      }
    }
  }

  return parsed;
}

export async function readFileAsTextSmart(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const utf8Text = new TextDecoder('utf-8').decode(buffer);
  // If replacement characters appear, school Excel CSV might be Big5 encoded
  if (utf8Text.includes('\uFFFD')) {
    try {
      return new TextDecoder('big5').decode(buffer);
    } catch {
      return utf8Text;
    }
  }
  return utf8Text;
}

export function getNameOccurrenceCounts(students: Student[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const s of students) {
    const key = s.name.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function countExtraDuplicates(students: Student[]): number {
  const counts = getNameOccurrenceCounts(students);
  let extra = 0;
  counts.forEach((count) => {
    if (count > 1) extra += count - 1;
  });
  return extra;
}

export function deduplicateStudents(students: Student[]): {
  deduplicated: Student[];
  removedCount: number;
} {
  const seen = new Set<string>();
  const deduplicated: Student[] = [];
  let removedCount = 0;

  for (const s of students) {
    const key = s.name.trim();
    if (seen.has(key)) {
      removedCount++;
    } else {
      seen.add(key);
      deduplicated.push(s);
    }
  }

  return { deduplicated, removedCount };
}

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateGroups(
  students: Student[],
  mode: GroupingMode,
  value: number
): GroupResult[] {
  if (students.length === 0) return [];

  const safeValue = Math.max(1, Math.floor(value));
  const groupCount =
    mode === 'byGroupCount'
      ? Math.min(safeValue, students.length)
      : Math.max(1, Math.ceil(students.length / safeValue));

  const shuffled = shuffleArray(students);
  const buckets: Student[][] = Array.from({ length: groupCount }, () => []);

  shuffled.forEach((student, index) => {
    buckets[index % groupCount].push(student);
  });

  return buckets.map((members, idx) => ({
    groupIndex: idx + 1,
    groupName: `第 ${idx + 1} 組`,
    members,
  }));
}

function escapeCsvCell(value: string): string {
  const needsQuotes = /[",\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function exportGroupsToCsv(groups: GroupResult[]): void {
  const headers = ['組別', '座號', '姓名', '出席狀態'];
  const rows: string[] = [headers.map(escapeCsvCell).join(',')];

  for (const group of groups) {
    for (const member of group.members) {
      rows.push(
        [
          group.groupName,
          member.seatNumber,
          member.name,
          member.present ? '出席' : '缺席',
        ]
          .map(escapeCsvCell)
          .join(',')
      );
    }
  }

  // Add UTF-8 BOM so Microsoft Excel opens Traditional Chinese cleanly
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;

  const link = document.createElement('a');
  link.href = url;
  link.download = `課堂自動分組結果_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
