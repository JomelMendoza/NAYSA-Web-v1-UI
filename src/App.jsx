import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { pageRegistry } from "./pageRegistry";

import { Toaster, toast } from "sonner";
import ErrorBoundary from "@/NAYSA Cloud/Components/ErrorBoundary.jsx";

// API helpers (sessionStorage-based tenant, cookie auth)
import { fetchData, getTenant } from "./NAYSA Cloud/Configuration/BaseURL.jsx";

import Navbar from "./NAYSA Cloud/Components/Navbar";
import Sidebar from "./NAYSA Cloud/Components/Sidebar";
import { ResetProvider } from "./NAYSA Cloud/Components/ResetContext";

import Login from "./NAYSA Cloud/Authentication/Login.jsx";
import Register from "./NAYSA Cloud/Authentication/Register.jsx";
import Dashboard1 from "./NAYSA Cloud/Components/Dashboard1.jsx";
import { useAuth } from "./NAYSA Cloud/Authentication/AuthContext.jsx";
import AuthProvider from "./NAYSA Cloud/Authentication/AuthContext.jsx";

import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

/* -------------------- React Query Client -------------------- */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/* -------------------- Universal Bypass Component -------------------- */
const UniversalRegistryRoute = ({ routeRows }) => {
  const location = useLocation();
  const { componentKey: paramKey } = useParams();
  const queryParams = new URLSearchParams(location.search);
  const isViewMode = queryParams.get("viewDocument") === "true";

  const matchingComponentKey = useMemo(() => {
    if (paramKey && pageRegistry[paramKey]) return paramKey;

    const dbMatch = routeRows.find((r) => {
      const dbPath = r.path?.startsWith("/") ? r.path : `/${r.path}`;
      return dbPath === location.pathname;
    });

    return dbMatch ? dbMatch.componentKey : null;
  }, [location.pathname, paramKey, routeRows]);

  const Component = matchingComponentKey ? pageRegistry[matchingComponentKey] : null;

  if (!Component || !isViewMode) {
    return <Navigate to="/" replace />;
  }

  return (
    <ErrorBoundary>
      <Component key={`${matchingComponentKey}-view`} />
    </ErrorBoundary>
  );
};

/* -------------------- Modal Host -------------------- */
const ModalHost = ({ modalKey, onClose }) => {
  const { user } = useAuth();
  if (!modalKey) return null;

  const Cmp = pageRegistry[modalKey];
  if (!Cmp) return null;

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Cmp isOpen={true} onClose={onClose} userCode={user?.USER_CODE} />
      </div>
    </div>
  );
};

/* -------------------- App Content -------------------- */
const AppContent = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const { user, loading, logout } = useAuth();

  const [menuItems, setMenuItems] = useState([]);
  const [routeRows, setRouteRows] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [routesLoaded, setRoutesLoaded] = useState(false);

  const [activeModalKey, setActiveModalKey] = useState(null);
  const menuFetchedRef = useRef(false);

  const navigate = useNavigate();
  const normPath = (p = "") => (p.startsWith("/") ? p : `/${p}`);

  const toggleSidebar = () => setIsSidebarVisible((prev) => !prev);
  const openModal = (componentKey) => setActiveModalKey(componentKey);

  const handleCloseModal = () => {
    setActiveModalKey(null);
    navigate("/", { replace: true });
  };

  const handleLogout = async () => {
    const logoutPromise = logout(); // Start the logout
    
    
    toast.promise(logoutPromise, {
      loading: 'Logging out...',
      success: () => {
        setIsSidebarVisible(false);
        menuFetchedRef.current = false;
        navigate("/", { replace: true });
        return 'Logged out successfully';
      },
      error: 'Logout failed',
    });
  };

  useEffect(() => {
    let alive = true;
    const tenant = getTenant();

    if (loading || !user || !tenant || menuFetchedRef.current) return;

    (async () => {
      try {
        setLoadingMenu(true);
        const [menuResp, routesResp] = await Promise.all([
          fetchData("menu-items", { USER_CODE: user?.USER_CODE }),
          fetchData("menu-routes", { USER_CODE: user?.USER_CODE }),
        ]);

        if (!alive) return;

        setMenuItems(menuResp?.menuItems ?? menuResp?.data ?? []);
        setRouteRows(routesResp?.routes ?? routesResp?.data ?? []);
        setRoutesLoaded(true);
        menuFetchedRef.current = true;
      } catch (e) {
        console.error("[MENU LOAD ERROR]", e);
        toast.error("Failed to load application menu");
      } finally {
        if (alive) setLoadingMenu(false);
      }
    })();

    return () => { alive = false; };
  }, [loading, user]);

  useEffect(() => {
    document.body.style.overflow = activeModalKey ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [activeModalKey]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-md">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Login onSwitchToRegister={() => navigate("/register")} />} />
        <Route path="/register" element={<Register onRegister={() => navigate("/")} onSwitchToLogin={() => navigate("/")} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-gray-100 font-roboto dark:bg-black">
      <div className="sticky top-0 z-40">
        <Navbar onMenuClick={toggleSidebar} onLogout={handleLogout} />
      </div>

      {isSidebarVisible && (
        <div className="fixed inset-0 z-50 flex">
          <Sidebar
            menuItems={menuItems}
            onNavigate={() => setIsSidebarVisible(false)}
            onOpenModal={(key) => {
              setIsSidebarVisible(false);
              openModal(key);
            }}
          />
          <div className="flex-1 bg-black/50" onClick={toggleSidebar} aria-hidden />
        </div>
      )}

      <div className="flex-1 p-4 overflow-y-auto">
        {loadingMenu && !routesLoaded && (
          <div className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
              <LoadingSpinner />
              <p className="text-sm text-slate-500">Preparing your workspace...</p>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<Dashboard1 user={user} />} />
          <Route path="/page/:componentKey" element={<UniversalRegistryRoute routeRows={routeRows} />} />
          
          {routeRows
            ?.filter((r) => r.path && r.componentKey && !r.isModal)
            .map((route) => {
              const Cmp = pageRegistry[route.componentKey];
              if (!Cmp) return null;
              return (
                <Route
                  key={route.code || route.path}
                  path={normPath(route.path)}
                  element={
                    <ErrorBoundary>
                      <Cmp />
                    </ErrorBoundary>
                  }
                />
              );
            })}

          <Route path="*" element={<UniversalRegistryRoute routeRows={routeRows} />} />
        </Routes>
      </div>

      <ModalHost modalKey={activeModalKey} onClose={handleCloseModal} />
    </div>
  );
};

/* -------------------- App Root -------------------- */
const App = () => (
  <Router>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ResetProvider>
          <Toaster 
            position="top-right" 
            richColors 
            expand={true} 
            closeButton
            theme="system"
          />
          <AppContent />
        </ResetProvider>
      </AuthProvider>
    </QueryClientProvider>
  </Router>
);

export default App;