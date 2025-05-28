import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import AuthGuard from "@/components/AuthGuard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={
          <AuthGuard>
            <Admin />
          </AuthGuard>
        } />
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
