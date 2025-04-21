import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient } from "@/lib/queryClient";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [_, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    
    try {
      console.log("Attempting login with:", username);
      
      // Step 1: Login
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      
      if (!response.ok) {
        let message = "Login failed";
        try {
          const errorData = await response.json();
          message = errorData.error || message;
        } catch {
          const text = await response.text();
          if (text) message = text;
        }
        throw new Error(message);
      }
      
      const userData = await response.json();
      console.log("Login successful:", userData);
      
      // Step 2: Verify that the session was created by querying /api/user
      const userCheckResponse = await fetch("/api/user", {
        credentials: "include",
      });
      
      if (userCheckResponse.ok) {
        const userCheck = await userCheckResponse.json();
        console.log("Session verification successful:", userCheck);
        
        // Update query cache
        queryClient.setQueryData(["/api/user"], userData);
        
        // Wait a moment to ensure everything is updated
        setTimeout(() => {
          // Redirect to admin page
          window.location.href = "/admin";
        }, 500);
      } else {
        console.error("Session verification failed");
        throw new Error("Login successful but session verification failed");
      }
      
    } catch (error: any) {
      console.error("Login error:", error);
      setErrorMessage(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Alternative debug login
  const handleDebugLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      const response = await fetch('/api/debug-login');
      const data = await response.json();
      console.log('Debug login response:', data);
      
      if (response.ok) {
        // Update query cache
        queryClient.setQueryData(["/api/user"], data.user);
        window.location.href = '/admin'; // Hard refresh after login
      } else {
        setErrorMessage("Debug login failed: " + data.error);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Debug login error: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
            
            {/* Debug login button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDebugLogin}
              disabled={isLoading}
              className="text-xs text-muted-foreground"
            >
              Alternative Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}