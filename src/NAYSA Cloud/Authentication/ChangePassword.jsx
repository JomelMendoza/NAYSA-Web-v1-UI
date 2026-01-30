import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiClient,
  setTenant,
  getTenant,
} from "@/NAYSA Cloud/Configuration/BaseURL";
import Swal from "sweetalert2";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

/* ---------------- Password rules ---------------- */
const REQUIREMENTS = [
  { key: "len", test: (p) => p.length >= 8, label: "At least 8 characters" },
  { key: "lower", test: (p) => /[a-z]/.test(p), label: "Contains a lowercase letter" },
  { key: "upper", test: (p) => /[A-Z]/.test(p), label: "Contains an uppercase letter" },
  { key: "digit", test: (p) => /\d/.test(p), label: "Contains a number" },
  { key: "special", test: (p) => /[^A-Za-z0-9]/.test(p), label: "Contains a special character" },
  { key: "spaces", test: (p) => !/\s/.test(p), label: "No spaces" },
];

const ChangePassword = () => {
  const navigate = useNavigate();

  /* ---------------- URL params ---------------- */
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const user = (params.get("user") || "").trim();
  const mode = (params.get("mode") || "").trim(); // reset | release | ""
  const companyFromLink = (params.get("company") || "").trim();

  /* ---------------- MODE RULE ---------------- */
  const requiresOldPassword = !["reset", "release"].includes(mode);

  /* ---------------- State ---------------- */
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------------- Tenant from link ---------------- */
  useEffect(() => {
    if (companyFromLink) setTenant(companyFromLink);
  }, [companyFromLink]);

  const tenant = getTenant();

  /* ---------------- Strength helpers ---------------- */
  const baseReqsOk = REQUIREMENTS.every((r) => r.test(newPassword));

  const extraRulesOk =
    newPassword &&
    newPassword.toLowerCase() !== "password" &&
    newPassword.toLowerCase() !== user.toLowerCase() &&
    (!requiresOldPassword || newPassword !== oldPassword);

  const canSubmit =
    !!user &&
    !!tenant &&
    baseReqsOk &&
    extraRulesOk &&
    confirm === newPassword &&
    (!requiresOldPassword || !!oldPassword) &&
    !loading;

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !tenant) {
      Swal.fire("Error", "Invalid or expired password link.", "error");
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post("/users/change-password", {
        userCode: user,
        oldPassword: requiresOldPassword ? oldPassword : null,
        newPassword,
        mode,
      });

      if (data?.status === "success") {
        await Swal.fire("Success", "Password changed successfully.", "success");
        navigate("/", { replace: true });
      } else {
        Swal.fire("Error", data?.message || "Password change failed.", "error");
      }
    } catch (err) {
      Swal.fire(
        "Error",
        err?.response?.data?.message || err.message || "Request failed.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const reqItemClass = (ok) =>
    `flex items-start gap-2 text-sm ${ok ? "text-green-600" : "text-gray-500"}`;

  /* ---------------- UI (UNCHANGED DESIGN) ---------------- */
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(to_bottom,#7392b7,#d8e1e9)] px-4">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center py-8">
        <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/40 p-4 shadow-xl backdrop-blur-md">
          <div className="mb-3 flex flex-col items-center text-center">
            <img src="/naysa_logo.png" alt="NAYSA Logo" className="w-28 drop-shadow-md" />
            <h1 className="mt-2 text-lg font-bold text-blue-900">
              NAYSA Financials Cloud
            </h1>
          </div>

          <h2 className="text-xl font-semibold text-center">Change Password</h2>

          <p className="text-xs text-center text-gray-500 mt-1">
            User: <span className="font-medium">{user}</span> • Tenant:{" "}
            <span className="font-medium">{tenant}</span>
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">

            {/* OLD PASSWORD (only when required) */}
            {requiresOldPassword && (
              <label className="block">
                <span className="text-sm font-medium">Old Password</span>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showOld ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full rounded-xl border py-2 pl-10 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showOld ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>
            )}

            {/* NEW PASSWORD */}
            <label className="block">
              <span className="text-sm font-medium">New Password</span>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border py-2 pl-10 pr-10"
                  required
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showNew ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            {/* CONFIRM */}
            <label className="block">
              <span className="text-sm font-medium">Confirm Password</span>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConf ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl border py-2 pl-10 pr-10"
                  required
                />
                <button type="button" onClick={() => setShowConf(!showConf)}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showConf ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            {/* REQUIREMENTS LIST (UNCHANGED) */}
            <div className="rounded-lg bg-gray-50 border p-3">
              <div className="text-xs font-semibold mb-2">Password requirements</div>
              <ul className="space-y-1">
                {REQUIREMENTS.map((r) => (
                  <li key={r.key} className={reqItemClass(r.test(newPassword))}>
                    <span className={`w-3 h-3 rounded-full ${r.test(newPassword) ? "bg-green-600" : "bg-gray-300"}`} />
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full rounded-xl py-2 font-medium text-white ${
                canSubmit
                  ? "bg-gradient-to-r from-sky-600 to-indigo-600"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? "Saving..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
