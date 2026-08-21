import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("cheran_auth_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("cheran_auth_token") || null);
  // If user & token are already present in localStorage, render immediately (0ms delay)
  const [loading, setLoading] = useState(() => {
    const savedToken = localStorage.getItem("cheran_auth_token");
    const savedUser = localStorage.getItem("cheran_auth_user");
    return !savedToken || !savedUser;
  });

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      const savedToken = localStorage.getItem("cheran_auth_token");
      if (savedToken) {
        try {
          const res = await api.get("/auth/me");
          const authUser = res?.data?.user || res?.user || res?.data;
          if (authUser && isMounted) {
            setUser(authUser);
            localStorage.setItem("cheran_auth_user", JSON.stringify(authUser));
          }
        } catch (err) {
          console.warn("Session verification failed, logging out:", err?.message || err);
          if (isMounted) {
            logout();
          }
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    const { user: authUser, token: authToken } = res.data;

    setUser(authUser);
    setToken(authToken);
    localStorage.setItem("cheran_auth_token", authToken);
    localStorage.setItem("cheran_auth_user", JSON.stringify(authUser));
    return authUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("cheran_auth_token");
    localStorage.removeItem("cheran_auth_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!user }}>
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

export default AuthContext;
