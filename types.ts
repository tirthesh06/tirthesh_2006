// FIX: Removed self-import of UserRole to fix circular dependency and declaration conflict.

export enum UserRole {
  Student = 'student',
  Teacher = 'teacher',
  Parent = 'parent',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  mobile?: string;
  registeredPhotoUrl: string;
  childId?: string; // For parents
}

export interface AttendanceRecord {
  date: string; // e.g., '2023-10-27'
  subject: string;
  teacherName: string;
  timestamp: string; // e.g., '09:05 AM'
  status: 'Present' | 'Absent' | 'Late';
}

export interface DailyPlanItem {
    day: string;
    focus_topic: string;
    learning_activity: string;
    practice_task: string;
    estimated_time: string;
}

export interface LearningPath {
    overall_summary: string;
    daily_plan: DailyPlanItem[];
}

// New types for Progress Tracking
export enum AssignmentStatus {
  Graded = 'Graded',
  Submitted = 'Submitted',
  Pending = 'Pending',
  Late = 'Late',
}

export interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  submittedDate?: string;
  status: AssignmentStatus;
  score?: number;
  maxScore: number;
}

export interface SubjectProgress {
  subjectName: string;
  overallGrade: string;
  teacherFeedback: string;
  assignments: Assignment[];
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  attendance: AttendanceRecord[];
  learningPath: LearningPath | null;
  isAccessBlocked: boolean;
  behaviourStatus: 'Good' | 'Needs Improvement';
  blockReason: 'Low Attendance' | 'Behaviour Issue' | 'Attendance & Behaviour' | null;
  progress: SubjectProgress[]; // Added progress tracking
  temporaryAccessExpires?: number; // Timestamp for manual override
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export interface PerformancePrediction {
  predicted_performance: string;
  confidence_score: string;
  rationale: string;
}

export interface ProgressInsight {
    strengths: string[];
    areas_for_improvement: string[];
    actionable_advice: string;
}

export interface ActivitySuggestion {
  title: string;
  description: string;
  category: 'Online Course' | 'Workshop' | 'Competition' | 'Project Idea' | 'Reading';
  rationale: string;
}


export interface FileNode {
    id: string;
    name: string;
    type: 'file';
    parentId: string | null;
    dataUrl: string;
    fileType: string;
}
export interface FolderNode {
    id:string;
    name: string;
    type: 'folder';
    parentId: string | null;
}
export type FileSystemNode = FileNode | FolderNode;

export interface SharedLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  createdBy: string; // teacher's user id
}