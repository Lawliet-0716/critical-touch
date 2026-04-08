import { createContext, useEffect, useState } from "react";
import { decodeToken } from "../utils/decodeToken";

export const AuthContext = createContext();

// ✅ Use .env variable (fallback to "token" if not defined)
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "token";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // 🔄 Load user on refresh
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      const decoded = decodeToken(token);

      // ✅ Check if token is valid and not expired
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      }
    }
  }, []);

  // 🔐 Login function
  const login = (token) => {
    localStorage.setItem(TOKEN_KEY, token);

    const decoded = decodeToken(token);

    if (decoded) {
      setUser(decoded);
    }
  };

  // 🚪 Logout function
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
