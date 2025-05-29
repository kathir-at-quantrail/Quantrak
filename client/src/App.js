import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from "./common/Navbar";
import Footer from "./common/Footer";
import Home from "./components/Home/Home";
import UserAttendance from './components/Home/UserAttendance';
import Login from "./components/Login/Login";
import Admin from "./components/Admin/Admin";
import AdminUserManagement from './components/Admin/AdminAddUser/AdminUserManagement';
import AdminUserAnalytics from './components/Admin/AdminUserAnalytics/AdminUserAnalytics';
import ForgotPass from "./components/Login/ForgotPass";
import ProtectedRoute from './components/Login/ProtectedRoute';
import AdminRoute from './components/Admin/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import AuthAwareRedirect from './context/AuthAwareRedirect';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/forgotpass" element={<ForgotPass />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<Home />} />
            </Route>

            {/* Admin-only routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/adminadduser" element={<AdminUserManagement />} />
              <Route path="/adminuseranalytics" element={<AdminUserAnalytics />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<AuthAwareRedirect />} />
          </Routes>
        </div>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;