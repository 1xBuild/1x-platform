import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  }

  return (
    <div className="relative min-h-screen">
      {children}
    </div>
  );
}
