import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainHomeApp from './components/MainHome/App';
import Admin from './components/ADMIN/admin';
import Student from './components/STUDENT/student';
import InstructorApp from './components/INSTRUCTOR/App';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/*" element={<MainHomeApp />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/student/*" element={<Student />} />
        <Route path="/instructor/*" element={<InstructorApp />} />
      </Routes>
    </AuthProvider>
  );
}
