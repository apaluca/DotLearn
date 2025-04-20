import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Verify and decode the token
        const decoded = jwtDecode(token);

        // Check if the token is expired
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          // Set user info from token
          setUser({
            id: decoded.nameid,
            username: decoded.unique_name,
            email: decoded.email,
            role: decoded.role,
          });

          // Set Authorization header for all future requests
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Token validation error:", error);
        logout();
      }
    }

    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post("/api/auth/login", {
        username,
        password,
      });
      const { token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem("token", token);

      // Set user in state
      setUser(user);

      // Set Authorization header for all future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Login failed. Please try again.",
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post("/api/auth/register", userData);
      const { token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem("token", token);

      // Set user in state
      setUser(user);

      // Set Authorization header for all future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
      };
    }
  };

  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem("token");

    // Remove Authorization header
    delete axios.defaults.headers.common["Authorization"];

    // Clear user from state
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
