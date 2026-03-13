<<<<<<< HEAD
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
=======


// import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
// import { 
//   BrowserRouter as Router, 
//   Routes, 
//   Route, 
//   Navigate, 
//   useNavigate, 
//   useParams, 
//   useLocation 
// } from "react-router-dom";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { pageRegistry } from "./pageRegistry.jsx";
// import ErrorBoundary from "./NAYSA Cloud/Components/ErrorBoundary";
// import { fetchData, getTenant } from "./NAYSA Cloud/Configuration/BaseURL.jsx";
// import Navbar from "./NAYSA Cloud/Components/Navbar";
// import Sidebar from "./NAYSA Cloud/Components/Sidebar";
// import { ResetProvider } from "./NAYSA Cloud/Components/ResetContext";
// import Login from "./NAYSA Cloud/Authentication/Login.jsx";
// import Register from "./NAYSA Cloud/Authentication/Register.jsx";
// import Dashboard1 from "./NAYSA Cloud/Components/Dashboard1.jsx";
// import ChangePassword from "./NAYSA Cloud/Authentication/ChangePassword.jsx"; 
// import AuthProvider, { useAuth } from "./NAYSA Cloud/Authentication/AuthContext.jsx";
// import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

// const queryClient = new QueryClient();

// /* -------------------- Universal Registry Route (The Gatekeeper) -------------------- */
// const UniversalRegistryRoute = ({ routeRows, loadingMenu }) => {
//   const location = useLocation();
//   const { componentKey: paramKey } = useParams();
//   const queryParams = new URLSearchParams(location.search);
//   const isViewMode = queryParams.get("viewDocument") === "true";

//   const matchingComponentKey = useMemo(() => {
//     if (paramKey && pageRegistry[paramKey]) return paramKey;
    
//     const currentPath = location.pathname.replace(/\/$/, "") || "/";
//     const dbMatch = routeRows.find((r) => {
//       if (!r.path) return false;
//       const dbPath = (r.path.startsWith("/") ? r.path : `/${r.path}`).replace(/\/$/, "");
//       return dbPath === currentPath;
//     });
//     return dbMatch ? dbMatch.componentKey : null;
//   }, [location.pathname, paramKey, routeRows]);

//   const Component = matchingComponentKey ? pageRegistry[matchingComponentKey] : null;

//   if (loadingMenu && !Component) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[60vh]">
//         <LoadingSpinner />
//         <p className="mt-4 text-gray-400 animate-pulse font-medium">Validating Access...</p>
//       </div>
//     );
//   }

//   const isAuthorized = routeRows.some(r => r.componentKey === matchingComponentKey);

//   // If the path isn't in the database routes, this logic redirects to "/"
//   // This is why we must define /change-password OUTSIDE of this logic.
//   if (!Component || (!isAuthorized && !isViewMode)) {
//     return <Navigate to="/" replace />;
//   }

//   return (
//     <ErrorBoundary>
//       <Component key={matchingComponentKey} />
//     </ErrorBoundary>
//   );
// };

// /* -------------------- Modal Host -------------------- */
// const ModalHost = ({ modalKey, onClose }) => {
//   const { user } = useAuth();
//   if (!modalKey) return null;
//   const Cmp = pageRegistry[modalKey];
//   if (!Cmp) return null;

//   return (
//     <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
//       <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
//         <Cmp isOpen={true} onClose={onClose} userCode={user?.USER_CODE} />
//       </div>
//     </div>
//   );
// };

// /* -------------------- App Content -------------------- */
// const AppContent = () => {
//   const { user, loading, logout } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [menuItems, setMenuItems] = useState(() => JSON.parse(sessionStorage.getItem("menuItems")) || []);
//   const [routeRows, setRouteRows] = useState(() => JSON.parse(sessionStorage.getItem("routeRows")) || []);
//   const [loadingMenu, setLoadingMenu] = useState(false);
//   const [isSidebarVisible, setIsSidebarVisible] = useState(false);
//   const [activeModalKey, setActiveModalKey] = useState(null);
//   const menuFetchedRef = useRef(null); 

//   const resetAppData = useCallback(() => {
//     setMenuItems([]);
//     setRouteRows([]);
//     setLoadingMenu(false);
//     setIsSidebarVisible(false);
//     setActiveModalKey(null);
//     menuFetchedRef.current = null;
//     sessionStorage.removeItem("menuItems");
//     sessionStorage.removeItem("routeRows");
//   }, []);

//   const handleLogout = useCallback(async () => {
//     resetAppData();
//     await logout();
//     window.location.href = "/"; 
//   }, [logout, resetAppData]);

//   useEffect(() => {
//     let alive = true;
//     const tenant = getTenant();
//     if (!user) { resetAppData(); return; }
//     if (loading || !tenant || menuFetchedRef.current === user.USER_CODE) return;

//     (async () => {
//       try {
//         if (routeRows.length === 0) setLoadingMenu(true);
//         const [menuResp, routesResp] = await Promise.all([
//           fetchData("menu-items", { USER_CODE: user.USER_CODE }),
//           fetchData("menu-routes", { USER_CODE: user.USER_CODE }),
//         ]);
//         if (!alive) return;

//         const mData = menuResp?.menuItems ?? menuResp?.data ?? [];
//         const rData = routesResp?.routes ?? routesResp?.data ?? [];

//         setMenuItems(mData);
//         setRouteRows(rData);
//         sessionStorage.setItem("menuItems", JSON.stringify(mData));
//         sessionStorage.setItem("routeRows", JSON.stringify(rData));
//         menuFetchedRef.current = user.USER_CODE; 
//       } catch (e) {
//         console.error("Metadata Fetch Error:", e);
//       } finally {
//         if (alive) setLoadingMenu(false);
//       }
//     })();
//     return () => { alive = false; };
//   }, [user, loading, resetAppData, routeRows.length]);

//   useEffect(() => {
//     document.body.style.overflow = activeModalKey ? "hidden" : "auto";
//     return () => { document.body.style.overflow = "auto"; };
//   }, [activeModalKey]);

//   if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]"><LoadingSpinner /></div>;

//   /* --- 1. UNAUTHENTICATED ROUTES --- */
//   if (!user) {
//     return (
//       <Routes>
//         <Route path="/register" element={<Register />} />
//         {/* Explicitly defined here so clicking the link doesn't default to Login */}
//         <Route path="/change-password" element={<ChangePassword />} />
//         <Route path="*" element={<Login onSwitchToRegister={() => navigate("/register")} />} />
//       </Routes>
//     );
//   }

//   /* --- 2. AUTHENTICATED ROUTES --- */
//   return (
//     <div className="relative min-h-screen flex flex-col bg-gray-50 dark:bg-black font-roboto">
//       <div className="sticky top-0 z-40">
//         <Navbar onMenuClick={() => setIsSidebarVisible(!isSidebarVisible)} onLogout={handleLogout} />
//       </div>
      
//       {isSidebarVisible && (
//         <div className="fixed inset-0 z-50 flex">
//           <Sidebar 
//             menuItems={menuItems} 
//             onNavigate={() => setIsSidebarVisible(false)} 
//             onOpenModal={(key) => { setIsSidebarVisible(false); setActiveModalKey(key); }}
//           />
//           <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsSidebarVisible(false)} />
//         </div>
//       )}

//       <div className="flex-1 p-4 overflow-y-auto">
//         <Routes>
//           <Route path="/" element={<Dashboard1 user={user} />} />
          
//           {/* CRITICAL FIX: Defined here ABOVE the '*' catch-all. 
//               This bypasses UniversalRegistryRoute for this specific page. */}
//           <Route path="/change-password" element={<ChangePassword />} />

//           <Route 
//             path="/page/:componentKey" 
//             element={<UniversalRegistryRoute routeRows={routeRows} loadingMenu={loadingMenu} />} 
//           />

//           <Route 
//             path="*" 
//             element={<UniversalRegistryRoute routeRows={routeRows} loadingMenu={loadingMenu} />} 
//           />
//         </Routes>
//       </div>

//       <ModalHost modalKey={activeModalKey} onClose={() => setActiveModalKey(null)} />
//     </div>
//   );
// };

// /* -------------------- App Root -------------------- */
// const App = () => (
//   <Router>
//     <QueryClientProvider client={queryClient}>
//       <AuthProvider>
//         <ResetProvider>
//           <AppContent />
//         </ResetProvider>
//       </AuthProvider>
//     </QueryClientProvider>
//   </Router>
// );

// export default App;







import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate, 
  useParams, 
  useLocation 
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { pageRegistry } from "./pageRegistry.jsx";
import ErrorBoundary from "./NAYSA Cloud/Components/ErrorBoundary";
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
import { fetchData, getTenant } from "./NAYSA Cloud/Configuration/BaseURL.jsx";
import Navbar from "./NAYSA Cloud/Components/Navbar";
import Sidebar from "./NAYSA Cloud/Components/Sidebar";
import { ResetProvider } from "./NAYSA Cloud/Components/ResetContext";
import Login from "./NAYSA Cloud/Authentication/Login.jsx";
import Register from "./NAYSA Cloud/Authentication/Register.jsx";
import Dashboard1 from "./NAYSA Cloud/Components/Dashboard1.jsx";
<<<<<<< HEAD
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
=======
import ChangePassword from "./NAYSA Cloud/Authentication/ChangePassword.jsx"; 
import AuthProvider, { useAuth } from "./NAYSA Cloud/Authentication/AuthContext.jsx";
import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

const queryClient = new QueryClient();

/* -------------------- Universal Registry Route (The Gatekeeper) -------------------- */
const UniversalRegistryRoute = ({ routeRows, loadingMenu }) => {
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
  const location = useLocation();
  const { componentKey: paramKey } = useParams();
  const queryParams = new URLSearchParams(location.search);
  const isViewMode = queryParams.get("viewDocument") === "true";

  const matchingComponentKey = useMemo(() => {
    if (paramKey && pageRegistry[paramKey]) return paramKey;
<<<<<<< HEAD

    const dbMatch = routeRows.find((r) => {
      const dbPath = r.path?.startsWith("/") ? r.path : `/${r.path}`;
      return dbPath === location.pathname;
    });

=======
    
    const currentPath = location.pathname.replace(/\/$/, "") || "/";
    const dbMatch = routeRows.find((r) => {
      if (!r.path) return false;
      const dbPath = (r.path.startsWith("/") ? r.path : `/${r.path}`).replace(/\/$/, "");
      return dbPath === currentPath;
    });
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
    return dbMatch ? dbMatch.componentKey : null;
  }, [location.pathname, paramKey, routeRows]);

  const Component = matchingComponentKey ? pageRegistry[matchingComponentKey] : null;

<<<<<<< HEAD
  if (!Component || !isViewMode) {
=======
  if (loadingMenu && !Component) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-400 animate-pulse font-medium">Validating Access...</p>
      </div>
    );
  }

  const isAuthorized = routeRows.some(r => r.componentKey === matchingComponentKey);

  // If the path isn't in the database routes, this logic redirects to "/"
  // This is why we must define /change-password OUTSIDE of this logic.
  if (!Component || (!isAuthorized && !isViewMode)) {
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
    return <Navigate to="/" replace />;
  }

  return (
    <ErrorBoundary>
<<<<<<< HEAD
      <Component key={`${matchingComponentKey}-view`} />
=======
      <Component key={matchingComponentKey} />
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
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
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <Cmp isOpen={true} onClose={onClose} userCode={user?.USER_CODE} />
      </div>
    </div>
  );
};

/* -------------------- App Content -------------------- */
const AppContent = () => {
  const { user, loading, logout } = useAuth();
<<<<<<< HEAD

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
=======
  const navigate = useNavigate();
  const location = useLocation();

  const [menuItems, setMenuItems] = useState(() => JSON.parse(sessionStorage.getItem("menuItems")) || []);
  const [routeRows, setRouteRows] = useState(() => JSON.parse(sessionStorage.getItem("routeRows")) || []);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeModalKey, setActiveModalKey] = useState(null);
  const menuFetchedRef = useRef(null); 

  const resetAppData = useCallback(() => {
    setMenuItems([]);
    setRouteRows([]);
    setLoadingMenu(false);
    setIsSidebarVisible(false);
    setActiveModalKey(null);
    menuFetchedRef.current = null;
    sessionStorage.removeItem("menuItems");
    sessionStorage.removeItem("routeRows");
  }, []);

  const handleLogout = useCallback(async () => {
    resetAppData();
    await logout();
    window.location.href = "/"; 
  }, [logout, resetAppData]);
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121

  useEffect(() => {
    let alive = true;
    const tenant = getTenant();
<<<<<<< HEAD

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

=======
    if (!user) { resetAppData(); return; }
    if (loading || !tenant || menuFetchedRef.current === user.USER_CODE) return;

    (async () => {
      try {
        if (routeRows.length === 0) setLoadingMenu(true);
        const [menuResp, routesResp] = await Promise.all([
          fetchData("menu-items", { USER_CODE: user.USER_CODE }),
          fetchData("menu-routes", { USER_CODE: user.USER_CODE }),
        ]);
        if (!alive) return;

        const mData = menuResp?.menuItems ?? menuResp?.data ?? [];
        const rData = routesResp?.routes ?? routesResp?.data ?? [];

        setMenuItems(mData);
        setRouteRows(rData);
        sessionStorage.setItem("menuItems", JSON.stringify(mData));
        sessionStorage.setItem("routeRows", JSON.stringify(rData));
        menuFetchedRef.current = user.USER_CODE; 
      } catch (e) {
        console.error("Metadata Fetch Error:", e);
      } finally {
        if (alive) setLoadingMenu(false);
      }
    })();
    return () => { alive = false; };
  }, [user, loading, resetAppData, routeRows.length]);

>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
  useEffect(() => {
    document.body.style.overflow = activeModalKey ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [activeModalKey]);

<<<<<<< HEAD
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
=======
  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]"><LoadingSpinner /></div>;

  /* --- 1. UNAUTHENTICATED ROUTES --- */
  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<Register />} />
        {/* Explicitly defined here so clicking the link doesn't default to Login */}
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="*" element={<Login onSwitchToRegister={() => navigate("/register")} />} />
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
      </Routes>
    );
  }

<<<<<<< HEAD
  return (
    <div className="relative min-h-screen flex flex-col bg-gray-100 font-roboto dark:bg-black">
=======
  /* --- 2. AUTHENTICATED ROUTES --- */
  return (
    <div className="relative min-h-screen flex flex-col bg-gray-50 dark:bg-black font-roboto">
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
      <div className="sticky top-0 z-40">
        <Navbar onMenuClick={() => setIsSidebarVisible(!isSidebarVisible)} onLogout={handleLogout} />
      </div>
<<<<<<< HEAD

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
=======
      
      {isSidebarVisible && (
        <div className="fixed inset-0 z-50 flex">
          <Sidebar 
            menuItems={menuItems} 
            onNavigate={() => setIsSidebarVisible(false)} 
            onOpenModal={(key) => { setIsSidebarVisible(false); setActiveModalKey(key); }}
          />
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsSidebarVisible(false)} />
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
        </div>
      )}

      <div className="flex-1 p-4 overflow-y-auto">
<<<<<<< HEAD
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
=======
        <Routes>
          <Route path="/" element={<Dashboard1 user={user} />} />
          
          {/* CRITICAL FIX: Defined here ABOVE the '*' catch-all. 
              This bypasses UniversalRegistryRoute for this specific page. */}
          <Route path="/change-password" element={<ChangePassword />} />

          <Route 
            path="/page/:componentKey" 
            element={<UniversalRegistryRoute routeRows={routeRows} loadingMenu={loadingMenu} />} 
          />

          <Route 
            path="*" 
            element={<UniversalRegistryRoute routeRows={routeRows} loadingMenu={loadingMenu} />} 
          />
        </Routes>
      </div>

      <ModalHost modalKey={activeModalKey} onClose={() => setActiveModalKey(null)} />
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
    </div>
  );
};

/* -------------------- App Root -------------------- */
const App = () => (
  <Router>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ResetProvider>
<<<<<<< HEAD
          <Toaster 
            position="top-right" 
            richColors 
            expand={true} 
            closeButton
            theme="system"
          />
=======
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
          <AppContent />
        </ResetProvider>
      </AuthProvider>
    </QueryClientProvider>
  </Router>
);

<<<<<<< HEAD
export default App;
=======
export default App;



























































































































































































>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
