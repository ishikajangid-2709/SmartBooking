import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync token and load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (token) {
        try {
          const res = await API.get("/auth/me");
          if (res.data?.success && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem("user", JSON.stringify(res.data.user));
          }
        } catch (err) {
          // Token invalid or expired
          if (err.response?.status === 401) {
            logout();
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
      setLoading(false);
    };

    loadProfile();
  }, [token]);

  const login = (authToken, userData) => {
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const isAdmin = user && (user.role === "ADMIN" || user.role === "admin");

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAdmin,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
