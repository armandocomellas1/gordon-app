import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/i18n";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Lectures from "@/pages/Lectures";
import LectureDetail from "@/pages/LectureDetail";
import Stones from "@/pages/Stones";
import Login from "@/pages/Login";
import MyAccount from "@/pages/MyAccount";
import Certificate from "@/pages/Certificate";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/lectures" element={<Lectures />} />
              <Route path="/lectures/:id" element={<LectureDetail />} />
              <Route path="/stones" element={<Stones />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/certificate"
                element={
                  <ProtectedRoute>
                    <Certificate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <MyAccount />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );
}
