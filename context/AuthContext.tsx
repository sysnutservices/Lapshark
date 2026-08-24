import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User } from "../types";
import { API_URL } from "@/api/api";
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithUser: (user: User, token: string) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // ⭐ Load user + token on page reload
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setIsAdmin(decoded?.role === "admin");
      } catch {
        localStorage.removeItem("token");
      }
    }
  }, []);

  // ⭐ LOGIN FUNCTION
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/users/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) return false;

      const data = await res.json();

      // Save user + token
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      // Decode token to check role
      const decoded: any = jwtDecode(data.token);
      setIsAdmin(decoded?.role === "admin");

      return true;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  };

  // Used by customer OTP login (CheckoutLogin) — that flow verifies against
  // a different endpoint than the admin email/password login above, but
  // both need to land in this same context so the rest of the app (Navbar's
  // Login/Logout state included) has one source of truth.
  const loginWithUser = (loggedInUser: User, token: string) => {
    setUser(loggedInUser);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    localStorage.setItem("token", token);

    try {
      const decoded: any = jwtDecode(token);
      setIsAdmin(decoded?.role === "admin");
    } catch {
      setIsAdmin(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithUser, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
