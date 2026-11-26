export interface Student {
  id: string;
  seatNumber: string;
  name: string;
  present: boolean;
}

export type GroupingMode = 'byGroupCount' | 'byGroupSize';

export interface GroupResult {
  groupIndex: number;
  groupName: string;
  members: Student[];
}

export interface DrawRecord {
  id: string;
  round: number;
  winners: Student[];
  timestamp: string;
}

export type WorkspaceTab = 'grouping' | 'draw';
