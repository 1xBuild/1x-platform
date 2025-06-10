import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import AuthGuard from "@/components/AuthGuard";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Toaster position="bottom-right" richColors />
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
    </ThemeProvider>
  );
}

export default App;
