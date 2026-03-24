

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  apiClient,
  ensureCsrf,
  setTenant,
  getTenant,
  markAuthReady,
  pingRemoteCheck,
  pingExpiryCheck,
  getLastAuthApiTouch,
  fetchData,
  bioLoginVerifyPasswordless,
} from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import Swal from "sweetalert2";

import {
  useTopUserRow,
  useTopCompanyRow,
  useTopDocDropDownAll,
} from "@/NAYSA Cloud/Global/top1RefTable";

import {
  useSwalSuccessAlert,
} from "@/NAYSA Cloud/Global/behavior.jsx";


const AuthContext = createContext(null);

const isBioAuthInProgress = () => {
  try {
    return sessionStorage.getItem("bioAuthInProgress") === "1";
  } catch {
    return false;
  }
};

/* -------- Timing (VITE_SESSION_LIFETIME in MINUTES) -------- */
const IDLE_LIMIT_MINUTES =
  typeof import.meta.env.VITE_SESSION_LIFETIME !== "undefined"
    ? parseInt(import.meta.env.VITE_SESSION_LIFETIME, 10)
    : 60;
const IDLE_LIMIT_MS = IDLE_LIMIT_MINUTES * 60 * 1000;

/* -------- Heartbeats -------- */
const REMOTE_HEARTBEAT_MS = Math.max(
  1000,
  (Number(import.meta.env.VITE_REMOTE_HEARTBEAT_SECONDS ?? 15) | 0) * 1000
);
const EXPIRE_HEARTBEAT_MS = Math.max(60_000, IDLE_LIMIT_MINUTES * 60_000);

/* ---------------- Leader heartbeat across tabs ---------------- */
const AUTH_BC_NAME = "auth";
const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const HB_LEASE_KEY = "naysa_hb_leader";
const HB_LEASE_MS = Math.max(EXPIRE_HEARTBEAT_MS * 1.25, 45_000);

function readLease() {
  try {
    return JSON.parse(localStorage.getItem(HB_LEASE_KEY) || "null");
  } catch {
    return null;
  }
}

function tryAcquireLeader() {
  const now = Date.now();
  const cur = readLease();
  if (!cur || !cur.id || cur.expiresAt <= now) {
    localStorage.setItem(
      HB_LEASE_KEY,
      JSON.stringify({ id: TAB_ID, expiresAt: now + HB_LEASE_MS })
    );
    return true;
  }
  return cur.id === TAB_ID;
}

function renewLeader() {
  const now = Date.now();
  localStorage.setItem(
    HB_LEASE_KEY,
    JSON.stringify({ id: TAB_ID, expiresAt: now + HB_LEASE_MS })
  );
}

/* ---------------- Local user cache ---------------- */
const USER_CACHE_KEY = "naysa_user";
const cacheUser = (u) => {
  try {
    if (u) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch {}
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [refsLoading, setRefsLoading] = useState(false);
  const [refsLoaded, setRefsLoaded] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [allDropDown, setallDropDown] = useState(null);
  const [currentUserRow, setCurrentUserRow] = useState(null);
  const [currentMenu, setCurrentMenu] = useState(null);

  const logoutLatchRef = useRef(false);
  const pendingLogoutNoticeRef = useRef(false);
  const lastActivity = useRef(Date.now());
  const idleTimer = useRef(null);
  const remoteHbTimer = useRef(null);
  const expireHbTimer = useRef(null);
  const bcRef = useRef(null);

  const hardLogout = useCallback(() => {
    setUser(null);

    try {
      localStorage.removeItem("naysa_user");
      sessionStorage.removeItem("menuItems");
      sessionStorage.removeItem("routeRows");
    } catch {}

    cacheUser(null);
    markAuthReady(false);

    setCompanyInfo(null);
    setallDropDown(null);
    setCurrentUserRow(null);
    setCurrentMenu(null);
    setRefsLoaded(false);
    setRefsLoading(false);

    lastActivity.current = Date.now();

    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (remoteHbTimer.current) clearTimeout(remoteHbTimer.current);
    if (expireHbTimer.current) clearTimeout(expireHbTimer.current);
  }, []);

  const serverLogout = useCallback(
    async (reason = "manual") => {
      if (isBioAuthInProgress()) return;
      if (logoutLatchRef.current) return;
      logoutLatchRef.current = true;

      const msg =
        reason === "idle"
          ? {
              icon: "warning",
              title: "Signed out for inactivity",
              text: "You were inactive and have been signed out. Please sign in again.",
            }
          : reason === "expired"
          ? {
              icon: "warning",
              title: "Session expired",
              text: "Your session expired. Please sign in again.",
            }
          : reason === "remote"
          ? {
              icon: "info",
              title: "Signed out",
              text: "Your account was signed in elsewhere or the server ended the session.",
            }
          : {
              icon: "warning",
              title: "Session ended",
              text: "Your session has ended. Please sign in again.",
            };

      try {
        await apiClient.post("/logout", null, {
          headers: { "X-Skip-Logout-Broadcast": "1" },
        });
      } catch (err) {
        console.warn("Logout API failed, continuing local logout:", err);
      }

      try {
        bcRef.current?.postMessage({ type: "logout", reason });
      } catch {}

      hardLogout();

      if (document.visibilityState === "visible") {
        try {

          useSwalSuccessAlert(msg.title,msg.text)
          // await Swal.fire({
          //   ...msg,
          //   timer: 3000,
          //   timerProgressBar: true,
          //   showConfirmButton: false,
          //   allowOutsideClick: false,
          //   allowEscapeKey: false,
          // });

        } catch {}
      } else {
        pendingLogoutNoticeRef.current = true;
      }
    },
    [hardLogout]
  );

  const logout = useCallback(async () => {
    await serverLogout("manual");
  }, [serverLogout]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel(AUTH_BC_NAME);
    bcRef.current = bc;

    bc.onmessage = async (e) => {
      if (!e?.data?.type) return;

      if (e.data.type === "logout") {
        if (isBioAuthInProgress()) return;
        if (logoutLatchRef.current) return;
        logoutLatchRef.current = true;

        const reason = e.data.reason;
        const showPopup = document.visibilityState === "visible";

        if (tryAcquireLeader()) {
          try {
            await apiClient.post("/logout", null, {
              headers: { "X-Skip-Logout-Broadcast": "1" },
            });
          } catch {}
          renewLeader();
        }

        hardLogout();

        const msg =
          reason === "idle"
            ? {
                icon: "warning",
                title: "Signed out for inactivity",
                text: "You were inactive and have been signed out. Please sign in again.",
              }
            : reason === "expired"
            ? {
                icon: "warning",
                title: "Session expired",
                text: "Your session expired. Please sign in again.",
              }
            : reason === "remote"
            ? {
                icon: "info",
                title: "Signed out",
                text: "Your account was signed in elsewhere or the server ended the session.",
              }
            : {
                icon: "warning",
                title: "Session ended",
                text: "Your session has ended. Please sign in again.",
              };

        if (showPopup) {
          try {
            await Swal.fire({
              ...msg,
              timer: 3000,
              timerProgressBar: true,
              showConfirmButton: false,
              allowOutsideClick: false,
              allowEscapeKey: false,
            });
          } catch {}
        } else {
          pendingLogoutNoticeRef.current = true;
        }

        return;
      }

      if (e.data.type === "tenant-changed" && e.data.code) {
        const incoming = String(e.data.code || "");
        const current = String(getTenant() || "");
        if (incoming && incoming !== current) {
          setTenant(incoming, { silent: true });
        }
      }
    };

    return () => bc.close();
  }, [hardLogout]);

  useEffect(() => {
    (async () => {
      try {
        const code = getTenant();
        if (code) setTenant(code);

        await ensureCsrf();

        const res = await apiClient.get("/me", {
          withCredentials: true,
          headers: { "X-Skip-Logout-Broadcast": "1", "X-Use-Credentials": "1" },
        });

        const me = res?.data;
        setUser(me);
        cacheUser(me);
        logoutLatchRef.current = false;
        markAuthReady(true);
      } catch {
        setUser(null);
        cacheUser(null);
        markAuthReady(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadStaticRefs = useCallback(async () => {
    if (!user || !user.USER_CODE || refsLoaded || refsLoading) return;

    try {
      setRefsLoading(true);

      const [companyRow, userRow, dropDown, currentMenu] = await Promise.all([
        useTopCompanyRow(),
        useTopUserRow(user.USER_CODE),
        useTopDocDropDownAll(),
        fetchData("menu-items", { USER_CODE: user?.USER_CODE }),
      ]);

      setCompanyInfo(companyRow ?? null);
      setCurrentUserRow(userRow ?? null);
      setCurrentMenu(currentMenu ?? null);
      setallDropDown(dropDown ?? null);

      setRefsLoaded(true);
    } catch (err) {
      console.error("Failed to load static company/user:", err);
    } finally {
      setRefsLoading(false);
    }
  }, [user, refsLoaded, refsLoading]);

  useEffect(() => {
    loadStaticRefs();
  }, [loadStaticRefs]);

  useEffect(() => {
    let t = null;

    const check = async () => {
      if (isBioAuthInProgress()) return;

      try {
        await apiClient.get("/me", {
          withCredentials: true,
          headers: { "X-Use-Credentials": "1" },
        });
      } catch (err) {
        const status = err?.response?.status;
        if (
          (status === 401 || status === 403 || status === 419) &&
          !isBioAuthInProgress()
        ) {
          await serverLogout("remote");
        }
      }
    };

    const onFocus = () => {
      if (document.visibilityState !== "visible") return;
      if (isBioAuthInProgress()) return;

      clearTimeout(t);
      t = setTimeout(() => {
        if (isBioAuthInProgress()) return;

        if (pendingLogoutNoticeRef.current) {
          pendingLogoutNoticeRef.current = false;
          Swal.fire({
            icon: "warning",
            title: "Session ended",
            text: "Your session has ended. Please sign in again.",
            confirmButtonText: undefined,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
          });
        }

        check();
      }, 500);
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearTimeout(t);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [serverLogout]);

  useEffect(() => {
    const bump = () => (lastActivity.current = Date.now());

    [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
      "visibilitychange",
    ].forEach((ev) => window.addEventListener(ev, bump, { passive: true }));

    return () =>
      [
        "mousemove",
        "keydown",
        "click",
        "scroll",
        "touchstart",
        "visibilitychange",
      ].forEach((ev) => window.removeEventListener(ev, bump));
  }, []);

  useEffect(() => {
    if (!user) return;

    let stopped = false;

    const idleCheck = async () => {
      if (stopped) return;

      if (isBioAuthInProgress()) {
        idleTimer.current = window.setTimeout(idleCheck, 1000);
        return;
      }

      const idleFor = Date.now() - lastActivity.current;

      if (idleFor >= IDLE_LIMIT_MS) {
        await serverLogout("idle");
        return;
      }

      idleTimer.current = window.setTimeout(idleCheck, 1000);
    };

    const remoteTick = async () => {
      if (stopped) return;

      if (isBioAuthInProgress()) {
        remoteHbTimer.current = window.setTimeout(
          remoteTick,
          REMOTE_HEARTBEAT_MS
        );
        return;
      }

      const isHidden = document.visibilityState !== "visible";
      const interval = isHidden ? REMOTE_HEARTBEAT_MS * 4 : REMOTE_HEARTBEAT_MS;

      const sinceLast = Date.now() - getLastAuthApiTouch();
      if (sinceLast >= interval) {
        const leader = tryAcquireLeader();
        if (leader && !stopped) {
          const ok = await pingRemoteCheck();
          if (!ok) return;
          renewLeader();
        }
      }

      const jitter = Math.floor(Math.random() * (isHidden ? 1500 : 500));
      remoteHbTimer.current = window.setTimeout(remoteTick, interval + jitter);
    };

    const expireTick = async () => {
      if (stopped) return;

      if (isBioAuthInProgress()) {
        expireHbTimer.current = window.setTimeout(
          expireTick,
          EXPIRE_HEARTBEAT_MS
        );
        return;
      }

      const isHidden = document.visibilityState !== "visible";
      const interval = isHidden ? EXPIRE_HEARTBEAT_MS * 2 : EXPIRE_HEARTBEAT_MS;

      const leader = tryAcquireLeader();
      if (leader && !stopped) {
        const ok = await pingExpiryCheck();
        if (!ok) return;
        renewLeader();
      }

      const jitter = Math.floor(Math.random() * (isHidden ? 3000 : 1000));
      expireHbTimer.current = window.setTimeout(expireTick, interval + jitter);
    };

    idleCheck();
    remoteTick();
    expireTick();

    return () => {
      stopped = true;
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (remoteHbTimer.current) clearTimeout(remoteHbTimer.current);
      if (expireHbTimer.current) clearTimeout(expireHbTimer.current);
    };
  }, [user, serverLogout]);

  const login = useCallback(async ({ companyCode, USER_CODE, PASSWORD }) => {
    setTenant(companyCode);

    await ensureCsrf();
    await apiClient.post(
      "/login",
      { USER_CODE, PASSWORD },
      { headers: { "X-Skip-Logout-Broadcast": "1" } }
    );

    const { data } = await apiClient.get("/me", {
      withCredentials: true,
      headers: { "X-Skip-Logout-Broadcast": "1" },
    });

    lastActivity.current = Date.now();
    setUser(data);
    cacheUser(data);
    logoutLatchRef.current = false;
    markAuthReady(true);

    setRefsLoaded(false);
  }, []);

  const loginWithBiometric = useCallback(
    async ({ companyCode, payload }) => {
      setTenant(companyCode);

      await ensureCsrf();

      await bioLoginVerifyPasswordless(payload, {
        headers: { "X-Skip-Logout-Broadcast": "1" },
      });

      const { data } = await apiClient.get("/me", {
        withCredentials: true,
        headers: { "X-Skip-Logout-Broadcast": "1" },
      });

      lastActivity.current = Date.now();
      setUser(data);
      cacheUser(data);
      logoutLatchRef.current = false;
      markAuthReady(true);

      setRefsLoaded(false);
    },
    []
  );

  const getAllDropDown = useCallback(
    (columnName, docCode) => {
      return (allDropDown || []).filter(
        (item) =>
          item.DROPDOWN_COLUMN === columnName && item.DOC_CODE === docCode
      );
    },
    [allDropDown]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithBiometric,
        logout,
        setUser,
        companyInfo,
        getAllDropDown,
        currentUserRow,
        refsLoading,
        refsLoaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);