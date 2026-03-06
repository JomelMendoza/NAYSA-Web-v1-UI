
// import { useEffect, useState, useMemo, useRef } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
//   useNavigate,
//   useParams,
//   useLocation,
// } from "react-router-dom";

// import { pageRegistry } from "./pageRegistry";
// import ErrorBoundary from "./NAYSA Cloud/Components/ErrorBoundary";

// // API helpers (sessionStorage-based tenant, cookie auth)
// import { fetchData, getTenant } from "./NAYSA Cloud/Configuration/BaseURL.jsx";

// import Navbar from "./NAYSA Cloud/Components/Navbar";
// import Sidebar from "./NAYSA Cloud/Components/Sidebar";
// import { ResetProvider } from "./NAYSA Cloud/Components/ResetContext";

// import Login from "./NAYSA Cloud/Authentication/Login.jsx";
// import Register from "./NAYSA Cloud/Authentication/Register.jsx";
// import Dashboard1 from "./NAYSA Cloud/Components/Dashboard1.jsx";
// import { useAuth } from "./NAYSA Cloud/Authentication/AuthContext.jsx";
// import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

// /* -------------------- Universal Bypass Component -------------------- */
// /**
//  * Gatekeeper for "View Mode". 
//  * It matches the URL against pageRegistry keys OR routeRows paths.
//  * Redirects to "/" if viewDocument=true is missing.
//  */
// const UniversalRegistryRoute = ({ routeRows }) => {
//   const location = useLocation();
//   const { componentKey: paramKey } = useParams(); // For /page/:componentKey
//   const queryParams = new URLSearchParams(location.search);
//   const isViewMode = queryParams.get("viewDocument") === "true";

//   const matchingComponentKey = useMemo(() => {
//     // 1. Try matching by direct /page/:componentKey (e.g. /page/SVI)
//     if (paramKey && pageRegistry[paramKey]) {
//       return paramKey;
//     }

//     // 2. Try matching by DB Path (e.g. /tran-ar-svitran)
//     const dbMatch = routeRows.find((r) => {
//       const dbPath = r.path?.startsWith("/") ? r.path : `/${r.path}`;
//       return dbPath === location.pathname;
//     });

//     return dbMatch ? dbMatch.componentKey : null;
//   }, [location.pathname, paramKey, routeRows]);

//   const Component = matchingComponentKey ? pageRegistry[matchingComponentKey] : null;

//   // SECURITY GUARD: If no component found OR accessed manually without the flag, kick to Dashboard
//   // This prevents the "No routes matched" warnings in history
//   if (!Component || !isViewMode) {
//     return <Navigate to="/" replace />;
//   }

//   return (
//     <ErrorBoundary>
//       <Component key={`${matchingComponentKey}-view`} />
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
//     <div
//       className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <Cmp isOpen={true} onClose={onClose} userCode={user?.USER_CODE} />
//       </div>
//     </div>
//   );
// };

// /* -------------------- App Content -------------------- */
// const AppContent = () => {
//   const [isSidebarVisible, setIsSidebarVisible] = useState(false);
//   const { user, loading, logout } = useAuth();
//   const [menuItems, setMenuItems] = useState([]);
//   const [routeRows, setRouteRows] = useState([]);
//   const [loadingMenu, setLoadingMenu] = useState(true);
//   const [routesLoaded, setRoutesLoaded] = useState(false);
//   const [activeModalKey, setActiveModalKey] = useState(null);
//   const menuFetchedRef = useRef(false);

//   const navigate = useNavigate();
//   const normPath = (p = "") => (p.startsWith("/") ? p : `/${p}`);




//   const toggleSidebar = () => setIsSidebarVisible((prev) => !prev);
//   const openModal = (componentKey) => setActiveModalKey(componentKey);
//   const handleCloseModal = () => {
//     setActiveModalKey(null);
//     navigate("/", { replace: true });
//   };




//   const handleLogout = async () => {
//     await logout();
//     setIsSidebarVisible(false);
//     menuFetchedRef.current = false; // Reset ref on logout
//     navigate("/", { replace: true });
//   };




//   /* -------- Load menu + routes when user & tenant are present -------- */
//   useEffect(() => {
//     let alive = true;
//     const tenant = getTenant();

//     // Only fetch if not currently loading auth, user exists, and we haven't fetched yet
//     if (loading || !user || !tenant || menuFetchedRef.current) return;

//     (async () => {
//       try {
//         setLoadingMenu(true);
//         const [menuResp, routesResp] = await Promise.all([
//           fetchData("menu-items", { USER_CODE: user?.USER_CODE }),
//           fetchData("menu-routes", { USER_CODE: user?.USER_CODE }),
//         ]);

//         if (!alive) return;

//         setMenuItems(menuResp?.menuItems ?? menuResp?.data ?? []);
//         setRouteRows(routesResp?.routes ?? routesResp?.data ?? []);
//         setRoutesLoaded(true);
//         menuFetchedRef.current = true; // Block future fetches until logout/refresh
//       } catch (e) {
//         console.error("[MENU LOAD ERROR]", e);
//       } finally {
//         if (alive) setLoadingMenu(false);
//       }
//     })();

//     return () => { alive = false; };
//   }, [loading, user]);




//   useEffect(() => {
//     document.body.style.overflow = activeModalKey ? "hidden" : "auto";
//     return () => { document.body.style.overflow = "auto"; };
//   }, [activeModalKey]);




//   // if (loading) {
//   //   return (
//   //     <div className="min-h-screen grid place-items-center">
//   //       <div className="bg-white dark:bg-gray-900 rounded-xl px-6 py-4 shadow">Initializing…</div>
//   //     </div>
//   //   );
//   // }

//   /* -------- Block UI until AuthProvider finishes bootstrap -------- */
//   // if (loading) {
//   //   return (
//   //     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-md">
//   //       <div className="flex flex-col items-center gap-3">
//   //         <LoadingSpinner />
//   //       </div>
//   //     </div>
//   //   );
//   // }


//   if (loading) {
//   return <LoadingSpinner />;
// }



//   /* -------- Auth pages -------- */
//   if (!user) {
//     return (
//       <Routes>
//         <Route path="/" element={<Login onSwitchToRegister={() => navigate("/register")} />} />
//         <Route path="/register" element={<Register onRegister={() => navigate("/")} onSwitchToLogin={() => navigate("/")} />} />
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     );
//   }

//   /* -------- Main App Layout -------- */
//   return (
//     <div className="relative min-h-screen flex flex-col bg-gray-100 font-roboto dark:bg-black">
//       <div className="sticky top-0 z-40">
//         <Navbar onMenuClick={toggleSidebar} onLogout={handleLogout} />
//       </div>

//       {isSidebarVisible && (
//         <div className="fixed inset-0 z-50 flex">
//           <Sidebar
//             menuItems={menuItems}
//             onNavigate={() => setIsSidebarVisible(false)}
//             onOpenModal={(key) => {
//               setIsSidebarVisible(false);
//               openModal(key);
//             }}
//           />
//           <div className="flex-1 bg-black/50" onClick={toggleSidebar} aria-hidden />
//         </div>
//       )}

//       <div className="flex-1 p-4 overflow-y-auto">
//       {loadingMenu && !routesLoaded && (
//         <div className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm flex items-center justify-center">
//           {/* the spinner already handles the centering and the label */}
//           <LoadingSpinner />
//         </div>
//       )}

//         <Routes>
//           <Route path="/" element={<Dashboard1 user={user} />} />

//           {/* 1. UNIVERSAL BYPASS (Interception Route for /page/SVI) */}
//           <Route 
//             path="/page/:componentKey" 
//             element={<UniversalRegistryRoute routeRows={routeRows} />} 
//           />

//           {/* 2. Standard Dynamic Menu Routes */}
//           {routeRows
//             ?.filter((r) => r.path && r.componentKey && !r.isModal)
//             .map((route) => {
//               const Cmp = pageRegistry[route.componentKey];
//               if (!Cmp) return null;
//               return (
//                 <Route 
//                   key={route.code || route.path} 
//                   path={normPath(route.path)} 
//                   element={
//                     <ErrorBoundary>
//                       <Cmp />
//                     </ErrorBoundary>
//                   } 
//                 />
//               );
//             })}

//           {/* 3. CATCH-ALL BYPASS 
//               If user pastes /tran-ar-svitran directly, we check here last.
//           */}
//           <Route 
//             path="*" 
//             element={<UniversalRegistryRoute routeRows={routeRows} />} 
//           />
//         </Routes>
//       </div>

//       <ModalHost modalKey={activeModalKey} onClose={handleCloseModal} />
//     </div>
//   );
// };

// /* -------------------- App Root -------------------- */
// import AuthProvider from "./NAYSA Cloud/Authentication/AuthContext.jsx";
// const App = () => (
//   <Router>
//     <AuthProvider>
//       <ResetProvider>
//         <AppContent />
//       </ResetProvider>
//     </AuthProvider>
//   </Router>
// );

// export default App;






// import React, { useEffect, useState, useMemo, useRef } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
//   useNavigate,
//   useParams,
//   useLocation,
// } from "react-router-dom";

// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// import { pageRegistry } from "./pageRegistry.jsx";
// import ErrorBoundary from "./NAYSA Cloud/Components/ErrorBoundary";

// // API helpers (sessionStorage-based tenant, cookie auth)
// import { fetchData, getTenant } from "./NAYSA Cloud/Configuration/BaseURL.jsx";

// import Navbar from "./NAYSA Cloud/Components/Navbar";
// import Sidebar from "./NAYSA Cloud/Components/Sidebar";
// import { ResetProvider } from "./NAYSA Cloud/Components/ResetContext";

// import Login from "./NAYSA Cloud/Authentication/Login.jsx";
// import Register from "./NAYSA Cloud/Authentication/Register.jsx";
// import Dashboard1 from "./NAYSA Cloud/Components/Dashboard1.jsx";
// import { useAuth } from "./NAYSA Cloud/Authentication/AuthContext.jsx";
// import AuthProvider from "./NAYSA Cloud/Authentication/AuthContext.jsx";

// import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

// /* -------------------- React Query Client -------------------- */
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: 1,
//       staleTime: 30_000,
//       refetchOnWindowFocus: false,
//     },
//     mutations: {
//       retry: 0,
//     },
//   },
// });

// /* -------------------- Universal Bypass Component -------------------- */
// const UniversalRegistryRoute = ({ routeRows }) => {
//   const location = useLocation();
//   const { componentKey: paramKey } = useParams();
//   const queryParams = new URLSearchParams(location.search);
//   const isViewMode = queryParams.get("viewDocument") === "true";

//   const matchingComponentKey = useMemo(() => {
//     if (paramKey && pageRegistry[paramKey]) return paramKey;

//     const dbMatch = routeRows.find((r) => {
//       const dbPath = r.path?.startsWith("/") ? r.path : `/${r.path}`;
//       return dbPath === location.pathname;
//     });

//     return dbMatch ? dbMatch.componentKey : null;
//   }, [location.pathname, paramKey, routeRows]);

//   const Component = matchingComponentKey ? pageRegistry[matchingComponentKey] : null;

//   if (!Component || !isViewMode) {
//     return <Navigate to="/" replace />;
//   }

//   return (
//     <ErrorBoundary>
//       <Component key={`${matchingComponentKey}-view`} />
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
//     <div
//       className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <Cmp isOpen={true} onClose={onClose} userCode={user?.USER_CODE} />
//       </div>
//     </div>
//   );
// };

// /* -------------------- App Content -------------------- */
// const AppContent = () => {
//   const [isSidebarVisible, setIsSidebarVisible] = useState(false);
//   const { user, loading, logout } = useAuth();

//   const [menuItems, setMenuItems] = useState([]);
//   const [routeRows, setRouteRows] = useState([]);
//   const [loadingMenu, setLoadingMenu] = useState(true);
//   const [routesLoaded, setRoutesLoaded] = useState(false);

//   const [activeModalKey, setActiveModalKey] = useState(null);
//   const menuFetchedRef = useRef(false);

//   const navigate = useNavigate();
//   const normPath = (p = "") => (p.startsWith("/") ? p : `/${p}`);

//   const toggleSidebar = () => setIsSidebarVisible((prev) => !prev);
//   const openModal = (componentKey) => setActiveModalKey(componentKey);

//   const handleCloseModal = () => {
//     setActiveModalKey(null);
//     navigate("/", { replace: true });
//   };

//   const handleLogout = async () => {
//     const logoutPromise = logout(); // Start the logout
    
    
//     toast.promise(logoutPromise, {
//       loading: 'Logging out...',
//       success: () => {
//         setIsSidebarVisible(false);
//         menuFetchedRef.current = false;
//         navigate("/", { replace: true });
//         return 'Logged out successfully';
//       },
//       error: 'Logout failed',
//     });
//   };

//   useEffect(() => {
//     let alive = true;
//     const tenant = getTenant();

//     if (loading || !user || !tenant || menuFetchedRef.current) return;

//     (async () => {
//       try {
//         setLoadingMenu(true);
//         const [menuResp, routesResp] = await Promise.all([
//           fetchData("menu-items", { USER_CODE: user?.USER_CODE }),
//           fetchData("menu-routes", { USER_CODE: user?.USER_CODE }),
//         ]);

//         if (!alive) return;

//         setMenuItems(menuResp?.menuItems ?? menuResp?.data ?? []);
//         setRouteRows(routesResp?.routes ?? routesResp?.data ?? []);
//         setRoutesLoaded(true);
//         menuFetchedRef.current = true;
//       } catch (e) {
//         console.error("[MENU LOAD ERROR]", e);
//         toast.error("Failed to load application menu");
//       } finally {
//         if (alive) setLoadingMenu(false);
//       }
//     })();

//     return () => { alive = false; };
//   }, [loading, user]);

//   useEffect(() => {
//     document.body.style.overflow = activeModalKey ? "hidden" : "auto";
//     return () => { document.body.style.overflow = "auto"; };
//   }, [activeModalKey]);

//   if (loading) {
//     return (
//       <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-md">
//         <LoadingSpinner />
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <Routes>
//         <Route path="/" element={<Login onSwitchToRegister={() => navigate("/register")} />} />
//         <Route path="/register" element={<Register onRegister={() => navigate("/")} onSwitchToLogin={() => navigate("/")} />} />
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     );
//   }

//   return (
//     <div className="relative min-h-screen flex flex-col bg-gray-100 font-roboto dark:bg-black">
//       <div className="sticky top-0 z-40">
//         <Navbar onMenuClick={toggleSidebar} onLogout={handleLogout} />
//       </div>

//       {isSidebarVisible && (
//         <div className="fixed inset-0 z-50 flex">
//           <Sidebar
//             menuItems={menuItems}
//             onNavigate={() => setIsSidebarVisible(false)}
//             onOpenModal={(key) => {
//               setIsSidebarVisible(false);
//               openModal(key);
//             }}
//           />
//           <div className="flex-1 bg-black/50" onClick={toggleSidebar} aria-hidden />
//         </div>
//       )}

//       <div className="flex-1 p-4 overflow-y-auto">
//         {loadingMenu && !routesLoaded && (
//           <div className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm flex items-center justify-center">
//             <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
//               <LoadingSpinner />
//               <p className="text-sm text-slate-500">Preparing your workspace...</p>
//             </div>
//           </div>
//         )}

//         <Routes>
//           <Route path="/" element={<Dashboard1 user={user} />} />
//           <Route path="/page/:componentKey" element={<UniversalRegistryRoute routeRows={routeRows} />} />
          
//           {routeRows
//             ?.filter((r) => r.path && r.componentKey && !r.isModal)
//             .map((route) => {
//               const Cmp = pageRegistry[route.componentKey];
//               if (!Cmp) return null;
//               return (
//                 <Route
//                   key={route.code || route.path}
//                   path={normPath(route.path)}
//                   element={
//                     <ErrorBoundary>
//                       <Cmp />
//                     </ErrorBoundary>
//                   }
//                 />
//               );
//             })}

//           <Route path="*" element={<UniversalRegistryRoute routeRows={routeRows} />} />
//         </Routes>
//       </div>

//       <ModalHost modalKey={activeModalKey} onClose={handleCloseModal} />
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







// import React, { useEffect, useState, useMemo, useRef } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
//   useNavigate,
//   useParams,
//   useLocation,
// } from "react-router-dom";

// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { toast } from "react-hot-toast";

// import { pageRegistry } from "./pageRegistry.jsx";
// import ErrorBoundary from "./NAYSA Cloud/Components/ErrorBoundary";

// // API helpers
// import { fetchData, getTenant } from "./NAYSA Cloud/Configuration/BaseURL.jsx";

// import Navbar from "./NAYSA Cloud/Components/Navbar";
// import Sidebar from "./NAYSA Cloud/Components/Sidebar";
// import { ResetProvider } from "./NAYSA Cloud/Components/ResetContext";

// import Login from "./NAYSA Cloud/Authentication/Login.jsx";
// import Register from "./NAYSA Cloud/Authentication/Register.jsx";
// import Dashboard1 from "./NAYSA Cloud/Components/Dashboard1.jsx";
// import { useAuth } from "./NAYSA Cloud/Authentication/AuthContext.jsx";
// import AuthProvider from "./NAYSA Cloud/Authentication/AuthContext.jsx";

// import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

// /* -------------------- React Query Client -------------------- */
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
//     mutations: { retry: 0 },
//   },
// });

// /* -------------------- Universal Registry / Guard Component -------------------- */
// const UniversalRegistryRoute = ({ routeRows, loadingMenu }) => {
//   const location = useLocation();
//   const { componentKey: paramKey } = useParams();
//   const queryParams = new URLSearchParams(location.search);
//   const isViewMode = queryParams.get("viewDocument") === "true";

//   // 1. Prevent redirection while data is still being fetched (for new tabs)
//   if (loadingMenu) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[50vh]">
//         <LoadingSpinner />
//         <p className="mt-4 text-gray-500 animate-pulse font-medium">Verifying access permissions...</p>
//       </div>
//     );
//   }

//   // 2. Authorization Logic
//   const matchingComponentKey = useMemo(() => {
//     // Priority 1: Direct component key from /page/:componentKey
//     if (paramKey && pageRegistry[paramKey]) return paramKey;

//     // Priority 2: Check if current URL path is in the user's authorized menu list
//     const dbMatch = routeRows.find((r) => {
//       const dbPath = r.path?.startsWith("/") ? r.path : `/${r.path}`;
//       return dbPath === location.pathname;
//     });

//     return dbMatch ? dbMatch.componentKey : null;
//   }, [location.pathname, paramKey, routeRows]);

//   const Component = matchingComponentKey ? pageRegistry[matchingComponentKey] : null;

//   // 3. Unauthorized: Redirect to dashboard if no match found after loading
//   if (!Component) {
//     return <Navigate to="/" replace />;
//   }

//   // Check view mode requirement for specific parameter routes
//   if (paramKey && !isViewMode) {
//     return <Navigate to="/" replace />;
//   }

//   return (
//     <ErrorBoundary>
//       <Component key={`${matchingComponentKey}-view`} />
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
//     <div
//       className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <Cmp isOpen={true} onClose={onClose} userCode={user?.USER_CODE} />
//       </div>
//     </div>
//   );
// };

// /* -------------------- App Content -------------------- */
// const AppContent = () => {
//   const [isSidebarVisible, setIsSidebarVisible] = useState(false);
//   const { user, loading, logout } = useAuth();

//   const [menuItems, setMenuItems] = useState([]);
//   const [routeRows, setRouteRows] = useState([]);
//   const [loadingMenu, setLoadingMenu] = useState(true);
//   const [routesLoaded, setRoutesLoaded] = useState(false);

//   const [activeModalKey, setActiveModalKey] = useState(null);
  
//   // This ref tracks if the current USER has fetched their menu
//   const menuFetchedRef = useRef(false);

//   const navigate = useNavigate();
//   const normPath = (p = "") => (p.startsWith("/") ? p : `/${p}`);

//   const toggleSidebar = () => setIsSidebarVisible((prev) => !prev);
//   const openModal = (componentKey) => setActiveModalKey(componentKey);

//   const handleCloseModal = () => {
//     setActiveModalKey(null);
//     navigate("/", { replace: true });
//   };

//   /**
//    * CRITICAL: RESET ALL STATE ON LOGOUT
//    * Ensures the next user starts with an empty cache.
//    */
//   const handleLogout = async () => {
//     const logoutPromise = logout();
//     toast.promise(logoutPromise, {
//       loading: 'Logging out...',
//       success: () => {
//         setIsSidebarVisible(false);
//         // --- CLEANUP START ---
//         menuFetchedRef.current = false; // Allow new fetch on next login
//         setMenuItems([]);               // Clear old menu UI
//         setRouteRows([]);               // Clear old route permissions
//         setRoutesLoaded(false);         // Mark as not ready
//         setLoadingMenu(true);           // Prepare for next auth cycle
//         // --- CLEANUP END ---
//         navigate("/", { replace: true });
//         return 'Logged out successfully';
//       },
//       error: 'Logout failed',
//     });
//   };

//   /**
//    * MENU FETCHING EFFECT
//    * Re-runs whenever 'user' changes.
//    */
//   useEffect(() => {
//     let alive = true;
//     const tenant = getTenant();

//     // If logged out, reset the fetch flag so the next login works
//     if (!user) {
//       menuFetchedRef.current = false;
//       return;
//     }

//     // Skip if already loading or already fetched for THIS user session
//     if (loading || !tenant || menuFetchedRef.current) return;

//     (async () => {
//       try {
//         setLoadingMenu(true);
//         const [menuResp, routesResp] = await Promise.all([
//           fetchData("menu-items", { USER_CODE: user?.USER_CODE }),
//           fetchData("menu-routes", { USER_CODE: user?.USER_CODE }),
//         ]);

//         if (!alive) return;

//         setMenuItems(menuResp?.menuItems ?? menuResp?.data ?? []);
//         setRouteRows(routesResp?.routes ?? routesResp?.data ?? []);
//         setRoutesLoaded(true);
//         menuFetchedRef.current = true; // Mark as fetched for this user
//       } catch (e) {
//         console.error("[MENU LOAD ERROR]", e);
//         toast.error("Failed to load application menu");
//       } finally {
//         if (alive) setLoadingMenu(false);
//       }
//     })();

//     return () => { alive = false; };
//   }, [loading, user]); // Dependency on 'user' is key for switching users

//   useEffect(() => {
//     document.body.style.overflow = activeModalKey ? "hidden" : "auto";
//     return () => { document.body.style.overflow = "auto"; };
//   }, [activeModalKey]);

//   if (loading) {
//     return (
//       <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-md">
//         <LoadingSpinner />
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <Routes>
//         <Route path="/" element={<Login onSwitchToRegister={() => navigate("/register")} />} />
//         <Route path="/register" element={<Register onRegister={() => navigate("/")} onSwitchToLogin={() => navigate("/")} />} />
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     );
//   }

//   return (
//     <div className="relative min-h-screen flex flex-col bg-gray-100 font-roboto dark:bg-black">
//       <div className="sticky top-0 z-40">
//         <Navbar onMenuClick={toggleSidebar} onLogout={handleLogout} />
//       </div>

//       {isSidebarVisible && (
//         <div className="fixed inset-0 z-50 flex">
//           <Sidebar
//             menuItems={menuItems}
//             onNavigate={() => setIsSidebarVisible(false)}
//             onOpenModal={(key) => {
//               setIsSidebarVisible(false);
//               openModal(key);
//             }}
//           />
//           <div className="flex-1 bg-black/50" onClick={toggleSidebar} aria-hidden />
//         </div>
//       )}

//       <div className="flex-1 p-4 overflow-y-auto">
//         <Routes>
//           <Route path="/" element={<Dashboard1 user={user} />} />
          
//           {/* Universal Guard for parameter-based routes */}
//           <Route 
//             path="/page/:componentKey" 
//             element={<UniversalRegistryRoute routeRows={routeRows} loadingMenu={loadingMenu} />} 
//           />
          
//           {/* Dynamic mapping of authorized routes */}
//           {routeRows
//             ?.filter((r) => r.path && r.componentKey && !r.isModal)
//             .map((route) => {
//               const Cmp = pageRegistry[route.componentKey];
//               if (!Cmp) return null;
//               return (
//                 <Route
//                   key={route.code || route.path}
//                   path={normPath(route.path)}
//                   element={
//                     <ErrorBoundary>
//                       <Cmp />
//                     </ErrorBoundary>
//                   }
//                 />
//               );
//             })}

//           {/* Catch-all for manual URL entry verification */}
//           <Route 
//             path="*" 
//             element={<UniversalRegistryRoute routeRows={routeRows} loadingMenu={loadingMenu} />} 
//           />
//         </Routes>
//       </div>

//       <ModalHost modalKey={activeModalKey} onClose={handleCloseModal} />
//     </div>
//   );
// };

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






// import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
//   useNavigate,
//   useParams,
//   useLocation,
// } from "react-router-dom";

// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { toast } from "react-hot-toast";

// import { pageRegistry } from "./pageRegistry.jsx";
// import ErrorBoundary from "./NAYSA Cloud/Components/ErrorBoundary";
// import { fetchData, getTenant } from "./NAYSA Cloud/Configuration/BaseURL.jsx";

// import Navbar from "./NAYSA Cloud/Components/Navbar";
// import Sidebar from "./NAYSA Cloud/Components/Sidebar";
// import { ResetProvider } from "./NAYSA Cloud/Components/ResetContext";

// import Login from "./NAYSA Cloud/Authentication/Login.jsx";
// import Register from "./NAYSA Cloud/Authentication/Register.jsx";
// import Dashboard1 from "./NAYSA Cloud/Components/Dashboard1.jsx";
// import { useAuth } from "./NAYSA Cloud/Authentication/AuthContext.jsx";
// import AuthProvider from "./NAYSA Cloud/Authentication/AuthContext.jsx";

// import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

// const queryClient = new QueryClient();

// /* -------------------- Guard Component -------------------- */
// const UniversalRegistryRoute = ({ routeRows, loadingMenu }) => {
//   const location = useLocation();
//   const { componentKey: paramKey } = useParams();
//   const queryParams = new URLSearchParams(location.search);
//   const isViewMode = queryParams.get("viewDocument") === "true";

//   if (loadingMenu) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[50vh]">
//         <LoadingSpinner />
//         <p className="mt-4 text-gray-500 animate-pulse">Verifying permissions...</p>
//       </div>
//     );
//   }

//   const matchingComponentKey = useMemo(() => {
//     if (paramKey && pageRegistry[paramKey]) return paramKey;
//     const dbMatch = routeRows.find((r) => {
//       const dbPath = r.path?.startsWith("/") ? r.path : `/${r.path}`;
//       return dbPath === location.pathname;
//     });
//     return dbMatch ? dbMatch.componentKey : null;
//   }, [location.pathname, paramKey, routeRows]);

//   const Component = matchingComponentKey ? pageRegistry[matchingComponentKey] : null;

//   if (!Component) return <Navigate to="/" replace />;
//   if (paramKey && !isViewMode) return <Navigate to="/" replace />;

//   return (
//     <ErrorBoundary>
//       <Component key={`${matchingComponentKey}-view`} />
//     </ErrorBoundary>
//   );
// };

// /* -------------------- App Content -------------------- */
// const AppContent = () => {
//   const { user, loading, logout } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [menuItems, setMenuItems] = useState([]);
//   const [routeRows, setRouteRows] = useState([]);
//   const [loadingMenu, setLoadingMenu] = useState(false);
//   const [isSidebarVisible, setIsSidebarVisible] = useState(false);
//   const [activeModalKey, setActiveModalKey] = useState(null);
  
//   // Use a ref to prevent double-fetching, but we reset it on logout
//   const menuFetchedRef = useRef(null); 

//   const normPath = (p = "") => (p.startsWith("/") ? p : `/${p}`);

//   // FIX: Reset everything to initial state
//   const resetAppData = useCallback(() => {
//     setMenuItems([]);
//     setRouteRows([]);
//     setLoadingMenu(false);
//     setIsSidebarVisible(false);
//     setActiveModalKey(null);
//     menuFetchedRef.current = null; // CRITICAL: Reset the ref
//   }, []);

//   const handleLogout = async () => {
//     try {
//       // Clear local UI state immediately to prevent "ghost" menus
//       resetAppData();
      
//       const logoutPromise = logout(); 
//       await toast.promise(logoutPromise, {
//         loading: 'Logging out...',
//         success: 'Logged out successfully',
//         error: 'Logout encountered an issue',
//       });
//     } catch (err) {
//       console.error("Logout Error:", err);
//     } finally {
//       // Force navigation to root regardless of success/fail
//       navigate("/", { replace: true });
//     }
//   };

//   useEffect(() => {
//     let alive = true;
//     const tenant = getTenant();

//     // 1. If no user, ensure data is cleared and don't fetch
//     if (!user) {
//       resetAppData();
//       return;
//     }

//     // 2. Only fetch if we haven't fetched for THIS specific user
//     if (loading || !tenant || menuFetchedRef.current === user.USER_CODE) return;

//     (async () => {
//       try {
//         setLoadingMenu(true);
//         const [menuResp, routesResp] = await Promise.all([
//           fetchData("menu-items", { USER_CODE: user.USER_CODE }),
//           fetchData("menu-routes", { USER_CODE: user.USER_CODE }),
//         ]);

//         if (!alive) return;

//         setMenuItems(menuResp?.menuItems ?? menuResp?.data ?? []);
//         setRouteRows(routesResp?.routes ?? routesResp?.data ?? []);
//         menuFetchedRef.current = user.USER_CODE; // Map fetch to the specific user
//       } catch (e) {
//         console.error("Menu Fetch Error:", e);
//       } finally {
//         if (alive) setLoadingMenu(false);
//       }
//     })();

//     return () => { alive = false; };
//   }, [user, loading, resetAppData]);

//   if (loading) return <div className="fixed inset-0 flex items-center justify-center"><LoadingSpinner /></div>;

//   if (!user) {
//     return (
//       <Routes>
//         <Route path="/register" element={<Register />} />
//         <Route path="*" element={<Login />} />
//       </Routes>
//     );
//   }

//   return (
//     <div className="relative min-h-screen flex flex-col bg-gray-100 dark:bg-black">
//       <Navbar onMenuClick={() => setIsSidebarVisible(!isSidebarVisible)} onLogout={handleLogout} />
      
//       {isSidebarVisible && (
//         <div className="fixed inset-0 z-50 flex">
//           <Sidebar menuItems={menuItems} onNavigate={() => setIsSidebarVisible(false)} onOpenModal={setActiveModalKey} />
//           <div className="flex-1 bg-black/50" onClick={() => setIsSidebarVisible(false)} />
//         </div>
//       )}

//       <div className="flex-1 p-4 overflow-y-auto">
//         <Routes>
//           <Route path="/" element={<Dashboard1 user={user} />} />
//           <Route path="/page/:componentKey" element={<UniversalRegistryRoute routeRows={routeRows} loadingMenu={loadingMenu} />} />
//           {routeRows.filter(r => r.path && r.componentKey).map((route) => {
//             const Cmp = pageRegistry[route.componentKey];
//             return Cmp ? <Route key={route.path} path={normPath(route.path)} element={<ErrorBoundary><Cmp /></ErrorBoundary>} /> : null;
//           })}
//           <Route path="*" element={<UniversalRegistryRoute routeRows={routeRows} loadingMenu={loadingMenu} />} />
//         </Routes>
//       </div>
//     </div>
//   );
// };

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





// import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { toast } from "react-hot-toast";

// import { pageRegistry } from "./pageRegistry.jsx";
// import ErrorBoundary from "./NAYSA Cloud/Components/ErrorBoundary";
// import { fetchData, getTenant } from "./NAYSA Cloud/Configuration/BaseURL.jsx";
// import Navbar from "./NAYSA Cloud/Components/Navbar";
// import Sidebar from "./NAYSA Cloud/Components/Sidebar";
// import { ResetProvider } from "./NAYSA Cloud/Components/ResetContext";
// import Login from "./NAYSA Cloud/Authentication/Login.jsx";
// import Register from "./NAYSA Cloud/Authentication/Register.jsx";
// import Dashboard1 from "./NAYSA Cloud/Components/Dashboard1.jsx";
// import { useAuth } from "./NAYSA Cloud/Authentication/AuthContext.jsx";
// import AuthProvider from "./NAYSA Cloud/Authentication/AuthContext.jsx";
// import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

// const queryClient = new QueryClient();

// /* -------------------- The Gatekeeper (Guard) -------------------- */
// const UniversalRegistryRoute = ({ routeRows, loadingMenu }) => {
//   const location = useLocation();
//   const { componentKey: paramKey } = useParams();
  
//   // 1. Check if it's a direct component key via /page/:key
//   // 2. Otherwise, check if the current URL path matches an authorized route
//   const matchingComponentKey = useMemo(() => {
//     if (paramKey && pageRegistry[paramKey]) return paramKey;

//     const currentPath = location.pathname.replace(/\/$/, "") || "/";
    
//     // We look for the path in the routeRows (either from state or sessionStorage)
//     const dbMatch = routeRows.find((r) => {
//       if (!r.path) return false;
//       const dbPath = (r.path.startsWith("/") ? r.path : `/${r.path}`).replace(/\/$/, "");
//       return dbPath === currentPath;
//     });

//     return dbMatch ? dbMatch.componentKey : null;
//   }, [location.pathname, paramKey, routeRows]);

//   const Component = matchingComponentKey ? pageRegistry[matchingComponentKey] : null;

//   // 3. Handle States:
//   // Still loading and nothing found yet? Show spinner.
//   if (loadingMenu && !Component) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[60vh]">
//         <LoadingSpinner />
//         <p className="mt-4 text-gray-400 animate-pulse font-medium">Authorizing URL...</p>
//       </div>
//     );
//   }

//   // Loaded and still nothing found? NOW we redirect.
//   if (!Component && !loadingMenu) {
//     return <Navigate to="/" replace />;
//   }

//   return Component ? (
//     <ErrorBoundary>
//       <Component key={`${matchingComponentKey}-view`} />
//     </ErrorBoundary>
//   ) : null;
// };

// /* -------------------- App Content -------------------- */
// const AppContent = () => {
//   const { user, loading, logout } = useAuth();
//   const navigate = useNavigate();

//   // Load from sessionStorage immediately so the Guard has data on the VERY FIRST render
//   const [menuItems, setMenuItems] = useState(() => {
//     const saved = sessionStorage.getItem("menuItems");
//     return saved ? JSON.parse(saved) : [];
//   });

//   const [routeRows, setRouteRows] = useState(() => {
//     const saved = sessionStorage.getItem("routeRows");
//     return saved ? JSON.parse(saved) : [];
//   });

//   const [loadingMenu, setLoadingMenu] = useState(false);
//   const [isSidebarVisible, setIsSidebarVisible] = useState(false);
//   const menuFetchedRef = useRef(null); 

//   const resetAppData = useCallback(() => {
//     setMenuItems([]);
//     setRouteRows([]);
//     setLoadingMenu(false);
//     setIsSidebarVisible(false);
//     menuFetchedRef.current = null;
//     sessionStorage.removeItem("menuItems");
//     sessionStorage.removeItem("routeRows");
//   }, []);

//   const handleLogout = async () => {
//     try {
//       resetAppData();
//       await logout();
//     } catch (err) {
//       console.error("Logout Error:", err);
//     } finally {
//       navigate("/", { replace: true });
//     }
//   };

//   useEffect(() => {
//     let alive = true;
//     const tenant = getTenant();

//     if (!user) {
//       resetAppData();
//       return;
//     }

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
//         console.error("Fetch Error:", e);
//       } finally {
//         if (alive) setLoadingMenu(false);
//       }
//     })();

//     return () => { alive = false; };
//   }, [user, loading, resetAppData, routeRows.length]);

//   if (loading) return <div className="fixed inset-0 flex items-center justify-center"><LoadingSpinner /></div>;

//   if (!user) {
//     return (
//       <Routes>
//         <Route path="/register" element={<Register />} />
//         <Route path="*" element={<Login />} />
//       </Routes>
//     );
//   }

//   return (
//     <div className="relative min-h-screen flex flex-col bg-gray-50 dark:bg-black">
//       <Navbar onMenuClick={() => setIsSidebarVisible(!isSidebarVisible)} onLogout={handleLogout} />
      
//       {isSidebarVisible && (
//         <div className="fixed inset-0 z-50 flex">
//           <Sidebar menuItems={menuItems} onNavigate={() => setIsSidebarVisible(false)} />
//           <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsSidebarVisible(false)} />
//         </div>
//       )}

//       <div className="flex-1 p-4 mt-12 overflow-y-auto">
//         <Routes>
//           {/* Static allowed paths */}
//           <Route path="/" element={<Dashboard1 user={user} />} />
//           <Route path="/page/:componentKey" element={<UniversalRegistryRoute routeRows={routeRows} loadingMenu={loadingMenu} />} />

//           {/* REMOVED THE .MAP() FROM HERE.
//              By removing the dynamic mapping, we prevent the "empty route" race condition.
//              Instead, we let the '*' catch-all below handle EVERYTHING.
//           */}

//           {/* THE FINAL CATCH-ALL: This handles copied URLs.
//             It will check 'routeRows' (which we filled from sessionStorage instantly).
//             If the URL exists in your allowed list, it renders.
//           */}
//           <Route 
//             path="*" 
//             element={<UniversalRegistryRoute routeRows={routeRows} loadingMenu={loadingMenu} />} 
//           />
//         </Routes>
//       </div>
//     </div>
//   );
// };

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
// import { toast } from "react-hot-toast";

// import { pageRegistry } from "./pageRegistry.jsx";
// import ErrorBoundary from "./NAYSA Cloud/Components/ErrorBoundary";
// import { fetchData, getTenant } from "./NAYSA Cloud/Configuration/BaseURL.jsx";
// import Navbar from "./NAYSA Cloud/Components/Navbar";
// import Sidebar from "./NAYSA Cloud/Components/Sidebar";
// import { ResetProvider } from "./NAYSA Cloud/Components/ResetContext";
// import Login from "./NAYSA Cloud/Authentication/Login.jsx";
// import Register from "./NAYSA Cloud/Authentication/Register.jsx";
// import Dashboard1 from "./NAYSA Cloud/Components/Dashboard1.jsx";
// import AuthProvider, { useAuth } from "./NAYSA Cloud/Authentication/AuthContext.jsx";
// import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

// const queryClient = new QueryClient();

// /* -------------------- The Gatekeeper (Guard) -------------------- */
// const UniversalRegistryRoute = ({ routeRows, loadingMenu }) => {
//   const location = useLocation();
//   const { componentKey: paramKey } = useParams();

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
//         <p className="mt-4 text-gray-400 animate-pulse font-medium">Authorizing...</p>
//       </div>
//     );
//   }

//   if (!loadingMenu && !Component) return <Navigate to="/" replace />;

//   return Component ? (
//     <ErrorBoundary>
//       <Component key={`${matchingComponentKey}-view`} />
//     </ErrorBoundary>
//   ) : null;
// };

// /* -------------------- App Content -------------------- */
// const AppContent = () => {
//   const { user, loading, logout } = useAuth();
//   const navigate = useNavigate();

//   // Load from sessionStorage immediately for new tab support
//   const [menuItems, setMenuItems] = useState(() => {
//     const saved = sessionStorage.getItem("menuItems");
//     return saved ? JSON.parse(saved) : [];
//   });

//   const [routeRows, setRouteRows] = useState(() => {
//     const saved = sessionStorage.getItem("routeRows");
//     return saved ? JSON.parse(saved) : [];
//   });

//   const [loadingMenu, setLoadingMenu] = useState(false);
//   const [isSidebarVisible, setIsSidebarVisible] = useState(false);
//   const menuFetchedRef = useRef(null); 

//   const resetAppData = useCallback(() => {
//     setMenuItems([]);
//     setRouteRows([]);
//     setLoadingMenu(false);
//     setIsSidebarVisible(false);
//     menuFetchedRef.current = null;
//     sessionStorage.removeItem("menuItems");
//     sessionStorage.removeItem("routeRows");
//   }, []);

//   const handleLogout = useCallback(async () => {
//     try {
//       resetAppData();
//       sessionStorage.clear();
//       // Important: Add any localStorage keys you use for Auth here
//       localStorage.removeItem("user"); 
      
//       await logout();
      
//       // Force a hard refresh to ensure a completely clean state
//       window.location.href = "/";
//     } catch (err) {
//       window.location.href = "/";
//     }
//   }, [logout, resetAppData]);

//   useEffect(() => {
//     let alive = true;
//     const tenant = getTenant();
//     if (!user) {
//       resetAppData();
//       return;
//     }

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
//         console.error("Fetch Error:", e);
//       } finally {
//         if (alive) setLoadingMenu(false);
//       }
//     })();
//     return () => { alive = false; };
//   }, [user, loading, resetAppData, routeRows.length]);

//   if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]"><LoadingSpinner /></div>;

//   if (!user) {
//     return (
//       <Routes>
//         <Route path="/register" element={<Register />} />
//         <Route path="*" element={<Login onSwitchToRegister={() => navigate("/register")} />} />
//       </Routes>
//     );
//   }

//   return (
//     <div className="relative min-h-screen flex flex-col bg-gray-50 dark:bg-black">
//       <Navbar onMenuClick={() => setIsSidebarVisible(!isSidebarVisible)} onLogout={handleLogout} />
      
//       {isSidebarVisible && (
//         <div className="fixed inset-0 z-50 flex">
//           <Sidebar menuItems={menuItems} onNavigate={() => setIsSidebarVisible(false)} />
//           <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsSidebarVisible(false)} />
//         </div>
//       )}

//       <div className="flex-1 p-4 overflow-y-auto">
//         <Routes>
//           <Route path="/" element={<Dashboard1 user={user} />} />
//           <Route path="/page/:componentKey" element={<UniversalRegistryRoute routeRows={routeRows} loadingMenu={loadingMenu} />} />
//           <Route path="*" element={<UniversalRegistryRoute routeRows={routeRows} loadingMenu={loadingMenu} />} />
//         </Routes>
//       </div>
//     </div>
//   );
// };

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
import { toast } from "react-hot-toast";

import { pageRegistry } from "./pageRegistry.jsx";
import ErrorBoundary from "./NAYSA Cloud/Components/ErrorBoundary";
import { fetchData, getTenant } from "./NAYSA Cloud/Configuration/BaseURL.jsx";
import Navbar from "./NAYSA Cloud/Components/Navbar";
import Sidebar from "./NAYSA Cloud/Components/Sidebar";
import { ResetProvider } from "./NAYSA Cloud/Components/ResetContext";
import Login from "./NAYSA Cloud/Authentication/Login.jsx";
import Register from "./NAYSA Cloud/Authentication/Register.jsx";
import Dashboard1 from "./NAYSA Cloud/Components/Dashboard1.jsx";
import ChangePassword from "./NAYSA Cloud/Authentication/ChangePassword.jsx"; // Ensure this import exists
import AuthProvider, { useAuth } from "./NAYSA Cloud/Authentication/AuthContext.jsx";
import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

const queryClient = new QueryClient();

/* -------------------- The Gatekeeper (Guard) -------------------- */
const UniversalRegistryRoute = ({ routeRows, loadingMenu }) => {
  const location = useLocation();
  const { componentKey: paramKey } = useParams();

  const matchingComponentKey = useMemo(() => {
    if (paramKey && pageRegistry[paramKey]) return paramKey;
    const currentPath = location.pathname.replace(/\/$/, "") || "/";
    const dbMatch = routeRows.find((r) => {
      if (!r.path) return false;
      const dbPath = (r.path.startsWith("/") ? r.path : `/${r.path}`).replace(/\/$/, "");
      return dbPath === currentPath;
    });
    return dbMatch ? dbMatch.componentKey : null;
  }, [location.pathname, paramKey, routeRows]);

  const Component = matchingComponentKey ? pageRegistry[matchingComponentKey] : null;

  if (loadingMenu && !Component) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-400 animate-pulse font-medium">Authorizing URL...</p>
      </div>
    );
  }

  if (!Component && !loadingMenu) {
    return <Navigate to="/" replace />;
  }

  return Component ? (
    <ErrorBoundary>
      <Component key={`${matchingComponentKey}-view`} />
    </ErrorBoundary>
  ) : null;
};

/* -------------------- App Content -------------------- */
const AppContent = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  // 1. SYNC INITIALIZATION: Load from sessionStorage immediately. 
  // This is what prevents the "New Tab" from redirecting to login.
  const [menuItems, setMenuItems] = useState(() => {
    const saved = sessionStorage.getItem("menuItems");
    return saved ? JSON.parse(saved) : [];
  });

  const [routeRows, setRouteRows] = useState(() => {
    const saved = sessionStorage.getItem("routeRows");
    return saved ? JSON.parse(saved) : [];
  });

  const [loadingMenu, setLoadingMenu] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const menuFetchedRef = useRef(null); 

  const resetAppData = useCallback(() => {
    setMenuItems([]);
    setRouteRows([]);
    setLoadingMenu(false);
    setIsSidebarVisible(false);
    menuFetchedRef.current = null;
    sessionStorage.removeItem("menuItems");
    sessionStorage.removeItem("routeRows");
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      resetAppData();
      await logout();
      window.location.href = "/"; // Nuclear Reset to guarantee clean state
    } catch (err) {
      window.location.href = "/";
    }
  }, [logout, resetAppData]);

  useEffect(() => {
    let alive = true;
    const tenant = getTenant();
    if (!user) {
      resetAppData();
      return;
    }

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
        console.error("Fetch Error:", e);
      } finally {
        if (alive) setLoadingMenu(false);
      }
    })();
    return () => { alive = false; };
  }, [user, loading, resetAppData, routeRows.length]);

  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]"><LoadingSpinner /></div>;

  /* ---------------------------------------------------------
     GUEST ACCESS (Public Routes & Login)
     Placed before the protected return to allow access without user session.
  --------------------------------------------------------- */
  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<Register />} />
        {/* PUBLIC EXEMPTION: Change password link works even if logged out */}
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="*" element={<Login onSwitchToRegister={() => navigate("/register")} />} />
      </Routes>
    );
  }

  /* ---------------------------------------------------------
     PROTECTED APP LAYOUT (User Session Active)
  --------------------------------------------------------- */
  return (
    <div className="relative min-h-screen flex flex-col bg-gray-50 dark:bg-black">
      <Navbar onMenuClick={() => setIsSidebarVisible(!isSidebarVisible)} onLogout={handleLogout} />
      
      {isSidebarVisible && (
        <div className="fixed inset-0 z-50 flex">
          <Sidebar menuItems={menuItems} onNavigate={() => setIsSidebarVisible(false)} />
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsSidebarVisible(false)} />
        </div>
      )}

      <div className="flex-1 p-4 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard1 user={user} />} />
          
          {/* Allow Change Password while logged in as well */}
          <Route path="/change-password" element={<ChangePassword />} />

          <Route 
            path="/page/:componentKey" 
            element={<UniversalRegistryRoute routeRows={routeRows} loadingMenu={loadingMenu} />} 
          />

          {/* Catch-all for pasted URLs: Uses the instantly-available routeRows from sessionStorage */}
          <Route 
            path="*" 
            element={<UniversalRegistryRoute routeRows={routeRows} loadingMenu={loadingMenu} />} 
          />
        </Routes>
      </div>
    </div>
  );
};

/* -------------------- App Root -------------------- */
const App = () => (
  <Router>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ResetProvider>
          <AppContent />
        </ResetProvider>
      </AuthProvider>
    </QueryClientProvider>
  </Router>
);

export default App;









































































































































































































