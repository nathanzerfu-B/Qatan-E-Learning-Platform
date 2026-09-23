import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainHomeApp from './components/MainHome/App';
import AdminApp from './components/ADMIN/App';
import StudentApp from './components/STUDENT/App';
import InstructorApp from './components/INSTRUCTOR/App';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/*" element={<MainHomeApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/student/*" element={<StudentApp />} />
        <Route path="/instructor/*" element={<InstructorApp />} />
      </Routes>
    </AuthProvider>
  );
}
