
import React, { useState, useEffect, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';
import { BackgroundGradient } from './components/ui/BackgroundGradient';
import useLocalStorage from './hooks/useLocalStorage';
import { User, UserRole, Student, LearningPath } from './types';
import { MOCK_USERS, MOCK_STUDENTS } from './data/mockData';
import AttendanceWarningScreen from './components/AttendanceWarningScreen';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [users, setUsers] = useLocalStorage<User[]>('users-list', MOCK_USERS);
  const [students, setStudents] = useLocalStorage<Student[]>('students-list', MOCK_STUDENTS);

  const [isLoginView, setIsLoginView] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // Effect to automatically block students with low attendance upon login.
  // This only adds a block reason; it never automatically unblocks a student.
  useEffect(() => {
    if (currentUser?.role === UserRole.Student) {
        const studentIndex = students.findIndex(s => s.id === currentUser.id);
        if (studentIndex === -1) return;
        
        const studentData = students[studentIndex];
        const totalClasses = studentData.attendance.length;
        const presentClasses = studentData.attendance.filter(a => a.status === 'Present').length;
        const attendancePercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 100;
        const isLowAttendance = attendancePercentage < 75;

        if (isLowAttendance) {
            let needsUpdate = false;
            const updatedStudent = { ...studentData };
            
            if (!updatedStudent.isAccessBlocked) {
                updatedStudent.isAccessBlocked = true;
                updatedStudent.blockReason = 'Low Attendance';
                needsUpdate = true;
            } else if (updatedStudent.blockReason === 'Behaviour Issue') {
                updatedStudent.blockReason = 'Attendance & Behaviour';
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                const newStudents = [...students];
                newStudents[studentIndex] = updatedStudent;
                setStudents(newStudents);
            }
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // Run ONLY on login to prevent loops

  const handleLogin = (email: string, pass: string) => {
    const user = users.find(u => u.email === email && u.password === pass);
    if (user) {
      setCurrentUser(user);
      setAuthError(null);
    } else {
      setAuthError('Invalid email or password.');
    }
  };
  
  const handleSocialLogin = (role: UserRole) => {
    const user = users.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
      setAuthError(null);
    } else {
      setAuthError(`No mock user found for role: ${role}`);
    }
  }

  const handleProviderLogin = (identifier: string, type: 'email' | 'mobile') => {
    const user = type === 'email'
      ? users.find(u => u.email === identifier)
      : users.find(u => u.mobile === identifier);

    if (user) {
      setCurrentUser(user);
      setAuthError(null);
    } else {
      setAuthError('User not found.');
    }
  };

  const handleSignup = (details: { name: string, email: string, role: UserRole, password: string, childEmail?: string, registeredPhotoUrl: string }) => {
    if (users.find(u => u.email === details.email)) {
      setAuthError('An account with this email already exists.');
      setIsLoginView(true);
      return;
    }
    
    const newUserId = `user-${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name: details.name,
      email: details.email,
      role: details.role,
      password: details.password,
      registeredPhotoUrl: details.registeredPhotoUrl,
    };

    if (newUser.role === UserRole.Student) {
      // Create a new student with some default mock data for a better demo experience
      const defaultStudentDataTemplate = MOCK_STUDENTS[0];
      const newStudent: Student = {
        id: newUser.id,
        name: newUser.name,
        rollNumber: `S${Math.floor(Math.random() * 900) + 100}`,
        department: defaultStudentDataTemplate.department,
        attendance: [], // Start with empty attendance
        learningPath: null,
        isAccessBlocked: false,
        behaviourStatus: 'Good',
        blockReason: null,
        // FIX: Added missing 'progress' property to conform to the Student type.
        progress: [],
      };
      setStudents([...students, newStudent]);
    } else if (newUser.role === UserRole.Parent) {
      if (!details.childEmail) {
        setAuthError("Please provide your child's email to create a parent account.");
        return;
      }
      const childUser = users.find(u => u.email === details.childEmail && u.role === UserRole.Student);
      if (!childUser) {
        setAuthError(`No student account found with the email: ${details.childEmail}. Please verify the email.`);
        return;
      }
      // Link parent to child
      newUser.childId = childUser.id;
    }
    
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setAuthError(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const renderDashboard = () => {
    if (!currentUser) return null;

    if (currentUser.role === UserRole.Student) {
        const studentData = students.find(s => s.id === currentUser.id);
        if (studentData) {
          const hasActivePass = studentData.temporaryAccessExpires && studentData.temporaryAccessExpires > Date.now();
          if (studentData.isAccessBlocked && !hasActivePass) {
            return <AttendanceWarningScreen onLogout={handleLogout} />;
          }
        }
    }

    switch (currentUser.role) {
      case UserRole.Teacher:
        return <TeacherDashboard user={currentUser} onLogout={handleLogout} students={students} setStudents={setStudents} />;
      case UserRole.Student:
        const studentData = students.find(s => s.id === currentUser.id);
        if (!studentData) {
            return (
              <div className="flex flex-col items-center justify-center h-screen text-white">
                <h2 className="text-2xl text-red-400">Error: Could not load student data.</h2>
                <p className="text-gray-400">Please try logging out and back in, or contact support.</p>
                <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 rounded">Logout</button>
              </div>
            );
        }
        return <StudentDashboard
            user={currentUser}
            onLogout={handleLogout}
            studentData={studentData}
            onPlanUpdate={(learningPath) => {
                setStudents(students.map(s => s.id === currentUser.id ? { ...s, learningPath } : s));
            }}
        />;
      case UserRole.Parent:
         const childData = students.find(s => s.id === currentUser.childId);
        if (!childData) {
            return (
              <div className="flex flex-col items-center justify-center h-screen text-white">
                <h2 className="text-2xl text-red-400">Error: Could not find linked child data.</h2>
                <p className="text-gray-400">Please contact support to link your account to your child.</p>
                <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 rounded">Logout</button>
              </div>
            );
        }
        return <ParentDashboard user={currentUser} onLogout={handleLogout} childData={childData} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-screen">
            <h2 className="text-2xl text-red-400">Error: Unknown user role.</h2>
            <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 rounded">Logout</button>
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-900 text-gray-100 font-sans">
      <BackgroundGradient>
        {currentUser ? (
          renderDashboard()
        ) : isLoginView ? (
          <LoginScreen
            onLogin={handleLogin}
            onSwitchToSignup={() => { setIsLoginView(false); setAuthError(null); }}
            onProviderLogin={handleProviderLogin}
            error={authError}
            onClearError={clearAuthError}
          />
        ) : (
          <SignupScreen
            onSignup={handleSignup}
            onSwitchToLogin={() => { setIsLoginView(true); setAuthError(null); }}
            onSocialLogin={handleSocialLogin}
            error={authError}
          />
        )}
      </BackgroundGradient>
    </div>
  );
};

export default App;