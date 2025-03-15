"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER";
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: "STUDENT" | "TEACHER";
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Setup axios interceptor for authentication
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        // Check for stored auth in localStorage (only in browser)
        if (typeof window !== "undefined") {
          const storedAuth = localStorage.getItem("auth");

          if (storedAuth) {
            try {
              const { user, token, expiry } = JSON.parse(storedAuth);

              // Check if token is expired
              if (expiry && new Date(expiry) > new Date()) {
                setUser(user);
                setToken(token);
              } else {
                // Clear expired token
                localStorage.removeItem("auth");
              }
            } catch (error) {
              console.error("Failed to parse stored auth:", error);
              localStorage.removeItem("auth");
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();
  }, []);

  const saveAuthToStorage = (user: User, token: string) => {
    try {
      // Create expiry date (e.g., 7 days from now)
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);

      localStorage.setItem(
        "auth",
        JSON.stringify({
          user,
          token,
          expiry: expiry.toISOString(),
        })
      );
    } catch (error) {
      console.error("Failed to save auth to storage:", error);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { user, token } = response.data;

      setUser(user);
      setToken(token);
      saveAuthToStorage(user, token);

      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
        variant: "default",
      });

      router.push("/dashboard");
      return;
    } catch (err: any) {
      console.error("Login error:", err);

      let errorMessage = "Invalid credentials";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message === "Network Error") {
        errorMessage = "Network error. Please check your connection.";
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        userData
      );

      const { user, token } = response.data;

      setUser(user);
      setToken(token);
      saveAuthToStorage(user, token);

      toast({
        title: "Registration successful",
        description: `Welcome to the platform, ${user.name}!`,
        variant: "default",
      });

      router.push("/dashboard");
      return;
    } catch (err: any) {
      console.error("Registration error:", err);

      let errorMessage = "Could not create account";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 409) {
        errorMessage = "An account with this email already exists.";
      } else if (err.message === "Network Error") {
        errorMessage = "Network error. Please check your connection.";
      }

      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user || !token) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.put(
        `${API_URL}/api/users/${user.id}`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedUser = response.data;
      setUser({ ...user, ...updatedUser });

      // Update in storage
      saveAuthToStorage({ ...user, ...updatedUser }, token);

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
        variant: "default",
      });

      return;
    } catch (err: any) {
      console.error("Profile update error:", err);

      toast({
        title: "Update failed",
        description: err.response?.data?.message || "Could not update profile",
        variant: "destructive",
      });

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth");

    router.push("/");

    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
      variant: "default",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user && !!token,
      }}
    >
      {initialized ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
