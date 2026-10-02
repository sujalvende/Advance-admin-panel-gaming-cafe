import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import PublicPage from "./components/public/PublicPage";
import { lazy, Suspense } from "react";

const AdminLayout = lazy(() => import("./admin/components/AdminLayout"));
const Login = lazy(() => import("./admin/pages/Login"));
const BookingManagement = lazy(() => import("./admin/pages/BookingManagement"));
const Dashboard = lazy(() => import("./admin/pages/Dashboard"));

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="grid min-h-dvh place-items-center text-mute">Loading…</div>}>
        <Routes>
          <Route path="/" element={<PublicPage />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<BookingManagement />} />
            <Route path="history" element={<Dashboard />} />
          </Route>
          <Route path="*" element={<PublicPage />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}
