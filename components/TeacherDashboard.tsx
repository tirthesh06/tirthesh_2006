import React, { useState, useMemo } from 'react';
import { User, Student, LearningPath, AttendanceRecord } from '../types';
import Header from './Header';
import StudentDetailsView from './StudentDetailsView';
import AttendanceCamera from './AttendanceCamera';
import QRCodeScanner from './QRCodeScanner';
import Chatbot from './Chatbot';
import FileManager from './FileManager';
import LinkManager from './LinkManager';
import AnimatedElement from './AnimatedElement';
import StudentAccessManager from './StudentAccessManager';

const ALL_SUBJECTS = [
    'Data Structures', 
    'Algorithms', 
    'Computer Graphics (CG)',
    'District Mathematics Structure (DMS)',
    'Open Elective-IQM',
    'Circuit Theory',
    'Civil GIS',
    'Surveying'
];

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
  students: Student[];
  setStudents: (students: Student[]) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, onLogout, students, setStudents }) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>(ALL_SUBJECTS[0]);
  const [activeTab, setActiveTab] = useState<'daily' | 'records' | 'files' | 'links' | 'overview'>('daily');
  const [scanStatus, setScanStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const today = new Date().toISOString().split('T')[0];

  const handleAttendanceChange = (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    const studentToUpdate = students.find(s => s.id === studentId);
    if (!studentToUpdate) return;
    
    const existingRecordIndex = studentToUpdate.attendance.findIndex(
        record => record.date === today && record.subject === selectedSubject
    );

    let updatedAttendance = [...studentToUpdate.attendance];

    const newRecord: AttendanceRecord = {
        date: today,
        subject: selectedSubject,
        teacherName: user.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: status,
    };

    if (existingRecordIndex > -1) {
        updatedAttendance[existingRecordIndex] = newRecord;
    } else {
        updatedAttendance.push(newRecord);
    }

    const updatedStudent = { ...studentToUpdate, attendance: updatedAttendance };
    setStudents(students.map(s => s.id === studentId ? updatedStudent : s));
  };
  
  const handleBulkAttendanceUpdate = (updatedAttendanceStatus: { [studentId: string]: 'Present' | 'Absent' }) => {
    const studentIdsToUpdate = Object.keys(updatedAttendanceStatus);

    const newStudents = students.map(student => {
      if (studentIdsToUpdate.includes(student.id)) {
        const status = updatedAttendanceStatus[student.id];
        const existingRecordIndex = student.attendance.findIndex(
          a => a.date === today && a.subject === selectedSubject
        );

        let updatedAttendanceList = [...student.attendance];
        const newRecord: AttendanceRecord = {
          date: today,
          subject: selectedSubject,
          teacherName: user.name,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: status,
        };

        if (existingRecordIndex > -1) {
          updatedAttendanceList[existingRecordIndex] = newRecord;
        } else {
          updatedAttendanceList.push(newRecord);
        }
        return { ...student, attendance: updatedAttendanceList };
      }
      return student;
    });
    setStudents(newStudents);
    setIsCameraOpen(false);
  };
  
  const handleQRScanSuccess = (studentId: string) => {
    setIsQRScannerOpen(false); // Close modal on success
    const student = students.find(s => s.id === studentId);
    if (student) {
        handleAttendanceChange(studentId, 'Present');
        setScanStatus({ type: 'success', message: `✅ Attendance for ${student.name} marked successfully!` });
    } else {
        setScanStatus({ type: 'error', message: `❌ Student with ID ${studentId} not found.` });
    }
    setTimeout(() => setScanStatus(null), 5000);
  };

  const handlePlanGenerated = (learningPath: LearningPath) => {
    if (!selectedStudent) return;
    const updatedStudents = students.map(s =>
      s.id === selectedStudent.id ? { ...s, learningPath } : s
    );
    setStudents(updatedStudents);
    setSelectedStudent(prev => prev ? { ...prev, learningPath } : null);
  };

  const getAttendanceStatusForToday = (student: Student): 'Present' | 'Absent' | 'Late' | 'N/A' => {
    const attendanceToday = student.attendance.find(a => a.date === today && a.subject === selectedSubject);
    return attendanceToday ? attendanceToday.status : 'N/A';
  };

  const filteredRecords = useMemo(() => {
    if (activeTab !== 'records') return [];
    
    const allRecords = students.flatMap(student =>
        student.attendance.map(record => ({
            ...record,
            studentName: student.name,
            rollNumber: student.rollNumber,
            studentId: student.id,
        }))
    );
    
    return allRecords
        .filter(record => {
            const recordDate = record.date;
            return recordDate >= startDate && recordDate <= endDate && record.subject === selectedSubject;
        })
        .sort((a, b) => {
            const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateComparison !== 0) return dateComparison;
            return a.studentName.localeCompare(b.studentName);
        });
  }, [students, selectedSubject, startDate, endDate, activeTab]);

  const chatbotContext = useMemo(() => {
    let context = `User is a teacher named ${user.name}. They are viewing the ${activeTab} tab.`;
    if(activeTab === 'daily' || activeTab === 'records') {
        context += ` for the subject: ${selectedSubject}.`
    }
    if (selectedStudent) {
      context += ` They are currently viewing the details for student: ${selectedStudent.name} (Roll No: ${selectedStudent.rollNumber}).`;
    }
    return context;
  }, [user.name, activeTab, selectedSubject, selectedStudent]);

  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatedElement className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-white">Teacher Dashboard</h1>
          
          <div className="flex items-center gap-4">
             <label htmlFor="subject-select" className="text-sm font-medium text-gray-300">Class Subject:</label>
             <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ALL_SUBJECTS.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                ))}
             </select>
          </div>

          <div className="flex space-x-2">
            <button
                onClick={() => setIsQRScannerOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-transform hover:scale-105"
            >
                Scan Attendance QR
            </button>
            <button
              onClick={() => setIsCameraOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-transform hover:scale-105"
            >
              Class Face Scan
            </button>
          </div>
        </AnimatedElement>

        {scanStatus && (
          <div className={`fixed top-20 right-8 p-4 rounded-lg shadow-lg text-white z-50 transition-opacity duration-300 ${scanStatus ? 'opacity-100' : 'opacity-0'}`} role="alert">
            {scanStatus.message}
          </div>
        )}
        
        <AnimatedElement className="border-b border-gray-700 mb-6" delay={100}>
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('daily')}
              className={`tab-button py-3 px-1 font-medium text-sm text-gray-400 hover:text-white ${activeTab === 'daily' ? 'active' : ''}`}
              aria-current={activeTab === 'daily' ? 'page' : undefined}
            >
              Daily Attendance
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`tab-button py-3 px-1 font-medium text-sm text-gray-400 hover:text-white ${activeTab === 'records' ? 'active' : ''}`}
              aria-current={activeTab === 'records' ? 'page' : undefined}
            >
              Attendance Records
            </button>
             <button
              onClick={() => setActiveTab('overview')}
              className={`tab-button py-3 px-1 font-medium text-sm text-gray-400 hover:text-white ${activeTab === 'overview' ? 'active' : ''}`}
              aria-current={activeTab === 'overview' ? 'page' : undefined}
            >
              Student Overview
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`tab-button py-3 px-1 font-medium text-sm text-gray-400 hover:text-white ${activeTab === 'files' ? 'active' : ''}`}
              aria-current={activeTab === 'files' ? 'page' : undefined}
            >
              Manage Files
            </button>
             <button
              onClick={() => setActiveTab('links')}
              className={`tab-button py-3 px-1 font-medium text-sm text-gray-400 hover:text-white ${activeTab === 'links' ? 'active' : ''}`}
              aria-current={activeTab === 'links' ? 'page' : undefined}
            >
              Manage Links
            </button>
          </nav>
        </AnimatedElement>
        
        <AnimatedElement>
          {activeTab === 'daily' && (
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-indigo-400">Student List for <span className="text-white">{selectedSubject}</span></h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-600">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Roll Number</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Attendance Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => {
                      const status = getAttendanceStatusForToday(student);
                      return (
                      <tr key={student.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                        <td className="p-3">{student.name}</td>
                        <td className="p-3">{student.rollNumber}</td>
                        <td className="p-3">{student.department}</td>
                        <td className="p-3">
                          <select
                            value={status}
                            onChange={(e) => handleAttendanceChange(student.id, e.target.value as 'Present' | 'Absent' | 'Late')}
                            className={`w-28 appearance-none text-center text-xs font-semibold rounded-full px-2 py-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors ${
                            {
                                'Present': 'bg-green-600/50 text-green-200 border border-green-500/50',
                                'Absent': 'bg-red-600/50 text-red-200 border border-red-500/50',
                                'Late': 'bg-yellow-600/50 text-yellow-200 border border-yellow-500/50',
                                'N/A': 'bg-gray-600/50 text-gray-200 border border-gray-500/50'
                            }[status]
                            }`}
                          >
                            <option className="bg-gray-700 text-white" value="N/A" disabled>Not Marked</option>
                            <option className="bg-gray-700 text-white" value="Present">Present</option>
                            <option className="bg-gray-700 text-white" value="Absent">Absent</option>
                            <option className="bg-gray-700 text-white" value="Late">Late</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="text-indigo-400 hover:underline"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'records' && (
             <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-indigo-400">Records for <span className="text-white">{selectedSubject}</span></h2>
                    <div className="flex flex-wrap items-center gap-4">
                        <div>
                            <label htmlFor="start-date" className="text-sm font-medium text-gray-400 mr-2">From:</label>
                            <input
                                type="date"
                                id="start-date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                aria-label="Start date for attendance records"
                            />
                        </div>
                        <div>
                            <label htmlFor="end-date" className="text-sm font-medium text-gray-400 mr-2">To:</label>
                            <input
                                type="date"
                                id="end-date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                aria-label="End date for attendance records"
                            />
                        </div>
                    </div>
                </div>
            
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-600">
                            <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">Student Name</th>
                                <th className="p-3">Roll Number</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length > 0 ? filteredRecords.map((record, index) => (
                                <tr key={`${record.date}-${record.studentId}-${index}`} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                                    <td className="p-3">{new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    <td className="p-3">{record.studentName}</td>
                                    <td className="p-3">{record.rollNumber}</td>
                                    <td className="p-3">
                                         <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                            record.status === 'Present' ? 'bg-green-600/50 text-green-200' :
                                            record.status === 'Absent' ? 'bg-red-600/50 text-red-200' :
                                            'bg-yellow-600/50 text-yellow-200'
                                          }`}>
                                            {record.status}
                                          </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center p-8 text-gray-400">
                                        No attendance records found for the selected criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <StudentAccessManager students={students} setStudents={setStudents} />
          )}

          {activeTab === 'files' && (
            <FileManager mode="teacher" />
          )}

          {activeTab === 'links' && (
            <LinkManager user={user} />
          )}
        </AnimatedElement>
      </main>

      {selectedStudent && (
        <StudentDetailsView
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onPlanGenerated={handlePlanGenerated}
        />
      )}
      {isCameraOpen && (
        <AttendanceCamera
          students={students}
          onClose={handleBulkAttendanceUpdate}
        />
      )}
      {isQRScannerOpen && (
        <QRCodeScanner
            onClose={() => setIsQRScannerOpen(false)}
            onScanSuccess={handleQRScanSuccess}
        />
      )}
      <Chatbot context={chatbotContext} />
    </>
  );
};

export default TeacherDashboard;