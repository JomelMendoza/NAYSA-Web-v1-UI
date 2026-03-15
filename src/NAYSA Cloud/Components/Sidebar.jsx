import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchData } from "@/NAYSA Cloud/Configuration/BaseURL";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import {
  FiChevronDown, FiChevronRight, FiHome, FiBook, FiCreditCard,
  FiDollarSign, FiGlobe, FiShield, FiSearch, FiSun, FiMoon,
  FiBox, FiShoppingCart
} from "react-icons/fi";

const iconMap = {
  "Dashboard": FiHome,
  "General Ledger": FiBook,
  "Accounts Payable": FiCreditCard,
  "Accounts Receivable": FiDollarSign,
  "Global Reference": FiGlobe,
  "Application Security": FiShield,
  "Purchasing": FiShoppingCart,
  "Inventory": FiBox
};

// --- Helper Functions ---
const highlightText = (text, searchTerm) => {
  if (!searchTerm) return text;
  const safe = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${safe})`, "gi");
  return String(text).split(regex).map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 rounded px-1">{part}</mark> : part
  );
};

const anyDescendantMatches = (node, lcTerm) => {
  if (!node) return false;
  if ((node.name || "").toLowerCase().includes(lcTerm)) return true;
  return Array.isArray(node.subMenu) ? node.subMenu.some((child) => anyDescendantMatches(child, lcTerm)) : false;
};

// --- MenuItem Component ---
const MenuItem = ({ item, level = 0, searchTerm, onNavigate, onOpenModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const hasSubMenu = Array.isArray(item?.subMenu) && item.subMenu.length > 0;
  const Icon = level === 0 ? iconMap[item?.name] : null;
  const ChevronIcon = hasSubMenu ? (isOpen ? FiChevronDown : FiChevronRight) : null;
  const isPost = /finalize/i.test(item?.name ?? "");

  useEffect(() => {
    const lc = (searchTerm || "").toLowerCase();
    if (!lc) { setIsVisible(true); setIsOpen(false); return; }
    const matches = (item?.name || "").toLowerCase().includes(lc);
    const descendant = hasSubMenu && anyDescendantMatches(item, lc);
    setIsVisible(matches || descendant);
    if (descendant) setIsOpen(true);
  }, [searchTerm, item, hasSubMenu]);

  if (!isVisible) return null;

  const rowBase = `flex items-center justify-between py-2 px-3 rounded-xl transition-all duration-200 group hover:scale-[1.02] ${level === 0 ? "pl-3" : level === 1 ? "pl-8" : "pl-12"}`;
  const label = (
    <div className="flex items-center space-x-3 flex-1 min-w-0">
      {level === 0 && Icon && <Icon className={`text-xl ${isOpen ? "text-blue-600" : "text-gray-500"}`} />}
      <span className="truncate text-sm">{highlightText(item?.name || "", searchTerm)}</span>
    </div>
  );

  if (hasSubMenu) {
    return (
      <li>
        <div className={rowBase + " cursor-pointer"} onClick={() => setIsOpen(!isOpen)}>
          {label}
          {ChevronIcon && <ChevronIcon className="text-gray-400" />}
        </div>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[2000px]" : "max-h-0"}`}>
          <ul className="mt-1 space-y-1">
            {item.subMenu.map((sub, i) => (
              <MenuItem key={i} item={sub} level={level + 1} searchTerm={searchTerm} onNavigate={onNavigate} onOpenModal={onOpenModal} />
            ))}
          </ul>
        </div>
      </li>
    );
  }

  return (
    <li>
      <NavLink to={item?.path} onClick={() => onNavigate?.()} className={rowBase}>
        {label}
      </NavLink>
    </li>
  );
};

// --- Main Sidebar ---
const Sidebar = ({ menuItems = null, onNavigate, onOpenModal }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user } = useAuth();

  // TanStack Query logic
  const { data, isLoading, error } = useQuery({
    queryKey: ['sidebarMenu', user?.USER_CODE],
    queryFn: () => fetchData("menu-items", { USER_CODE: user?.USER_CODE }),
    enabled: !!user?.USER_CODE && (!menuItems || menuItems.length === 0),
    staleTime: 1000 * 60 * 5,
  });

  const items = menuItems && menuItems.length > 0 ? menuItems : (data?.menuItems ?? []);

  return (
    <div className="sidebar flex flex-col h-screen w-80 bg-white dark:bg-gray-900 shadow-2xl">
      <div className="p-4 flex items-center justify-between border-b">
        <img
            src="/naysa_logo.png"
            className="w-[70px] h-[50px] mb-1 object-contain"
            alt="Naysa Logo"
          />
        <span className="font-bold mr-[125px] text-blue-800">Financials</span>
        <button onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <FiSun /> : <FiMoon />}</button>
      </div>

      <div className="p-4">
        <input 
          placeholder="Search menu..." 
          className="w-full p-2 border rounded" 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {isLoading ? <div>Loading...</div> : error ? <div>Error loading menu</div> : (
          <ul>
            {items.map((item, idx) => (
              <MenuItem key={idx} item={item} searchTerm={searchTerm} onNavigate={onNavigate} onOpenModal={onOpenModal} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Sidebar;