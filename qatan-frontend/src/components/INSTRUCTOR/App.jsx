// src/components/INSTRUCTOR/App.jsx
import { Routes, Route } from "react-router-dom";
import Instructor from "./Instructor";
import InstructorDashboard from "./InstructorDashboard";
import InstructorHomePage from "./InstructorHomePage";
import InstructorCoursesList from "./InstructorCoursesList";
import InstructorCourseCreation from "./InstructorCourseCreation";
import InstructorQuizzesPage from "./InstructorQuizzesPage";
import InstructorStudentsPage from "./InstructorStudentsPage";
import InstructorAnalyticsPage from "./InstructorAnalyticsPage";
import InstructorSettingsPage from "./InstructorSettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<Instructor />}>
        <Route path="dashboard" element={<InstructorDashboard />}>
          <Route index element={<InstructorHomePage />} />
          <Route path="" element={<InstructorHomePage />} />
          <Route path="home" element={<InstructorHomePage />} />
          <Route path="courses" element={<InstructorCoursesList />} />
          <Route path="courses/create" element={<InstructorCourseCreation />} />
          <Route path="quizzes" element={<InstructorQuizzesPage />} />

          <Route path="students" element={<InstructorStudentsPage />} />
          <Route path="analytics" element={<InstructorAnalyticsPage />} />
          <Route path="settings" element={<InstructorSettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
