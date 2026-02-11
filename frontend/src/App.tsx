import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UploadPage from "./pages/UploadPage";
import ScriptViewPage from "./pages/ScriptViewPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route path="/scripts/:id" element={<ScriptViewPage />} />
          </Routes>
        </MainLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
