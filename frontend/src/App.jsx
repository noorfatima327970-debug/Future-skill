import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Classes from "./pages/Classes";
import Subjects from "./pages/Subjects";
import Timetable from "./pages/Timetable";
import Attendance from "./pages/Attendance";
import Fees from "./pages/Fees";
import Expenses from "./pages/Expenses";
import ITCourses from "./pages/ITCourses";
import Exams from "./pages/Exams";
import Results from "./pages/Results";

import AcademicSessions from "./pages/AcademicSessions";
import AdminProfile from "./pages/AdminProfile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";

import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ==================== LOGIN ==================== */}

          <Route
            path="/login"
            element={<Login />}
          />

          {/* ==================== PROTECTED ROUTES ==================== */}

          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            {/* ==================== SCHOOL ==================== */}

            <Route
              path="/students"
              element={<Students />}
            />

            <Route
              path="/teachers"
              element={<Teachers />}
            />

            <Route
              path="/classes"
              element={<Classes />}
            />

            <Route
              path="/subjects"
              element={<Subjects />}
            />

            <Route
              path="/timetable"
              element={<Timetable />}
            />

            <Route
              path="/attendance"
              element={<Attendance />}
            />

            <Route
              path="/fees"
              element={<Fees />}
            />

            <Route
              path="/exams"
              element={<Exams />}
            />

            <Route
              path="/results"
              element={<Results />}
            />

            {/* ==================== IT CENTER ==================== */}

            <Route
              path="/it-courses"
              element={<ITCourses />}
            />

            {/* ==================== GENERAL ==================== */}

            <Route
              path="/expenses"
              element={<Expenses />}
            />

           
            <Route
              path="/notifications"
              element={<Notifications />}
            />

            <Route
              path="/academic-sessions"
              element={<AcademicSessions />}
            />

            

            <Route
              path="/profile"
              element={<AdminProfile />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />
          </Route>

          {/* ==================== FALLBACK ==================== */}

          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;