import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-6">
      <div className="text-center animate-fade-in">
        <div className="w-20 h-20 mx-auto rounded-full gradient-primary flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="font-display text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Oops! This page doesn't exist
        </p>
        <Button variant="hero" size="lg" onClick={() => navigate("/")}>
          <Home className="w-4 h-4" />
          Return Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
