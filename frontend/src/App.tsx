import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UploadPage from "./pages/UploadPage";
import ScriptViewPage from "./pages/ScriptViewPage";

// TODO: Auth wieder aktivieren
// import { Navigate } from "react-router-dom";
// import { useAuth } from "./contexts/AuthContext";
// function ProtectedRoute({ children }: { children: React.ReactNode }) {
//   const { user, loading } = useAuth();
//   if (loading) return null;
//   if (!user) return <Navigate to="/login" replace />;
//   return <>{children}</>;
// }

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* TODO: Auth wieder aktivieren – <ProtectedRoute> um <UploadPage /> */}
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/scripts/:id" element={<ScriptViewPage />} />
          </Routes>
        </MainLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
