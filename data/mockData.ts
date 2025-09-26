import { User, UserRole, Student, AssignmentStatus } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Teacher Alice',
    email: 'teacher@school.com',
    role: UserRole.Teacher,
    password: 'password123',
    registeredPhotoUrl: 'https://i.pravatar.cc/300?u=teacher@school.com',
  },
  {
    id: 'user-2',
    name: 'Student Bob',
    email: 'student@school.com',
    role: UserRole.Student,
    password: 'password123',
    registeredPhotoUrl: 'https://i.pravatar.cc/300?u=student@school.com',
  },
  {
    id: 'user-3',
    name: 'Parent Carol',
    email: 'parent@school.com',
    role: UserRole.Parent,
    password: 'password123',
    childId: 'user-2',
    registeredPhotoUrl: 'https://i.pravatar.cc/300?u=parent@school.com',
  },
];

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'user-2',
    name: 'Student Bob',
    rollNumber: 'S001',
    department: 'Computer Science',
    attendance: [
      { date: '2023-10-27', subject: 'Computer Graphics (CG)', teacherName: 'Teacher Alice', timestamp: '10:00 AM', status: 'Present' },
      { date: '2023-10-27', subject: 'District Mathematics Structure (DMS)', teacherName: 'Teacher Alice', timestamp: '12:00 PM', status: 'Present' },
      { date: '2023-10-26', subject: 'Data Structures', teacherName: 'Teacher Alice', timestamp: '09:00 AM', status: 'Present' },
      { date: '2023-10-26', subject: 'Algorithms', teacherName: 'Teacher Alice', timestamp: '11:00 AM', status: 'Present' },
      { date: '2023-10-25', subject: 'Data Structures', teacherName: 'Teacher Alice', timestamp: '09:05 AM', status: 'Absent' },
    ],
    learningPath: null,
    isAccessBlocked: false,
    behaviourStatus: 'Good',
    blockReason: null,
    progress: [
        {
            subjectName: 'Data Structures',
            overallGrade: 'A-',
            teacherFeedback: 'Excellent work on the recent assignments. Keep focusing on time complexity analysis.',
            assignments: [
                { id: 'ds-1', title: 'Lab 1: Arrays & Structs', dueDate: '2023-09-15', status: AssignmentStatus.Graded, score: 9, maxScore: 10, submittedDate: '2023-09-14' },
                { id: 'ds-2', title: 'Lab 2: Linked Lists', dueDate: '2023-09-22', status: AssignmentStatus.Graded, score: 8, maxScore: 10, submittedDate: '2023-09-22' },
                { id: 'ds-3', title: 'Mid-Term Project', dueDate: '2023-10-10', status: AssignmentStatus.Graded, score: 95, maxScore: 100, submittedDate: '2023-10-09' },
                // FIX: Added missing 'maxScore' property to conform to the Assignment type.
                { id: 'ds-4', title: 'Lab 3: Trees', dueDate: '2023-10-20', status: AssignmentStatus.Submitted, maxScore: 10 },
            ],
        },
        {
            subjectName: 'Algorithms',
            overallGrade: 'B+',
            teacherFeedback: 'Good understanding of core concepts, but be careful with edge cases in your implementations.',
            assignments: [
                { id: 'algo-1', title: 'Problem Set 1: Sorting', dueDate: '2023-09-18', status: AssignmentStatus.Graded, score: 8, maxScore: 10, submittedDate: '2023-09-18' },
                { id: 'algo-2', title: 'Problem Set 2: Recursion', dueDate: '2023-09-25', status: AssignmentStatus.Graded, score: 7, maxScore: 10, submittedDate: '2023-09-26' },
                { id: 'algo-3', title: 'Quiz 1', dueDate: '2023-10-12', status: AssignmentStatus.Graded, score: 88, maxScore: 100, submittedDate: '2023-10-12' },
                { id: 'algo-4', title: 'Problem Set 3: Graphs', dueDate: '2023-10-24', status: AssignmentStatus.Pending, maxScore: 10 },
            ],
        },
    ],
  },
  {
    id: 'user-4',
    name: 'Student David',
    rollNumber: 'S002',
    department: 'Computer Science',
    attendance: [
      { date: '2023-10-27', subject: 'Open Elective-IQM', teacherName: 'Teacher Alice', timestamp: '02:00 PM', status: 'Absent' },
      { date: '2023-10-26', subject: 'Data Structures', teacherName: 'Teacher Alice', timestamp: '09:00 AM', status: 'Absent' },
      { date: '2023-10-25', subject: 'Data Structures', teacherName: 'Teacher Alice', timestamp: '09:02 AM', status: 'Absent' },
      { date: '2023-10-24', subject: 'Data Structures', teacherName: 'Teacher Alice', timestamp: '09:02 AM', status: 'Absent' },
    ],
    learningPath: null,
    isAccessBlocked: false,
    behaviourStatus: 'Good',
    blockReason: null,
    progress: [],
  },
   {
    id: 'user-5',
    name: 'Student Eve',
    rollNumber: 'S003',
    department: 'Civil Engineering',
    attendance: [
       { date: '2023-10-27', subject: 'Civil GIS', teacherName: 'Teacher Frank', timestamp: '11:00 AM', status: 'Present' },
       { date: '2023-10-26', subject: 'Surveying', teacherName: 'Teacher Frank', timestamp: '01:00 PM', status: 'Present' },
       { date: '2023-10-25', subject: 'Circuit Theory', teacherName: 'Teacher Frank', timestamp: '10:00 AM', status: 'Present' },
    ],
    learningPath: null,
    isAccessBlocked: false,
    behaviourStatus: 'Good',
    blockReason: null,
    progress: [],
  },
];