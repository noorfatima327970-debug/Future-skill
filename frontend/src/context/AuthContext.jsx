
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const AuthContext = createContext(null);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const wait = (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await api.get("/api/auth/me");

        if (response.data.success) {
          setAdmin(response.data.admin);
          setLoading(false);
          return true;
        }

        setAdmin(null);
        setLoading(false);
        return false;
      } catch (error) {
        console.error(
          `Authentication check attempt ${attempt}/${maxAttempts}:`,
          error.message
        );

        if (attempt < maxAttempts) {
          await wait(1000);
        }
      }
    }

    setAdmin(null);
    setLoading(false);
    return false;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (adminData) => {
    setAdmin(adminData);
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      setAdmin(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
