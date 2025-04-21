import { useState, useEffect, Suspense, Component, ReactNode } from "react";
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

// Error boundary component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

class ErrorBoundaryComponent extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    console.error("Error caught by error boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
          <details className="text-sm text-gray-700 whitespace-pre-wrap">
            <summary className="cursor-pointer mb-2">View technical details</summary>
            <p className="mt-2 text-red-500">{this.state.error?.toString()}</p>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Fallback loading component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F5F5F5]">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading yourbuzzfeed...</p>
      </div>
    </div>
  );
}

function Router() {
  console.log("Rendering Router component");
  const [secretCode, setSecretCode] = useState("");
  const [_, navigate] = useLocation();

  useEffect(() => {
    console.log("Router component mounted");
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

  try {
    console.log("Rendering Router content");
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
        <Header />
        <main className="flex-grow">
          <ErrorBoundaryComponent>
            <Suspense fallback={<LoadingFallback />}>
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/article/:slug" component={Article} />
                <Route path="/category/:slug" component={Category} />
                <Route path="/login" component={LoginPage} />
                <ProtectedRoute path="/admin" component={Admin} />
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </ErrorBoundaryComponent>
        </main>
        <Footer />
      </div>
    );
  } catch (error: unknown) {
    console.error("Error in Router render:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return (
      <div className="p-4 text-red-500">
        Fatal error in the Router component: {errorMessage}
      </div>
    );
  }
}

function App() {
  console.log("Rendering App component");
  try {
    return (
      <ErrorBoundaryComponent>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundaryComponent>
    );
  } catch (error: unknown) {
    console.error("Error in App render:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return (
      <div className="p-4 text-red-500">
        Fatal error in the application: {errorMessage}
      </div>
    );
  }
}

export default App;
