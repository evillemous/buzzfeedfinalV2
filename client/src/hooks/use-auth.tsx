import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

type LoginData = {
  username: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  
  const {
    data: user,
    error,
    isLoading: isUserLoading,
    refetch,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await apiRequest("/api/user", { method: "GET" });
        return res.json();
      } catch (error: any) {
        if (error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    // Don't retry on 401s
    retry: (failureCount, error: any) => {
      return error.status !== 401 && failureCount < 3;
    },
  });

  useEffect(() => {
    // Once the initial auth check completes, mark it as checked
    if (!isUserLoading) {
      setAuthChecked(true);
    }
  }, [isUserLoading]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        console.log("Logging in with:", credentials.username);
        const res = await fetch("/api/login", { 
          method: "POST",
          body: JSON.stringify(credentials),
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include"
        });
        
        if (!res.ok) {
          // Try to parse the error response as JSON
          let errorMessage = "Login failed";
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If it's not JSON, try to get the text
            try {
              const errorText = await res.text();
              if (errorText) errorMessage = errorText;
            } catch {}
          }
          
          console.error("Login error response:", errorMessage);
          throw new Error(errorMessage);
        }
        
        const userData = await res.json();
        console.log("Login successful, user data:", userData);
        return userData;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Login successful",
        description: "Welcome back, admin!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = isUserLoading || !authChecked;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}