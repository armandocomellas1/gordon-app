import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Enrollment } from "@/api/entities";
import { IS_DEMO } from "@/api/base44Client";
import { getAccessState } from "@/lib/access";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await User.me();
      setUser(me);
      // Pull this user's enrollments to compute access.
      try {
        const rows = await Enrollment.filter({ user_email: me.email });
        setEnrollments(rows || []);
      } catch {
        setEnrollments([]);
      }
    } catch {
      // Not authenticated — that's a normal state, not an error.
      setUser(null);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const login = useCallback(
    async (roleKey) => {
      // Demo: roleKey picks an identity. Real Base44: redirects to Google.
      await User.login(roleKey);
      await load();
    },
    [load]
  );

  const logout = useCallback(async () => {
    await User.logout();
    setUser(null);
    setEnrollments([]);
  }, []);

  const accessState = getAccessState(user, enrollments);

  const value = {
    user,
    enrollments,
    accessState,
    loading,
    isAdmin: user?.role === "admin",
    isDemo: IS_DEMO,
    login,
    logout,
    refresh: load,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
