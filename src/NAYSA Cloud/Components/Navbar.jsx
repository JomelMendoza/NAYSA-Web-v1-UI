// import React, { useState, useEffect } from "react";
// import { Bell, BookOpen, Menu } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { FiSun, FiMoon } from 'react-icons/fi';
// import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
// import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";


// const Navbar = ({ onMenuClick ,onLogout}) => {
//     const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//     const navigate = useNavigate();
//     const [isDark, setIsDark] = useState(false);
//     const { user,logout  } = useAuth();


//     useEffect(() => {
//         if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
//             document.documentElement.classList.add('dark');
//             setIsDark(true);
//         } else {
//             document.documentElement.classList.remove('dark');
//             localStorage.theme = 'light'; // Explicitly set to light if not dark
//             setIsDark(false);
//         }
//     }, []);

//     const toggleDarkMode = () => {
//         const newMode = !isDark;
//         setIsDark(newMode);
//         if (newMode) {
//             document.documentElement.classList.add('dark');
//             localStorage.theme = 'dark';
//         } else {
//             document.documentElement.classList.remove('dark');
//             localStorage.theme = 'light';
//         }
//     };

//     const toggleDropdown = () => {
//         setIsDropdownOpen(prev => !prev);
//     };

//      const handleLogoutClick = async () => {
//         setIsDropdownOpen(false); // Close the dropdown immediately
//        if (onLogout) {
//             await onLogout();
//         }
//     };

//     return (
//         <div className="fixed top-0 left-0 w-full z-40 dark:bg-gray-900">
//             {/* Top Blue Bar */}
//             {/* <div className="flex justify-center items-center bg-blue-900 text-white h-[30px] dark:bg-gray-950">
//                 <span className="font-bold text-lg text-center tracking-wide">NAYSA-SOLUTIONS INC.</span>
//             </div> */}

//             {/* Main Navbar Content */}
//             <div className="w-full bg-white h-12 flex items-center justify-between px-4 dark:bg-gray-800 dark:text-white">
//                 {/* Left side: Menu, Logo, and Financials */}
//                 <div className="flex items-center space-x-1 text-blue-900 font-extrabold dark:text-gray-100">
//                     <Menu className="text-blue-900 cursor-pointer dark:text-white" onClick={onMenuClick} />
//                     <div>
//                         <img
//                             src="naysa_logo.png" // Ensure this path is correct if different from image_951ea3.png
//                             className="w-[80px] h-[50px] mb-1 object-contain"
//                             alt="Naysa Logo"
//                         />
//                     </div>
//                     <span className="hidden sm:inline whitespace-nowrap">Financials</span>
//                 </div>

//                 {/* Centered Company Name */}
//                 {/* This div uses flex-grow to take available space and justify-center to center its content */}
//                 <div className="flex-grow flex justify-center">
//                     <span className="font-bold text-xs sm:text-2xl text-blue-900 dark:text-white whitespace-nowrap">
//                         NAYSA-SOLUTIONS INC.
//                     </span>
//                 </div>

//                 {/* Right side */}
//                 <div className="flex items-center space-x-2 sm:space-x-5"> {/* Adjusted space-x */}

//                     {/* Dark Mode Toggle */}
//                     <button
//                         onClick={toggleDarkMode}
//                         className="p-1 sm:p-2 rounded-full bg-blue-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         aria-label="Toggle dark mode"
//                     >
//                         {/* Corrected: Using Tailwind CSS classes for responsive sizing */}
//                         {isDark ? <FiSun className="size-4 sm:size-5" /> : <FiMoon className="size-4 sm:size-5" />}
//                     </button>

//                     {/* Adjusted icon sizes */}
//                     <BookOpen className="text-blue-900 w-4 h-4 sm:w-5 sm:h-5 cursor-pointer dark:text-white hover:text-blue-700 transition-colors" />

//                     <div className="relative">
//                         {/* Adjusted icon sizes */}
//                         <Bell className="text-blue-900 w-4 h-4 sm:w-5 sm:h-5 cursor-pointer dark:text-white hover:text-blue-700 transition-colors" />
//                         {/* Notification dot size can remain small or adjust as needed */}
//                         <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full animate-pulse" />
//                     </div>

//                     <div
//                         className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full overflow-hidden shadow-md cursor-pointer ring-2 ring-transparent hover:ring-blue-500 transition-shadow duration-200"
//                         onClick={toggleDropdown}
//                         aria-expanded={isDropdownOpen}
//                         aria-haspopup="true"
//                     >
//                         <img
//                             src="3135715.png" // Ensure this path is correct
//                             alt="Profile"
//                             className="w-full h-full object-cover"
//                         />
//                     </div>

//                     {isDropdownOpen && (
//                         <div className="absolute right-4 top-full mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50 dark:bg-gray-700 dark:text-gray-200 animate-fade-in-down">
//                             <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-150">
//                                 Account Management
//                             </button>
//                             <button
//                                 className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left dark:hover:bg-gray-600 transition-colors duration-150"
//                                  onClick={handleLogoutClick} 
//                             >
//                                 Logout
//                             </button>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             <style jsx="true">{`
//                 @keyframes fade-in-down {
//                     from { opacity: 0; transform: translateY(-10px); }
//                     to { opacity: 1; transform: translateY(0); }
//                 }
//                 .animate-fade-in-down {
//                     animation: fade-in-down 0.2s ease-out forwards;
//                 }
//             `}</style>
//         </div>
//     );
// };

// export default Navbar;


import React, { useState, useEffect } from "react";
import { Bell, BookOpen, Menu } from "lucide-react";
import { FiSun, FiMoon } from 'react-icons/fi';
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

const Navbar = ({ onMenuClick, onLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
            setIsDark(false);
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !isDark;
        setIsDark(newMode);
        document.documentElement.classList.toggle('dark', newMode);
        localStorage.theme = newMode ? 'dark' : 'light';
    };

    // This handler calls the "Smart Logout" in AppContent
    const handleLogoutClick = async () => {
        setIsDropdownOpen(false);
        if (onLogout) {
            await onLogout();
        }
    };

    return (
        <div className="fixed top-0 left-0 w-full z-40 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
            <div className="w-full h-12 flex items-center justify-between px-4 dark:text-white text-sm sm:text-base">
                <div className="flex items-center space-x-2 text-blue-900 font-extrabold dark:text-gray-100">
                    <Menu className="cursor-pointer" onClick={onMenuClick} />
                    <img src="naysa_logo.png" className="w-[70px] h-[35px] object-contain" alt="Logo" />
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
                            <img src="3135715.png" alt="User" className="w-full h-full object-cover" />
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