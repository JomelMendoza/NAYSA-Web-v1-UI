
import { useEffect, useState, useMemo, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

import { pageRegistry } from "./pageRegistry";
import ErrorBoundary from "./NAYSA Cloud/Components/ErrorBoundary";

// API helpers (sessionStorage-based tenant, cookie auth)
import { fetchData, getTenant } from "./NAYSA Cloud/Configuration/BaseURL.jsx";

import Navbar from "./NAYSA Cloud/Components/Navbar";
import Sidebar from "./NAYSA Cloud/Components/Sidebar";
import { ResetProvider } from "./NAYSA Cloud/Components/ResetContext";

import Login from "./NAYSA Cloud/Authentication/Login.jsx";
import Register from "./NAYSA Cloud/Authentication/Register.jsx";
import Dashboard1 from "./NAYSA Cloud/Components/Dashboard1.jsx";
import { useAuth } from "./NAYSA Cloud/Authentication/AuthContext.jsx";
import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

/* -------------------- Universal Bypass Component -------------------- */
/**
 * Gatekeeper for "View Mode". 
 * It matches the URL against pageRegistry keys OR routeRows paths.
 * Redirects to "/" if viewDocument=true is missing.
 */
const UniversalRegistryRoute = ({ routeRows }) => {
  const location = useLocation();
  const { componentKey: paramKey } = useParams(); // For /page/:componentKey
  const queryParams = new URLSearchParams(location.search);
  const isViewMode = queryParams.get("viewDocument") === "true";

  const matchingComponentKey = useMemo(() => {
    // 1. Try matching by direct /page/:componentKey (e.g. /page/SVI)
    if (paramKey && pageRegistry[paramKey]) {
      return paramKey;
    }

    // 2. Try matching by DB Path (e.g. /tran-ar-svitran)
    const dbMatch = routeRows.find((r) => {
      const dbPath = r.path?.startsWith("/") ? r.path : `/${r.path}`;
      return dbPath === location.pathname;
    });

    return dbMatch ? dbMatch.componentKey : null;
  }, [location.pathname, paramKey, routeRows]);

  const Component = matchingComponentKey ? pageRegistry[matchingComponentKey] : null;

  // SECURITY GUARD: If no component found OR accessed manually without the flag, kick to Dashboard
  // This prevents the "No routes matched" warnings in history
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
    await logout();
    setIsSidebarVisible(false);
    menuFetchedRef.current = false; // Reset ref on logout
    navigate("/", { replace: true });
  };




  /* -------- Load menu + routes when user & tenant are present -------- */
  useEffect(() => {
    let alive = true;
    const tenant = getTenant();

    // Only fetch if not currently loading auth, user exists, and we haven't fetched yet
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
        menuFetchedRef.current = true; // Block future fetches until logout/refresh
      } catch (e) {
        console.error("[MENU LOAD ERROR]", e);
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




  // if (loading) {
  //   return (
  //     <div className="min-h-screen grid place-items-center">
  //       <div className="bg-white dark:bg-gray-900 rounded-xl px-6 py-4 shadow">Initializing…</div>
  //     </div>
  //   );
  // }

  /* -------- Block UI until AuthProvider finishes bootstrap -------- */
  // if (loading) {
  //   return (
  //     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-md">
  //       <div className="flex flex-col items-center gap-3">
  //         <LoadingSpinner />
  //       </div>
  //     </div>
  //   );
  // }


  if (loading) {
  return <LoadingSpinner />;
}



  /* -------- Auth pages -------- */
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Login onSwitchToRegister={() => navigate("/register")} />} />
        <Route path="/register" element={<Register onRegister={() => navigate("/")} onSwitchToLogin={() => navigate("/")} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  /* -------- Main App Layout -------- */
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
          {/* the spinner already handles the centering and the label */}
          <LoadingSpinner />
        </div>
      )}

        <Routes>
          <Route path="/" element={<Dashboard1 user={user} />} />

          {/* 1. UNIVERSAL BYPASS (Interception Route for /page/SVI) */}
          <Route 
            path="/page/:componentKey" 
            element={<UniversalRegistryRoute routeRows={routeRows} />} 
          />

          {/* 2. Standard Dynamic Menu Routes */}
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

          {/* 3. CATCH-ALL BYPASS 
              If user pastes /tran-ar-svitran directly, we check here last.
          */}
          <Route 
            path="*" 
            element={<UniversalRegistryRoute routeRows={routeRows} />} 
          />
        </Routes>
      </div>

      <ModalHost modalKey={activeModalKey} onClose={handleCloseModal} />
    </div>
  );
};

/* -------------------- App Root -------------------- */
import AuthProvider from "./NAYSA Cloud/Authentication/AuthContext.jsx";
const App = () => (
  <Router>
    <AuthProvider>
      <ResetProvider>
        <AppContent />
      </ResetProvider>
    </AuthProvider>
  </Router>
);

export default App;

































































































































































































































