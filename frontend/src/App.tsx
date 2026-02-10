import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import HomePage from "./pages/HomePage";
import UploadPage from "./pages/UploadPage";
import ScriptViewPage from "./pages/ScriptViewPage";

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/scripts/:id" element={<ScriptViewPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
