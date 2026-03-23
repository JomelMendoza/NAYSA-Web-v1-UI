
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


import React, { useState, useEffect } from "react";
import { Bell, BookOpen, Menu } from "lucide-react";
import { FiSun, FiMoon } from "react-icons/fi";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import { useSwalDeleteConfirm } from "../Global/behavior";

const Navbar = ({ onMenuClick, onLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const cachedTheme = localStorage.getItem('theme');
        if (cachedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
            if (!cachedTheme) localStorage.setItem('theme', 'light');
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !isDark;
        setIsDark(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
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

    return (
        <div className="fixed top-0 left-0 w-full z-40 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
            <div className="w-full h-12 flex items-center justify-between px-4 dark:text-white text-sm sm:text-base">
                
                <div className="flex items-center space-x-2 text-blue-900 font-extrabold dark:text-gray-100">
                    <Menu className="cursor-pointer" onClick={onMenuClick} />
                    <img src="/naysa_logo.png" className="w-[70px] h-[35px] object-contain" alt="Logo" />
                    <span className="hidden md:inline">Financials</span>
                </div>

                <div className="flex-grow flex justify-center">
                    <span className="font-bold text-xs sm:text-lg text-blue-900 dark:text-white whitespace-nowrap uppercase tracking-tighter sm:tracking-normal">
                        NAYSA-SOLUTIONS INC.
                    </span>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-4">
                    <button onClick={toggleDarkMode} className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
                    </button>

                    <div className="relative">
                        <div 
                            className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <img src="/3135715.png" alt="User" className="w-full h-full object-cover" />
                        </div>

                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-2xl py-2 border dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-2 text-[10px] text-gray-400 border-b dark:border-gray-700 mb-1 truncate">
                                    {user?.USER_CODE || 'User'}
                                </div>
                                <button className="block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700">Account Settings</button>
                                <button 
                                    onClick={handleLogoutClick}
                                    className="block px-4 py-2 text-sm text-red-600 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;