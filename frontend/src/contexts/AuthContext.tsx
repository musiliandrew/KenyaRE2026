"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "underwriter" | "risk_analyst" | "portfolio_manager" | "county_disaster" | "cedant_broker" | "judge";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Auto-login as guest for demo mode
      const guestUser: User = {
        id: "guest",
        name: "Guest User",
        email: "guest@kenyare.co.ke",
        role: "guest",
      };
      setUser(guestUser);
      localStorage.setItem("user", JSON.stringify(guestUser));
    }
  }, []);

  const login = (email: string, role: UserRole) => {
    const newUser: User = {
      id: Date.now().toString(),
      name: email.split("@")[0],
      email,
      role,
    };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
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
