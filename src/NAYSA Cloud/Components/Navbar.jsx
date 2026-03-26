
// import React, { useState, useEffect } from "react";
// import { Bell, BookOpen, Menu } from "lucide-react";
// import { FiSun, FiMoon } from 'react-icons/fi';
// import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

// const Navbar = ({ onMenuClick, onLogout }) => {
//     const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//     const [isDark, setIsDark] = useState(false);
//     const { user } = useAuth();

//     useEffect(() => {
//         if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
//             document.documentElement.classList.add('dark');
//             setIsDark(true);
//         } else {
//             document.documentElement.classList.remove('dark');
//             localStorage.theme = 'light';
//             setIsDark(false);
//         }
//     }, []);

//     const toggleDarkMode = () => {
//         const newMode = !isDark;
//         setIsDark(newMode);
//         document.documentElement.classList.toggle('dark', newMode);
//         localStorage.theme = newMode ? 'dark' : 'light';
//     };

//     // This handler calls the "Smart Logout" in AppContent
//     const handleLogoutClick = async () => {
//         setIsDropdownOpen(false);
//         if (onLogout) {
//             await onLogout();
//         }
//     };

//     return (
//         <div className="fixed top-0 left-0 w-full z-40 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
//             <div className="w-full h-12 flex items-center justify-between px-4 dark:text-white text-sm sm:text-base">
//                 <div className="flex items-center space-x-2 text-blue-900 font-extrabold dark:text-gray-100">
//                     <Menu className="cursor-pointer" onClick={onMenuClick} />
//                     <img src="naysa_logo.png" className="w-[70px] h-[35px] object-contain" alt="Logo" />
//                     <span className="hidden md:inline">Financials</span>
//                 </div>

//                 <div className="flex-grow flex justify-center">
//                     <span className="font-bold text-xs sm:text-lg text-blue-900 dark:text-white whitespace-nowrap uppercase tracking-tighter sm:tracking-normal">
//                         NAYSA-SOLUTIONS INC.
//                     </span>
//                 </div>

//                 <div className="flex items-center space-x-2 sm:space-x-4">
//                     <button onClick={toggleDarkMode} className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
//                         {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
//                     </button>

//                     <div className="relative">
//                         <div 
//                             className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all"
//                             onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                         >
//                             <img src="3135715.png" alt="User" className="w-full h-full object-cover" />
//                         </div>

//                         {isDropdownOpen && (
//                             <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-2xl py-2 border dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
//                                 <div className="px-4 py-2 text-[10px] text-gray-400 border-b dark:border-gray-700 mb-1 truncate">
//                                     {user?.USER_CODE || 'User'}
//                                 </div>
//                                 <button className="block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700">Account Settings</button>
//                                 <button 
//                                     onClick={handleLogoutClick}
//                                     className="block px-4 py-2 text-sm text-red-600 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
//                                 >
//                                     Logout
//                                 </button>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Navbar;

// ORIGINAL
// import React, { useState, useEffect } from "react";
// import { Bell, BookOpen, Menu } from "lucide-react";
// import { FiSun, FiMoon } from 'react-icons/fi';
// import Swal from "sweetalert2"; 
// import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";


// const Navbar = ({ onMenuClick, onLogout }) => {
//     const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//     const [isDark, setIsDark] = useState(false);
//     const { user } = useAuth();

//     useEffect(() => {
//         const cachedTheme = localStorage.getItem('theme');
//         if (cachedTheme === 'dark') {
//             document.documentElement.classList.add('dark');
//             setIsDark(true);
//         } else {
//             document.documentElement.classList.remove('dark');
//             setIsDark(false);
//             if (!cachedTheme) localStorage.setItem('theme', 'light');
//         }
//     }, []);

//     const toggleDarkMode = () => {
//         const newMode = !isDark;
//         setIsDark(newMode);
//         if (newMode) {
//             document.documentElement.classList.add('dark');
//             localStorage.setItem('theme', 'dark');
//         } else {
//             document.documentElement.classList.remove('dark');
//             localStorage.setItem('theme', 'light');
//         }
//     };

//     const handleLogoutClick = async () => {
//         setIsDropdownOpen(false);

//         let timerInterval;
//         Swal.fire({
//             title: "Confirm Logout",
//             html: "Logging out automatically in <b>5</b> seconds...",
//             icon: "warning",
//             timer: 10000,
//             timerProgressBar: true,
//             showCancelButton: true,
//             confirmButtonColor: "#3085d6",
//             cancelButtonColor: "#d33",
//             confirmButtonText: "Yes, logout!",
//             cancelButtonText: "No",
//             // Making buttons equal width via custom class
//             customClass: {
//                 confirmButton: 'min-w-[120px]',
//                 cancelButton: 'min-w-[120px]'
//             },
//             didOpen: () => {
//                 const b = Swal.getHtmlContainer().querySelector('b');
//                 timerInterval = setInterval(() => {
//                     const secondsLeft = Math.ceil(Swal.getTimerLeft() / 1000);
//                     b.textContent = secondsLeft;
//                 }, 100);
//             },
//             willClose: () => {
//                 clearInterval(timerInterval);
//             }
//         }).then(async (result) => {
//             /* LOGIC: 
//                1. result.isConfirmed -> User clicked "Yes"
//                2. result.dismiss === Swal.DismissReason.timer -> 5 seconds passed without clicking "No"
//             */
//             if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
//                 if (onLogout) {
//                     await onLogout();
//                     window.location.href = "/"; 
//                 }
//             } else if (result.dismiss === Swal.DismissReason.cancel) {
//                 // User explicitly clicked "No"
//                 console.log("Logout cancelled by user.");
//             }
//         });
//     };

//     return (
//         <div className="fixed top-0 left-0 w-full z-40 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
//             <div className="w-full h-12 flex items-center justify-between px-4 dark:text-white text-sm sm:text-base">

//                 <div className="flex items-center space-x-2 text-blue-900 font-extrabold dark:text-gray-100">
//                     <Menu className="cursor-pointer" onClick={onMenuClick} />
//                     <img src="/naysa_logo.png" className="w-[70px] h-[35px] object-contain" alt="Logo" />
//                     <span className="hidden md:inline">Financials</span>
//                 </div>

//                 <div className="flex-grow flex justify-center">
//                     <span className="font-bold text-xs sm:text-lg text-blue-900 dark:text-white whitespace-nowrap uppercase tracking-tighter sm:tracking-normal">
//                         NAYSA-SOLUTIONS INC.
//                     </span>
//                 </div>

//                 <div className="flex items-center space-x-2 sm:space-x-4">
//                     <button onClick={toggleDarkMode} className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
//                         {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
//                     </button>

//                     <div className="relative">
//                         <div 
//                             className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all"
//                             onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                         >
//                             <img src="/3135715.png" alt="User" className="w-full h-full object-cover" />
//                         </div>

//                         {isDropdownOpen && (
//                             <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-2xl py-2 border dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
//                                 <div className="px-4 py-2 text-[10px] text-gray-400 border-b dark:border-gray-700 mb-1 truncate">
//                                     {user?.USER_CODE || 'User'}
//                                 </div>
//                                 <button className="block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700">Account Settings</button>
//                                 <button 
//                                     onClick={handleLogoutClick}
//                                     className="block px-4 py-2 text-sm text-red-600 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
//                                 >
//                                     Logout
//                                 </button>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Navbar;

import React, { useState, useEffect, useRef, useCallback } from "react"; // Added useCallback
import {
    Menu,
    LogOut,
    Fingerprint,
    KeyRound,
    ChevronDown,
    Sun,
    Moon,
    ShieldCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { FiSun, FiMoon } from "react-icons/fi";
import { useSwalDeleteConfirm } from "../Global/behavior";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

const Navbar = ({
    onMenuClick,
    onLogout,
    onBiometricClick,
    onUpdateClick,
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const dropdownRef = useRef(null);
    const { user } = useAuth();

    // --- LOGIC START ---
    
    // This function handles the logic of determining if the URL is absolute or relative
    const handleBiometricAction = useCallback((row) => {
        // Check if pathUrl is already a full URL (starts with http)
        const isAbsolute = row.pathUrl.startsWith("http");

        // If absolute, use it; otherwise, join it with the current domain
        const url = isAbsolute
            ? row.pathUrl
            : `${window.location.origin}${row.pathUrl}`;

        window.open(url, "_blank", "noopener,noreferrer");
        
        // Also call the prop function in case the parent needs to know
        onBiometricClick?.(row);
    }, [onBiometricClick]);

    const biometricRow = {
        pathUrl: "/security-settings/biometric"
        // If you want to force the live site even on localhost, use:
        // pathUrl: "https://naysafinancials.com/security-settings/biometric"
    };

    // --- LOGIC END ---

    useEffect(() => {
        const cachedTheme = localStorage.getItem("theme");
        if (cachedTheme === "dark") {
            document.documentElement.classList.add("dark");
            setIsDark(true);
        } else {
            document.documentElement.classList.remove("dark");
            setIsDark(false);
            if (!cachedTheme) localStorage.setItem("theme", "light");
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleDarkMode = () => {
        const newMode = !isDark;
        setIsDark(newMode);
        if (newMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    const handleLogoutClick = async () => {
        setIsDropdownOpen(false);
        try {
            const result = await useSwalDeleteConfirm(
                "Confirm Logout",
                "Are you sure you want to logout?",
                "Yes, logout!"
            );
            if (result?.isConfirmed && onLogout) {
                await onLogout();
            }
        } catch (error) {
            console.error("Logout confirmation failed:", error);
        }
    };

    const dropdownItemClass =
        "group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors duration-150";

    const dropdownIconWrapClass =
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors dark:bg-slate-700 dark:text-slate-200";

    return (
        <div className="fixed top-0 left-0 z-40 w-full border-b bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="w-full h-12 flex items-center justify-between px-4 dark:text-white text-sm sm:text-base">
                {/* Left */}
                <div className="flex items-center space-x-2 text-blue-900 font-extrabold dark:text-gray-100">
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        onClick={onMenuClick}
                        className="rounded-md p-1 outline-none hover:bg-blue-50 dark:hover:bg-gray-800"
                    >
                        <Menu className="cursor-pointer" />
                    </motion.button>
                    <img src="/naysa_logo.png" className="w-[70px] h-[35px] object-contain" alt="Logo" />
                    <span className="hidden md:inline">Financials</span>
                </div>

                {/* Center */}
                <div className="flex-grow flex justify-center">
                    <span className="font-bold text-xs sm:text-lg text-blue-900 dark:text-white whitespace-nowrap uppercase tracking-tighter sm:tracking-normal">
                        NAYSA-SOLUTIONS INC.
                    </span>
                </div>

                {/* Right */}
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={toggleDarkMode}
                        className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
                    </motion.button>

                    <div className="relative" ref={dropdownRef}>
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setIsDropdownOpen((prev) => !prev)}
                            className="flex items-center gap-2 rounded-full border border-transparent px-1 py-1 hover:bg-slate-100 dark:hover:bg-gray-800"
                        >
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-500 cursor-pointer transition-all">
                                <img src="/3135715.png" alt="User" className="w-full h-full object-cover" />
                            </div>
                            <ChevronDown className={`hidden sm:block h-4 w-4 text-slate-500 transition-transform duration-200 dark:text-slate-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
                        </motion.button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                    transition={{ duration: 0.18, ease: "easeOut" }}
                                    className="absolute right-0 top-full mt-3 w-[320px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-gray-800"
                                >
                                    <div className="px-5 pt-5 pb-4">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="mb-3 h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md dark:border-gray-800 dark:bg-slate-700">
                                                <img src="/3135715.png" alt="User" className="h-full w-full object-cover" />
                                            </div>
                                            <div className="max-w-full truncate text-[15px] font-semibold text-slate-800 dark:text-white">
                                                {user?.USER_NAME || "User"}
                                            </div>
                                            <div className="mt-1 max-w-full truncate text-sm text-slate-500 dark:text-slate-400">
                                                {user?.EMAIL_ADD || "No email available"}
                                            </div>
                                            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300">
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                {user?.USER_CODE || "User Account"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-200 dark:border-slate-700" />

                                    <div className="p-2">
                                        {/* BIOMETRIC BUTTON */}
                                        <motion.button
                                            whileHover={{ x: 2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                handleBiometricAction(biometricRow); // Using the logic here
                                            }}
                                            className={`${dropdownItemClass} hover:bg-slate-100 dark:hover:bg-slate-700/70`}
                                        >
                                            <div className={dropdownIconWrapClass}>
                                                <Fingerprint className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                    Biometrics Settings
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    Manage biometric login and verification
                                                </div>
                                            </div>
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ x: 2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                onUpdateClick?.();
                                            }}
                                            className={`${dropdownItemClass} hover:bg-slate-100 dark:hover:bg-slate-700/70`}
                                        >
                                            <div className={dropdownIconWrapClass}>
                                                <KeyRound className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                    Update Account
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    Edit profile and change password
                                                </div>
                                            </div>
                                        </motion.button>
                                    </div>

                                    <div className="mx-2 border-t border-slate-200 dark:border-slate-700" />

                                    <div className="p-2">
                                        <motion.button
                                            whileHover={{ x: 2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleLogoutClick}
                                            className={`${dropdownItemClass} hover:bg-red-50 dark:hover:bg-red-500/10`}
                                        >
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                                <LogOut className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-red-600 dark:text-red-400">
                                                    Logout
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    Sign out from this session
                                                </div>
                                            </div>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;