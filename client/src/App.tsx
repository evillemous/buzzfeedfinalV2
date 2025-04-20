import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Article from "@/pages/Article";
import Category from "@/pages/Category";
import Admin from "@/pages/Admin";
import LoginPage from "@/pages/login-page";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  const [secretCode, setSecretCode] = useState("");
  const [_, navigate] = useLocation();

  useEffect(() => {
    // Secret admin access by typing "admin" on any page
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/[a-z]/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setSecretCode(prev => {
          const newCode = prev + e.key;
          
          // Check if the code is "admin"
          if (newCode === "admin") {
            console.log("Secret admin mode activated");
            navigate("/login");
            return "";
          }
          
          // Reset if code gets too long
          if (newCode.length > 5) {
            return "";
          }
          
          return newCode;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/article/:slug" component={Article} />
          <Route path="/category/:slug" component={Category} />
          <Route path="/login" component={LoginPage} />
          <ProtectedRoute path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
