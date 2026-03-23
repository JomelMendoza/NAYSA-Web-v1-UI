// // import React, { useEffect, useState, useRef } from "react";
// // import { FiUser, FiLock, FiEye, FiEyeOff, FiGlobe } from "react-icons/fi";
// // import Swal from "sweetalert2";
// // import { useNavigate } from "react-router-dom";
// // import { useAuth } from "./AuthContext.jsx";
// // import { apiClient, setTenant } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";

// // function normalizeCompaniesPayload(raw) {
// //   let arr = [];
// //   if (Array.isArray(raw)) arr = raw;
// //   else if (Array.isArray(raw?.data)) arr = raw.data;
// //   else if (raw?.data && typeof raw.data === "object") arr = Object.values(raw.data);
// //   else if (raw && typeof raw === "object") arr = Object.values(raw);

// //   return arr.map((r) => {
// //     const get = (o, ...keys) => keys.reduce((v, k) => (v ?? o?.[k]), undefined);
// //     const code =
// //       get(r, "code", "CODE", "Code") ??
// //       get(r, "database", "DATABASE", "Database") ??
// //       "";
// //     const company =
// //       get(r, "company", "COMPANY", "Company") ??
// //       get(r, "database", "DATABASE", "Database") ??
// //       get(r, "code", "CODE", "Code") ??
// //       "";
// //     const database = get(r, "database", "DATABASE", "Database") ?? "";

// //     return {
// //       code: String(code || "").trim(),
// //       company: String(company || "").trim(),
// //       database: String(database || "").trim(),
// //     };
// //   });
// // }

// // export default function Login({ onSwitchToRegister, onForgot }) {
// //   const { login } = useAuth();
// //   const navigate = useNavigate();

// //   const [form, setForm] = useState({ USER_CODE: "", PASSWORD: "" });
// //   const [companies, setCompanies] = useState([]);
// //   const [companyCode, setCompanyCode] = useState(
// //     localStorage.getItem("companyCode") || ""
// //   );
// //   const [loadingCompanies, setLoadingCompanies] = useState(true);

// //   const [isLoading, setIsLoading] = useState(false);
// //   const [showPwd, setShowPwd] = useState(false);
// //   const [capsOn, setCapsOn] = useState(false);
// //   const pwdRef = useRef(null);

// //   useEffect(() => {
// //     let alive = true;
// //     (async () => {
// //       try {
// //         setLoadingCompanies(true);
// //         const { data } = await apiClient.get("/companies");
// //         const options = normalizeCompaniesPayload(data).filter(
// //           (x) => x.code || x.database
// //         );

// //         if (!alive) return;
// //         setCompanies(options);

// //         if (!companyCode && options.length === 1) {
// //           setCompanyCode(options[0].code || options[0].database || "");
// //         } else if (
// //           companyCode &&
// //           !options.some((o) => o.code === companyCode || o.database === companyCode)
// //         ) {
// //           if (options[0]) setCompanyCode(options[0].code || options[0].database || "");
// //         }
// //       } catch (e) {
// //         Swal.fire({
// //           icon: "error",
// //           title: "Unable to load companies",
// //           text:
// //             e?.response?.data?.message ||
// //             e?.message ||
// //             "Please check the /api/companies endpoint.",
// //         });
// //       } finally {
// //         if (alive) setLoadingCompanies(false);
// //       }
// //     })();
// //     return () => {
// //       alive = false;
// //     };
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, []);

// //   useEffect(() => {
// //     if (companyCode) localStorage.setItem("companyCode", companyCode);
// //   }, [companyCode]);

// //   const handleChange = (e) => {
// //     const { name, value } = e.target;
// //     setForm((s) => ({ ...s, [name]: value }));
// //   };

// //   const handleCaps = (e) =>
// //     setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     if (!form.USER_CODE.trim() || !form.PASSWORD) return;

// //     if (!companyCode) {
// //       await Swal.fire({
// //         icon: "warning",
// //         title: "Select Company",
// //         text: "Please choose a company before logging in.",
// //       });
// //       return;
// //     }

// //    setIsLoading(true);
// //       try {
// //         await login({
// //           companyCode,
// //           USER_CODE: form.USER_CODE.trim(),
// //           PASSWORD: form.PASSWORD,
// //         });

// //         await Swal.fire({
// //           toast: true,
// //           position: "top-end",
// //           icon: "success",
// //           title: "Welcome back!",
// //           showConfirmButton: false,
// //           timer: 1800,
// //           timerProgressBar: true,
// //         });

// //         navigate("/", { replace: true });
// //       } catch (err) {
// //         const status = err?.response?.status;
// //         const code = err?.response?.data?.code;
// //         const msg =
// //           err?.response?.data?.message ||
// //           err?.message ||
// //           "Please try again.";

// //         if (status === 403 && code === "PENDING") {
// //           await Swal.fire({
// //             icon: "info",
// //             title: "Awaiting System Administrator Approval",
// //             html: `
// //               <p style="font-size: 14px; color: #1f2937;">
// //                 Your account is currently <strong>pending activation</strong>.<br/>
// //                 Please wait for the administrator to approve your account and send a temporary password.
// //               </p>
// //             `,
// //             confirmButtonText: "OK",
// //             confirmButtonColor: "#1e3a8a",
// //             background: "#f9fafb",
// //             iconColor: "#2563eb",
// //           });
// //           return;
// //         }

// //         if (status === 403 && code === "INACTIVE") {
// //           await Swal.fire({
// //             icon: "error",
// //             title: "Account Inactive",
// //             text: msg || "Your account has been deactivated. Please contact the administrator.",
// //             confirmButtonText: "OK",
// //           });
// //           return;
// //         }

// //         if (status === 429 && code === "SEAT_LIMIT") {
// //           await Swal.fire({
// //             icon: "warning",
// //             title: "Login Limit Reached",
// //             text: msg || "Maximum concurrent users reached. Please try again later.",
// //             confirmButtonText: "OK",
// //           });
// //           return;
// //         }

// //         await Swal.fire({
// //           icon: "error",
// //           title: "Login failed",
// //           text: msg,
// //           confirmButtonText: "OK",
// //         });
// //       } finally {
// //         setIsLoading(false);
// //       }
// //   };

// //   return (
// //     <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(to_bottom,#7392b7,#d8e1e9)]">
// //       {/* Decorative blobs */}
// //       <div className="pointer-events-none absolute inset-0 -z-10">
// //         <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-300/30 to-sky-200/30 blur-3xl" />
// //         <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-tr from-purple-500/25 to-fuchsia-400/25 blur-3xl" />
// //       </div>

// //       <div className="mx-auto flex max-w-6xl flex-col items-center justify-start px-4 pt-6 md:pt-10 lg:pt-12 pb-24">
// //         <div className="mb-3 md:mb-4 flex flex-col items-center text-center">
// //           <img src="/naysa_logo.png" alt="NAYSA Logo" className="w-40 md:w-44 drop-shadow-md" />
// //           <h1 className="mt-2 text-2xl font-bold tracking-tight text-blue-900 md:text-3xl">
// //             NAYSA Financials Cloud
// //           </h1>
// //         </div>

// //         <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/40 dark:bg-white/10 p-6 shadow-xl backdrop-blur-md">
// //           <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-3">
// //             {/* COMPANY */}
// //             <label className="block">
// //               <span className="mb-1 block text-sm font-medium text-slate-700">
// //                 Company
// //                 {!loadingCompanies && (
// //                   <span className="ml-2 text-xs text-slate-500">
// //                     ({companies.length} found)
// //                   </span>
// //                 )}
// //               </span>
// //               <div className="relative">
// //                 <FiGlobe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
// //                 <select
// //                   value={companyCode}
// //                   onChange={(e) => setCompanyCode(e.target.value)}
// //                   disabled={loadingCompanies}
// //                   className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
// //                   required
// //                 >
// //                   <option value="" disabled>
// //                     {loadingCompanies ? "Loading companies…" : "Select a company"}
// //                   </option>
// //                   {companies.map((c) => {
// //                     const value = c.code || c.database;
// //                     const label = c.company || value || "(unnamed)";
// //                     return (
// //                       <option key={value || label} value={value}>
// //                         {label}
// //                       </option>
// //                     );
// //                   })}
// //                 </select>
// //               </div>
// //             </label>

// //             {/* USER_CODE */}
// //             <label className="block">
// //               <span className="mb-1 block text-sm font-medium text-slate-700">User ID</span>
// //               <div className="relative">
// //                 <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
// //                 <input
// //                   type="text"
// //                   name="USER_CODE"
// //                   autoComplete="username"
// //                   value={form.USER_CODE}
// //                   onChange={handleChange}
// //                   required
// //                   className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
// //                   placeholder="Enter your user ID"
// //                 />
// //               </div>
// //             </label>

// //             {/* PASSWORD */}
// //             <label className="block">
// //               <div className="mb-1 flex items-center justify-between">
// //                 <span className="text-sm font-medium text-slate-700">Password</span>
// //                 {capsOn && (
// //                   <span className="text-xs font-semibold text-white">Caps Lock is ON</span>
// //                 )}
// //               </div>
// //               <div className="relative">
// //                 <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
// //                 <input
// //                   ref={pwdRef}
// //                   type={showPwd ? "text" : "password"}
// //                   name="PASSWORD"
// //                   autoComplete="current-password"
// //                   value={form.PASSWORD}
// //                   onChange={handleChange}
// //                   onKeyUp={handleCaps}
// //                   onKeyDown={handleCaps}
// //                   required
// //                   className="w-full rounded-xl border border-slate-200 bg-white/90 py-3 pl-10 pr-12 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
// //                   placeholder="••••••••"
// //                 />
// //                 <button
// //                   type="button"
// //                   onClick={() => setShowPwd((s) => !s)}
// //                   className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
// //                   aria-label={showPwd ? "Hide password" : "Show password"}
// //                 >
// //                   {showPwd ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
// //                 </button>
// //               </div>
// //             </label>

// //             <div className="flex justify-end pt-1">
// //               <button
// //                 type="button"
// //                 onClick={onForgot}
// //                 className="text-sm font-medium text-sky-700 hover:text-sky-600"
// //               >
// //                 Forgot password?
// //               </button>
// //             </div>

// //             <button
// //               type="submit"
// //               disabled={
// //                 isLoading ||
// //                 loadingCompanies ||
// //                 !companyCode ||
// //                 !form.USER_CODE.trim() ||
// //                 !form.PASSWORD
// //               }
// //               className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-3 font-medium text-white shadow-lg shadow-sky-600/20 transition hover:from-sky-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
// //             >
// //               {isLoading ? (
// //                 <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
// //                   <circle
// //                     cx="12"
// //                     cy="12"
// //                     r="10"
// //                     stroke="currentColor"
// //                     strokeWidth="4"
// //                     fill="none"
// //                     className="opacity-25"
// //                   />
// //                   <path
// //                     className="opacity-75"
// //                     fill="currentColor"
// //                     d="M4 12a8 8 0 018-8V0A12 12 0 002 12h2z"
// //                   />
// //                 </svg>
// //               ) : (
// //                 <>Log In</>
// //               )}
// //             </button>
// //           </form>

// //           <div className="mt-6 text-center">
// //             <button
// //               onClick={onSwitchToRegister}
// //               className="text-sm text-slate-700 hover:underline"
// //             >
// //               Don’t have an account? <span className="text-sky-700">Register</span>
// //             </button>
// //             <p className="mt-3 text-xs text-slate-500">
// //               © {new Date().getFullYear()} NAYSA. All rights reserved.
// //             </p>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }






// import React, { useEffect, useState, useRef } from "react";
// import {
//   FiUser,
//   FiLock,
//   FiEye,
//   FiEyeOff,
//   FiGlobe,
//   FiShield,
// } from "react-icons/fi";
// import Swal from "sweetalert2";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "./AuthContext.jsx";
// import {
//   apiClient,
//   setTenant,
//   bioLoginOptions,
// } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
// import {
//   prepareLoginPublicKey,
//   serializeLoginCredential,
// } from "@/NAYSA Cloud/Authentication/webauthn.js";

// function normalizeCompaniesPayload(raw) {
//   let arr = [];
//   if (Array.isArray(raw)) arr = raw;
//   else if (Array.isArray(raw?.data)) arr = raw.data;
//   else if (raw?.data && typeof raw.data === "object") arr = Object.values(raw.data);
//   else if (raw && typeof raw === "object") arr = Object.values(raw);

//   return arr.map((r) => {
//     const get = (o, ...keys) => keys.reduce((v, k) => (v ?? o?.[k]), undefined);
//     const code =
//       get(r, "code", "CODE", "Code") ??
//       get(r, "database", "DATABASE", "Database") ??
//       "";
//     const company =
//       get(r, "company", "COMPANY", "Company") ??
//       get(r, "database", "DATABASE", "Database") ??
//       get(r, "code", "CODE", "Code") ??
//       "";
//     const database = get(r, "database", "DATABASE", "Database") ?? "";

//     return {
//       code: String(code || "").trim(),
//       company: String(company || "").trim(),
//       database: String(database || "").trim(),
//     };
//   });
// }

// export default function Login({ onSwitchToRegister, onForgot }) {
//   const { login, loginWithBiometric } = useAuth();
//   const navigate = useNavigate();

//   const [form, setForm] = useState({ USER_CODE: "", PASSWORD: "" });
//   const [companies, setCompanies] = useState([]);
//   const [companyCode, setCompanyCode] = useState(
//     localStorage.getItem("companyCode") || ""
//   );
//   const [loadingCompanies, setLoadingCompanies] = useState(true);

//   const [isLoading, setIsLoading] = useState(false);
//   const [isBioLoading, setIsBioLoading] = useState(false);
//   const [showPwd, setShowPwd] = useState(false);
//   const [capsOn, setCapsOn] = useState(false);
//   const pwdRef = useRef(null);

//   useEffect(() => {
//     let alive = true;

//     (async () => {
//       try {
//         setLoadingCompanies(true);
//         const { data } = await apiClient.get("/companies");
//         const options = normalizeCompaniesPayload(data).filter(
//           (x) => x.code || x.database
//         );

//         if (!alive) return;
//         setCompanies(options);

//         if (!companyCode && options.length === 1) {
//           setCompanyCode(options[0].code || options[0].database || "");
//         } else if (
//           companyCode &&
//           !options.some((o) => o.code === companyCode || o.database === companyCode)
//         ) {
//           if (options[0]) {
//             setCompanyCode(options[0].code || options[0].database || "");
//           }
//         }
//       } catch (e) {
//         Swal.fire({
//           icon: "error",
//           title: "Unable to load companies",
//           text:
//             e?.response?.data?.message ||
//             e?.message ||
//             "Please check the /api/companies endpoint.",
//         });
//       } finally {
//         if (alive) setLoadingCompanies(false);
//       }
//     })();

//     return () => {
//       alive = false;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     if (companyCode) localStorage.setItem("companyCode", companyCode);
//   }, [companyCode]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((s) => ({ ...s, [name]: value }));
//   };

//   const handleCaps = (e) =>
//     setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.USER_CODE.trim() || !form.PASSWORD) return;

//     if (!companyCode) {
//       await Swal.fire({
//         icon: "warning",
//         title: "Select Company",
//         text: "Please choose a company before logging in.",
//       });
//       return;
//     }

//     setIsLoading(true);
//     try {
//       await login({
//         companyCode,
//         USER_CODE: form.USER_CODE.trim(),
//         PASSWORD: form.PASSWORD,
//       });

//       await Swal.fire({
//         toast: true,
//         position: "top-end",
//         icon: "success",
//         title: "Welcome back!",
//         showConfirmButton: false,
//         timer: 1800,
//         timerProgressBar: true,
//       });

//       navigate("/", { replace: true });
//     } catch (err) {
//       const status = err?.response?.status;
//       const code = err?.response?.data?.code;
//       const msg =
//         err?.response?.data?.message ||
//         err?.message ||
//         "Please try again.";

//       if (status === 403 && code === "PENDING") {
//         await Swal.fire({
//           icon: "info",
//           title: "Awaiting System Administrator Approval",
//           html: `
//             <p style="font-size: 14px; color: #1f2937;">
//               Your account is currently <strong>pending activation</strong>.<br/>
//               Please wait for the administrator to approve your account and send a temporary password.
//             </p>
//           `,
//           confirmButtonText: "OK",
//           confirmButtonColor: "#1e3a8a",
//           background: "#f9fafb",
//           iconColor: "#2563eb",
//         });
//         return;
//       }

//       if (status === 403 && code === "INACTIVE") {
//         await Swal.fire({
//           icon: "error",
//           title: "Account Inactive",
//           text:
//             msg ||
//             "Your account has been deactivated. Please contact the administrator.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       if (status === 429 && code === "SEAT_LIMIT") {
//         await Swal.fire({
//           icon: "warning",
//           title: "Login Limit Reached",
//           text:
//             msg || "Maximum concurrent users reached. Please try again later.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       await Swal.fire({
//         icon: "error",
//         title: "Login failed",
//         text: msg,
//         confirmButtonText: "OK",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleBiometricLogin = async () => {
//     try {
//       if (!companyCode) {
//         await Swal.fire({
//           icon: "warning",
//           title: "Select Company",
//           text: "Please choose a company before logging in.",
//         });
//         return;
//       }

//       if (!form.USER_CODE.trim()) {
//         await Swal.fire({
//           icon: "warning",
//           title: "User ID Required",
//           text: "Please enter your User ID first.",
//         });
//         return;
//       }

//       if (
//         !window.PublicKeyCredential ||
//         typeof navigator.credentials?.get !== "function"
//       ) {
//         await Swal.fire({
//           icon: "error",
//           title: "Biometric Login Not Supported",
//           text: "This browser or device does not support biometric login.",
//         });
//         return;
//       }

//       setIsBioLoading(true);

//       setTenant(companyCode);

//       const optionRes = await bioLoginOptions(form.USER_CODE.trim());

//       if (optionRes?.status !== "success" || !optionRes?.data) {
//         throw new Error(
//           optionRes?.message || "Failed to load biometric login options."
//         );
//       }

//       const publicKey = prepareLoginPublicKey(optionRes.data);

//       const credential = await navigator.credentials.get({
//         publicKey,
//       });

//       if (!credential) {
//         throw new Error("Biometric authentication was cancelled.");
//       }

//       const payload = {
//         USER_CODE: form.USER_CODE.trim(),
//         credential: serializeLoginCredential(credential),
//       };

//       await loginWithBiometric({
//         companyCode,
//         payload,
//       });

//       await Swal.fire({
//         toast: true,
//         position: "top-end",
//         icon: "success",
//         title: "Welcome back!",
//         showConfirmButton: false,
//         timer: 1800,
//         timerProgressBar: true,
//       });

//       navigate("/", { replace: true });
//     } catch (err) {
//       const status = err?.response?.status;
//       const code = err?.response?.data?.code;
//       const msg =
//         err?.response?.data?.message ||
//         err?.message ||
//         "Unable to login using biometrics.";

//       if (err?.name === "NotAllowedError") {
//         await Swal.fire({
//           icon: "info",
//           title: "Biometric Login Cancelled",
//           text: "Authentication was cancelled or timed out.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       if (status === 403 && code === "PENDING") {
//         await Swal.fire({
//           icon: "info",
//           title: "Awaiting System Administrator Approval",
//           html: `
//             <p style="font-size: 14px; color: #1f2937;">
//               Your account is currently <strong>pending activation</strong>.<br/>
//               Please wait for the administrator to approve your account and send a temporary password.
//             </p>
//           `,
//           confirmButtonText: "OK",
//           confirmButtonColor: "#1e3a8a",
//           background: "#f9fafb",
//           iconColor: "#2563eb",
//         });
//         return;
//       }

//       if (status === 403 && code === "INACTIVE") {
//         await Swal.fire({
//           icon: "error",
//           title: "Account Inactive",
//           text:
//             msg ||
//             "Your account has been deactivated. Please contact the administrator.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       if (status === 429 && code === "SEAT_LIMIT") {
//         await Swal.fire({
//           icon: "warning",
//           title: "Login Limit Reached",
//           text:
//             msg || "Maximum concurrent users reached. Please try again later.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       await Swal.fire({
//         icon: "error",
//         title: "Biometric Login Failed",
//         text: msg,
//         confirmButtonText: "OK",
//       });
//     } finally {
//       setIsBioLoading(false);
//     }
//   };

//   const biometricDisabled =
//     isLoading ||
//     isBioLoading ||
//     loadingCompanies ||
//     !companyCode ||
//     !form.USER_CODE.trim();

//   return (
//     <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(to_bottom,#7392b7,#d8e1e9)]">
//       <div className="pointer-events-none absolute inset-0 -z-10">
//         <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-300/30 to-sky-200/30 blur-3xl" />
//         <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-tr from-purple-500/25 to-fuchsia-400/25 blur-3xl" />
//       </div>

//       <div className="mx-auto flex max-w-6xl flex-col items-center justify-start px-4 pt-6 md:pt-10 lg:pt-12 pb-24">
//         <div className="mb-3 md:mb-4 flex flex-col items-center text-center">
//           <img
//             src="/naysa_logo.png"
//             alt="NAYSA Logo"
//             className="w-40 md:w-44 drop-shadow-md"
//           />
//           <h1 className="mt-2 text-2xl font-bold tracking-tight text-blue-900 md:text-3xl">
//             NAYSA Financials Cloud
//           </h1>
//         </div>

//         <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/40 dark:bg-white/10 p-6 shadow-xl backdrop-blur-md">
//           <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-4">
//             <label className="block">
//               <span className="mb-1 block text-sm font-medium text-slate-700">
//                 Company
//                 {!loadingCompanies && (
//                   <span className="ml-2 text-xs text-slate-500">
//                     ({companies.length} found)
//                   </span>
//                 )}
//               </span>
//               <div className="relative">
//                 <FiGlobe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                 <select
//                   value={companyCode}
//                   onChange={(e) => setCompanyCode(e.target.value)}
//                   disabled={loadingCompanies}
//                   className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
//                   required
//                 >
//                   <option value="" disabled>
//                     {loadingCompanies ? "Loading companies…" : "Select a company"}
//                   </option>
//                   {companies.map((c) => {
//                     const value = c.code || c.database;
//                     const label = c.company || value || "(unnamed)";
//                     return (
//                       <option key={value || label} value={value}>
//                         {label}
//                       </option>
//                     );
//                   })}
//                 </select>
//               </div>
//             </label>

//             <label className="block">
//               <span className="mb-1 block text-sm font-medium text-slate-700">
//                 User ID
//               </span>
//               <div className="relative">
//                 <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                 <input
//                   type="text"
//                   name="USER_CODE"
//                   autoComplete="username"
//                   value={form.USER_CODE}
//                   onChange={handleChange}
//                   required
//                   className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
//                   placeholder="Enter your user ID"
//                 />
//               </div>
//             </label>

//             <label className="block">
//               <div className="mb-1 flex items-center justify-between">
//                 <span className="text-sm font-medium text-slate-700">
//                   Password
//                 </span>
//                 {capsOn && (
//                   <span className="text-xs font-semibold text-white">
//                     Caps Lock is ON
//                   </span>
//                 )}
//               </div>
//               <div className="relative">
//                 <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                 <input
//                   ref={pwdRef}
//                   type={showPwd ? "text" : "password"}
//                   name="PASSWORD"
//                   autoComplete="current-password"
//                   value={form.PASSWORD}
//                   onChange={handleChange}
//                   onKeyUp={handleCaps}
//                   onKeyDown={handleCaps}
//                   required
//                   className="w-full rounded-xl border border-slate-200 bg-white/90 py-3 pl-10 pr-12 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
//                   placeholder="••••••••"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPwd((s) => !s)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
//                   aria-label={showPwd ? "Hide password" : "Show password"}
//                 >
//                   {showPwd ? (
//                     <FiEyeOff className="h-5 w-5" />
//                   ) : (
//                     <FiEye className="h-5 w-5" />
//                   )}
//                 </button>
//               </div>
//             </label>

//             <div className="flex justify-end pt-1">
//               <button
//                 type="button"
//                 onClick={onForgot}
//                 className="text-sm font-medium text-sky-700 hover:text-sky-600"
//               >
//                 Forgot password?
//               </button>
//             </div>

//             <button
//               type="submit"
//               disabled={
//                 isLoading ||
//                 isBioLoading ||
//                 loadingCompanies ||
//                 !companyCode ||
//                 !form.USER_CODE.trim() ||
//                 !form.PASSWORD
//               }
//               className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-3 font-medium text-white shadow-lg shadow-sky-600/20 transition hover:from-sky-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               {isLoading ? (
//                 <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
//                   <circle
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                     fill="none"
//                     className="opacity-25"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0A12 12 0 002 12h2z"
//                   />
//                 </svg>
//               ) : (
//                 <>Log In</>
//               )}
//             </button>

//             <button
//               type="button"
//               onClick={handleBiometricLogin}
//               disabled={biometricDisabled}
//               className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white/90 px-4 py-3 font-medium text-sky-800 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               {isBioLoading ? (
//                 <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
//                   <circle
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                     fill="none"
//                     className="opacity-25"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0A12 12 0 002 12h2z"
//                   />
//                 </svg>
//               ) : (
//                 <>
//                   <FiShield className="h-5 w-5" />
//                   Login with Biometrics
//                 </>
//               )}
//             </button>
//           </form>

//           <div className="mt-6 text-center">
//             <button
//               onClick={onSwitchToRegister}
//               className="text-sm text-slate-700 hover:underline"
//             >
//               Don’t have an account? <span className="text-sky-700">Register</span>
//             </button>
//             <p className="mt-3 text-xs text-slate-500">
//               © {new Date().getFullYear()} NAYSA. All rights reserved.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

















// import React, { useEffect, useState, useRef } from "react";
// import {
//   FiUser,
//   FiLock,
//   FiEye,
//   FiEyeOff,
//   FiGlobe,
//   FiShield,
// } from "react-icons/fi";
// import Swal from "sweetalert2";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "./AuthContext.jsx";
// import {
//   apiClient,
//   setTenant,
//   bioLoginOptions,
//   bioLoginOptionsPasswordless,
// } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
// import {
//   prepareLoginPublicKey,
//   serializeLoginCredential,
// } from "@/NAYSA Cloud/Authentication/webauthn.js";

// function normalizeCompaniesPayload(raw) {
//   let arr = [];
//   if (Array.isArray(raw)) arr = raw;
//   else if (Array.isArray(raw?.data)) arr = raw.data;
//   else if (raw?.data && typeof raw.data === "object") arr = Object.values(raw.data);
//   else if (raw && typeof raw === "object") arr = Object.values(raw);

//   return arr.map((r) => {
//     const get = (o, ...keys) => keys.reduce((v, k) => (v ?? o?.[k]), undefined);
//     const code =
//       get(r, "code", "CODE", "Code") ??
//       get(r, "database", "DATABASE", "Database") ??
//       "";
//     const company =
//       get(r, "company", "COMPANY", "Company") ??
//       get(r, "database", "DATABASE", "Database") ??
//       get(r, "code", "CODE", "Code") ??
//       "";
//     const database = get(r, "database", "DATABASE", "Database") ?? "";

//     return {
//       code: String(code || "").trim(),
//       company: String(company || "").trim(),
//       database: String(database || "").trim(),
//     };
//   });
// }

// export default function Login({ onSwitchToRegister, onForgot }) {
//   const { login, loginWithBiometric,loginWithBiometricPasswordless  } = useAuth();

//   const navigate = useNavigate();

//   const [form, setForm] = useState({ USER_CODE: "", PASSWORD: "" });
//   const [companies, setCompanies] = useState([]);
//   const [companyCode, setCompanyCode] = useState(
//     localStorage.getItem("companyCode") || ""
//   );
//   const [loadingCompanies, setLoadingCompanies] = useState(true);

//   const [isLoading, setIsLoading] = useState(false);
//   const [isBioLoading, setIsBioLoading] = useState(false);
//   const [showPwd, setShowPwd] = useState(false);
//   const [capsOn, setCapsOn] = useState(false);
//   const pwdRef = useRef(null);

//   useEffect(() => {
//     let alive = true;

//     (async () => {
//       try {
//         setLoadingCompanies(true);
//         const { data } = await apiClient.get("/companies");
//         const options = normalizeCompaniesPayload(data).filter(
//           (x) => x.code || x.database
//         );

//         if (!alive) return;
//         setCompanies(options);

//         if (!companyCode && options.length === 1) {
//           setCompanyCode(options[0].code || options[0].database || "");
//         } else if (
//           companyCode &&
//           !options.some((o) => o.code === companyCode || o.database === companyCode)
//         ) {
//           if (options[0]) {
//             setCompanyCode(options[0].code || options[0].database || "");
//           }
//         }
//       } catch (e) {
//         Swal.fire({
//           icon: "error",
//           title: "Unable to load companies",
//           text:
//             e?.response?.data?.message ||
//             e?.message ||
//             "Please check the /api/companies endpoint.",
//         });
//       } finally {
//         if (alive) setLoadingCompanies(false);
//       }
//     })();

//     return () => {
//       alive = false;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     if (companyCode) localStorage.setItem("companyCode", companyCode);
//   }, [companyCode]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((s) => ({ ...s, [name]: value }));
//   };

//   const handleCaps = (e) =>
//     setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.USER_CODE.trim() || !form.PASSWORD) return;

//     if (!companyCode) {
//       await Swal.fire({
//         icon: "warning",
//         title: "Select Company",
//         text: "Please choose a company before logging in.",
//       });
//       return;
//     }

//     setIsLoading(true);
//     try {
//       await login({
//         companyCode,
//         USER_CODE: form.USER_CODE.trim(),
//         PASSWORD: form.PASSWORD,
//       });

//       await Swal.fire({
//         toast: true,
//         position: "top-end",
//         icon: "success",
//         title: "Welcome back!",
//         showConfirmButton: false,
//         timer: 1800,
//         timerProgressBar: true,
//       });

//       navigate("/", { replace: true });
//     } catch (err) {
//       const status = err?.response?.status;
//       const code = err?.response?.data?.code;
//       const msg =
//         err?.response?.data?.message ||
//         err?.message ||
//         "Please try again.";

//       if (status === 403 && code === "PENDING") {
//         await Swal.fire({
//           icon: "info",
//           title: "Awaiting System Administrator Approval",
//           html: `
//             <p style="font-size: 14px; color: #1f2937;">
//               Your account is currently <strong>pending activation</strong>.<br/>
//               Please wait for the administrator to approve your account and send a temporary password.
//             </p>
//           `,
//           confirmButtonText: "OK",
//           confirmButtonColor: "#1e3a8a",
//           background: "#f9fafb",
//           iconColor: "#2563eb",
//         });
//         return;
//       }

//       if (status === 403 && code === "INACTIVE") {
//         await Swal.fire({
//           icon: "error",
//           title: "Account Inactive",
//           text:
//             msg ||
//             "Your account has been deactivated. Please contact the administrator.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       if (status === 429 && code === "SEAT_LIMIT") {
//         await Swal.fire({
//           icon: "warning",
//           title: "Login Limit Reached",
//           text:
//             msg || "Maximum concurrent users reached. Please try again later.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       await Swal.fire({
//         icon: "error",
//         title: "Login failed",
//         text: msg,
//         confirmButtonText: "OK",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };


// const setBioAuthInProgress = (value) => {
//   try {
//     if (value) sessionStorage.setItem("bioAuthInProgress", "1");
//     else sessionStorage.removeItem("bioAuthInProgress");
//   } catch {}
// };

// const isBioAuthInProgress = () => {
//   try {
//     return sessionStorage.getItem("bioAuthInProgress") === "1";
//   } catch {
//     return false;
//   }
// };

  


// const handlePasswordlessBiometricLogin = async () => {
//   try {
//     if (!companyCode) {
//       await Swal.fire({
//         icon: "warning",
//         title: "Select Company",
//         text: "Please choose a company before logging in.",
//       });
//       return;
//     }

//     if (
//       !window.PublicKeyCredential ||
//       typeof navigator.credentials?.get !== "function"
//     ) {
//       await Swal.fire({
//         icon: "error",
//         title: "Biometric Login Not Supported",
//         text: "This browser or device does not support biometric login.",
//       });
//       return;
//     }

//     setBioAuthInProgress(true);
//     setIsBioLoading(true);
//     setTenant(companyCode);

//     const optionRes = await bioLoginOptionsPasswordless();

//     if (!optionRes?.success || !optionRes?.data) {
//       throw new Error(
//         optionRes?.message || "Failed to load biometric login options."
//       );
//     }

//     const publicKey = prepareLoginPublicKey(optionRes.data);

//     const credential = await navigator.credentials.get({ publicKey });

//     if (!credential) {
//       throw new Error("Biometric authentication was cancelled.");
//     }

//     const payload = {
//       credential: serializeLoginCredential(credential),
//     };

//     await loginWithBiometricPasswordless({
//       companyCode,
//       payload,
//     });

//     await Swal.fire({
//       toast: true,
//       position: "top-end",
//       icon: "success",
//       title: "Welcome back!",
//       showConfirmButton: false,
//       timer: 1800,
//       timerProgressBar: true,
//     });

//     navigate("/", { replace: true });
//   } catch (err) {
//     const msg =
//       err?.response?.data?.message ||
//       err?.message ||
//       "Unable to login using biometrics.";

//     if (err?.name === "NotAllowedError") {
//       await Swal.fire({
//         icon: "info",
//         title: "Biometric Login Cancelled",
//         text: "Authentication was cancelled or timed out.",
//         confirmButtonText: "OK",
//       });
//       return;
//     }

//     await Swal.fire({
//       icon: "error",
//       title: "Biometric Login Failed",
//       text: msg,
//       confirmButtonText: "OK",
//     });
//   } finally {
//     setBioAuthInProgress(false);
//     setIsBioLoading(false);  
//   }
// };



//   const handleBiometricLogin = async () => {
//     try {
//       if (!companyCode) {
//         await Swal.fire({
//           icon: "warning",
//           title: "Select Company",
//           text: "Please choose a company before logging in.",
//         });
//         return;
//       }

//       if (!form.USER_CODE.trim()) {
//         await Swal.fire({
//           icon: "warning",
//           title: "User ID Required",
//           text: "Please enter your User ID first.",
//         });
//         return;
//       }

//       if (
//         !window.PublicKeyCredential ||
//         typeof navigator.credentials?.get !== "function"
//       ) {
//         await Swal.fire({
//           icon: "error",
//           title: "Biometric Login Not Supported",
//           text: "This browser or device does not support biometric login.",
//         });
//         return;
//       }

//       setIsBioLoading(true);

//       setTenant(companyCode);

//       const optionRes = await bioLoginOptions(form.USER_CODE.trim());

//       if (!optionRes?.success || !optionRes?.data) {
//         throw new Error(
//           optionRes?.message || "Failed to load biometric login options."
//         );
//       }

//       const publicKey = prepareLoginPublicKey(optionRes.data);

//       const credential = await navigator.credentials.get({
//         publicKey,
//       });

//       if (!credential) {
//         throw new Error("Biometric authentication was cancelled.");
//       }

//       const payload = {
//         USER_CODE: form.USER_CODE.trim(),
//         credential: serializeLoginCredential(credential),
//       };

//       await loginWithBiometric({
//         companyCode,
//         payload,
//       });

//       await Swal.fire({
//         toast: true,
//         position: "top-end",
//         icon: "success",
//         title: "Welcome back!",
//         showConfirmButton: false,
//         timer: 1800,
//         timerProgressBar: true,
//       });

//       navigate("/", { replace: true });
//     } catch (err) {
//       const status = err?.response?.status;
//       const code = err?.response?.data?.code;
//       const msg =
//         err?.response?.data?.message ||
//         err?.message ||
//         "Unable to login using biometrics.";

//       if (err?.name === "NotAllowedError") {
//         await Swal.fire({
//           icon: "info",
//           title: "Biometric Login Cancelled",
//           text: "Authentication was cancelled or timed out.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       if (status === 403 && code === "PENDING") {
//         await Swal.fire({
//           icon: "info",
//           title: "Awaiting System Administrator Approval",
//           html: `
//             <p style="font-size: 14px; color: #1f2937;">
//               Your account is currently <strong>pending activation</strong>.<br/>
//               Please wait for the administrator to approve your account and send a temporary password.
//             </p>
//           `,
//           confirmButtonText: "OK",
//           confirmButtonColor: "#1e3a8a",
//           background: "#f9fafb",
//           iconColor: "#2563eb",
//         });
//         return;
//       }

//       if (status === 403 && code === "INACTIVE") {
//         await Swal.fire({
//           icon: "error",
//           title: "Account Inactive",
//           text:
//             msg ||
//             "Your account has been deactivated. Please contact the administrator.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       if (status === 429 && code === "SEAT_LIMIT") {
//         await Swal.fire({
//           icon: "warning",
//           title: "Login Limit Reached",
//           text:
//             msg || "Maximum concurrent users reached. Please try again later.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       await Swal.fire({
//         icon: "error",
//         title: "Biometric Login Failed",
//         text: msg,
//         confirmButtonText: "OK",
//       });
//     } finally {
//       setIsBioLoading(false);
//     }
//   };

//   const biometricDisabled =
//     isLoading ||
//     isBioLoading ||
//     loadingCompanies ||
//     !companyCode ||
//     !form.USER_CODE.trim();

//   return (
//   <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(to_bottom,#7392b7,#d8e1e9)]">
//     <div className="pointer-events-none absolute inset-0 -z-10">
//       <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-300/30 to-sky-200/30 blur-3xl" />
//       <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-tr from-purple-500/25 to-fuchsia-400/25 blur-3xl" />
//     </div>

//     <div className="mx-auto flex max-w-6xl flex-col items-center justify-start px-4 pt-6 pb-24 md:pt-10 lg:pt-12">
//       <div className="mb-3 flex flex-col items-center text-center md:mb-4">
//         <img
//           src="/naysa_logo.png"
//           alt="NAYSA Logo"
//           className="w-40 drop-shadow-md md:w-44"
//         />
//         <h1 className="mt-2 text-2xl font-bold tracking-tight text-blue-900 md:text-3xl">
//           NAYSA Financials Cloud
//         </h1>
//       </div>

//       <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/40 p-6 shadow-xl backdrop-blur-md dark:bg-white/10">
//         <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-4">
//           <label className="block">
//             <span className="mb-1 block text-sm font-medium text-slate-700">
//               Company
//               {!loadingCompanies && (
//                 <span className="ml-2 text-xs text-slate-500">
//                   ({companies.length} found)
//                 </span>
//               )}
//             </span>
//             <div className="relative">
//               <FiGlobe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//               <select
//                 value={companyCode}
//                 onChange={(e) => setCompanyCode(e.target.value)}
//                 disabled={loadingCompanies || isLoading || isBioLoading}
//                 className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
//                 required
//               >
//                 <option value="" disabled>
//                   {loadingCompanies ? "Loading companies…" : "Select a company"}
//                 </option>
//                 {companies.map((c) => {
//                   const value = c.code || c.database;
//                   const label = c.company || value || "(unnamed)";
//                   return (
//                     <option key={value || label} value={value}>
//                       {label}
//                     </option>
//                   );
//                 })}
//               </select>
//             </div>
//           </label>

//           <label className="block">
//             <span className="mb-1 block text-sm font-medium text-slate-700">
//               User ID
//             </span>
//             <div className="relative">
//               <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//               <input
//                 type="text"
//                 name="USER_CODE"
//                 autoComplete="username"
//                 value={form.USER_CODE}
//                 onChange={handleChange}
//                 className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
//                 placeholder="Enter your user ID"
//               />
//             </div>
//             <p className="mt-1 text-xs text-slate-500">
//               Needed only for password login or biometric fallback.
//             </p>
//           </label>

//           <label className="block">
//             <div className="mb-1 flex items-center justify-between">
//               <span className="text-sm font-medium text-slate-700">
//                 Password
//               </span>
//               {capsOn && (
//                 <span className="text-xs font-semibold text-white">
//                   Caps Lock is ON
//                 </span>
//               )}
//             </div>
//             <div className="relative">
//               <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//               <input
//                 ref={pwdRef}
//                 type={showPwd ? "text" : "password"}
//                 name="PASSWORD"
//                 autoComplete="current-password"
//                 value={form.PASSWORD}
//                 onChange={handleChange}
//                 onKeyUp={handleCaps}
//                 onKeyDown={handleCaps}
//                 className="w-full rounded-xl border border-slate-200 bg-white/90 py-3 pl-10 pr-12 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
//                 placeholder="••••••••"
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPwd((s) => !s)}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
//                 aria-label={showPwd ? "Hide password" : "Show password"}
//               >
//                 {showPwd ? (
//                   <FiEyeOff className="h-5 w-5" />
//                 ) : (
//                   <FiEye className="h-5 w-5" />
//                 )}
//               </button>
//             </div>
//           </label>

//           <div className="flex justify-end pt-1">
//             <button
//               type="button"
//               onClick={onForgot}
//               className="text-sm font-medium text-sky-700 hover:text-sky-600"
//             >
//               Forgot password?
//             </button>
//           </div>

//           <button
//             type="submit"
//             disabled={
//               isLoading ||
//               isBioLoading ||
//               loadingCompanies ||
//               !companyCode ||
//               !form.USER_CODE.trim() ||
//               !form.PASSWORD
//             }
//             className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-3 font-medium text-white shadow-lg shadow-sky-600/20 transition hover:from-sky-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             {isLoading ? (
//               <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
//                 <circle
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                   fill="none"
//                   className="opacity-25"
//                 />
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8V0A12 12 0 002 12h2z"
//                 />
//               </svg>
//             ) : (
//               <>Log In</>
//             )}
//           </button>

//           <div className="relative py-1">
//             <div className="absolute inset-0 flex items-center">
//               <div className="w-full border-t border-slate-200/80" />
//             </div>
//             <div className="relative flex justify-center">
//               <span className="bg-white/70 px-3 text-xs font-medium uppercase tracking-wide text-slate-500 backdrop-blur-sm rounded-full">
//                 Biometric Sign In
//               </span>
//             </div>
//           </div>

//           <button
//             type="button"
//             onClick={handlePasswordlessBiometricLogin}
//             disabled={isLoading || isBioLoading || loadingCompanies || !companyCode}
//             className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-medium text-emerald-800 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             {isBioLoading ? (
//               <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
//                 <circle
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                   fill="none"
//                   className="opacity-25"
//                 />
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8V0A12 12 0 002 12h2z"
//                 />
//               </svg>
//             ) : (
//               <>
//                 <FiShield className="h-5 w-5" />
//                 Login with Biometrics
//               </>
//             )}
//           </button>

//           <button
//             type="button"
//             onClick={handleBiometricLogin}
//             disabled={
//               isLoading ||
//               isBioLoading ||
//               loadingCompanies ||
//               !companyCode ||
//               !form.USER_CODE.trim()
//             }
//             className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white/90 px-4 py-3 font-medium text-sky-800 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             {isBioLoading ? (
//               <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
//                 <circle
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                   fill="none"
//                   className="opacity-25"
//                 />
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8V0A12 12 0 002 12h2z"
//                 />
//               </svg>
//             ) : (
//               <>
//                 <FiShield className="h-5 w-5" />
//                 Login with User ID + Biometrics
//               </>
//             )}
//           </button>

//           <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
//             <span className="font-semibold">Tip:</span> Use{" "}
//             <span className="font-semibold">Login with Biometrics</span> first.
//             If no device credential is found, enter your User ID and use{" "}
//             <span className="font-semibold">Login with User ID + Biometrics</span>.
//           </div>
//         </form>

//         <div className="mt-6 text-center">
//           <button
//             onClick={onSwitchToRegister}
//             className="text-sm text-slate-700 hover:underline"
//           >
//             Don’t have an account? <span className="text-sky-700">Register</span>
//           </button>
//           <p className="mt-3 text-xs text-slate-500">
//             © {new Date().getFullYear()} NAYSA. All rights reserved.
//           </p>
//         </div>
//       </div>
//     </div>
//   </div>
// );
// }






// import React, { useEffect, useState, useRef } from "react";
// import {
//   FiUser,
//   FiLock,
//   FiEye,
//   FiEyeOff,
//   FiGlobe,
//   FiShield,
// } from "react-icons/fi";
// import Swal from "sweetalert2";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "./AuthContext.jsx";
// import {
//   apiClient,
//   setTenant,
//   bioLoginOptions,
//   bioLoginOptionsPasswordless,
// } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
// import {
//   prepareLoginPublicKey,
//   serializeLoginCredential,
// } from "@/NAYSA Cloud/Authentication/webauthn.js";

// function normalizeCompaniesPayload(raw) {
//   let arr = [];
//   if (Array.isArray(raw)) arr = raw;
//   else if (Array.isArray(raw?.data)) arr = raw.data;
//   else if (raw?.data && typeof raw.data === "object") arr = Object.values(raw.data);
//   else if (raw && typeof raw === "object") arr = Object.values(raw);

//   return arr.map((r) => {
//     const get = (o, ...keys) => keys.reduce((v, k) => v ?? o?.[k], undefined);
//     const code =
//       get(r, "code", "CODE", "Code") ??
//       get(r, "database", "DATABASE", "Database") ??
//       "";
//     const company =
//       get(r, "company", "COMPANY", "Company") ??
//       get(r, "database", "DATABASE", "Database") ??
//       get(r, "code", "CODE", "Code") ??
//       "";
//     const database = get(r, "database", "DATABASE", "Database") ?? "";

//     return {
//       code: String(code || "").trim(),
//       company: String(company || "").trim(),
//       database: String(database || "").trim(),
//     };
//   });
// }

// export default function Login({ onSwitchToRegister, onForgot }) {
//   const { login, loginWithBiometric, loginWithBiometricPasswordless } = useAuth();
//   const navigate = useNavigate();

//   const [form, setForm] = useState({ USER_CODE: "", PASSWORD: "" });
//   const [companies, setCompanies] = useState([]);
//   const [companyCode, setCompanyCode] = useState(
//     localStorage.getItem("companyCode") || ""
//   );
//   const [loadingCompanies, setLoadingCompanies] = useState(true);

//   const [isLoading, setIsLoading] = useState(false);
//   const [isBioLoading, setIsBioLoading] = useState(false);
//   const [showPwd, setShowPwd] = useState(false);
//   const [capsOn, setCapsOn] = useState(false);
//   const pwdRef = useRef(null);

//   useEffect(() => {
//     let alive = true;

//     (async () => {
//       try {
//         setLoadingCompanies(true);
//         const { data } = await apiClient.get("/companies");
//         const options = normalizeCompaniesPayload(data).filter(
//           (x) => x.code || x.database
//         );

//         if (!alive) return;
//         setCompanies(options);

//         if (!companyCode && options.length === 1) {
//           setCompanyCode(options[0].code || options[0].database || "");
//         } else if (
//           companyCode &&
//           !options.some((o) => o.code === companyCode || o.database === companyCode)
//         ) {
//           if (options[0]) {
//             setCompanyCode(options[0].code || options[0].database || "");
//           }
//         }
//       } catch (e) {
//         Swal.fire({
//           icon: "error",
//           title: "Unable to load companies",
//           text:
//             e?.response?.data?.message ||
//             e?.message ||
//             "Please check the /api/companies endpoint.",
//         });
//       } finally {
//         if (alive) setLoadingCompanies(false);
//       }
//     })();

//     return () => {
//       alive = false;
//     };
//   }, [companyCode]);

//   useEffect(() => {
//     if (companyCode) localStorage.setItem("companyCode", companyCode);
//   }, [companyCode]);

//   const setBioAuthInProgress = (value) => {
//     try {
//       if (value) sessionStorage.setItem("bioAuthInProgress", "1");
//       else sessionStorage.removeItem("bioAuthInProgress");
//     } catch {}
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((s) => ({ ...s, [name]: value }));
//   };

//   const handleCaps = (e) =>
//     setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.USER_CODE.trim() || !form.PASSWORD) return;

//     if (!companyCode) {
//       await Swal.fire({
//         icon: "warning",
//         title: "Select Company",
//         text: "Please choose a company before logging in.",
//       });
//       return;
//     }

//     setIsLoading(true);
//     try {
//       await login({
//         companyCode,
//         USER_CODE: form.USER_CODE.trim(),
//         PASSWORD: form.PASSWORD,
//       });

//       await Swal.fire({
//         toast: true,
//         position: "top-end",
//         icon: "success",
//         title: "Welcome back!",
//         showConfirmButton: false,
//         timer: 1800,
//         timerProgressBar: true,
//       });

//       navigate("/", { replace: true });
//     } catch (err) {
//       const status = err?.response?.status;
//       const code = err?.response?.data?.code;
//       const msg =
//         err?.response?.data?.message ||
//         err?.message ||
//         "Please try again.";

//       if (status === 403 && code === "PENDING") {
//         await Swal.fire({
//           icon: "info",
//           title: "Awaiting System Administrator Approval",
//           html: `
//             <p style="font-size: 14px; color: #1f2937;">
//               Your account is currently <strong>pending activation</strong>.<br/>
//               Please wait for the administrator to approve your account and send a temporary password.
//             </p>
//           `,
//           confirmButtonText: "OK",
//           confirmButtonColor: "#1e3a8a",
//           background: "#f9fafb",
//           iconColor: "#2563eb",
//         });
//         return;
//       }

//       if (status === 403 && code === "INACTIVE") {
//         await Swal.fire({
//           icon: "error",
//           title: "Account Inactive",
//           text:
//             msg ||
//             "Your account has been deactivated. Please contact the administrator.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       if (status === 429 && code === "SEAT_LIMIT") {
//         await Swal.fire({
//           icon: "warning",
//           title: "Login Limit Reached",
//           text:
//             msg || "Maximum concurrent users reached. Please try again later.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       await Swal.fire({
//         icon: "error",
//         title: "Login failed",
//         text: msg,
//         confirmButtonText: "OK",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handlePasswordlessBiometricLogin = async () => {
//     try {
//       if (!companyCode) {
//         await Swal.fire({
//           icon: "warning",
//           title: "Select Company",
//           text: "Please choose a company before logging in.",
//         });
//         return;
//       }

//       if (
//         !window.PublicKeyCredential ||
//         typeof navigator.credentials?.get !== "function"
//       ) {
//         await Swal.fire({
//           icon: "error",
//           title: "Biometric Login Not Supported",
//           text: "This browser or device does not support biometric login.",
//         });
//         return;
//       }

//       setBioAuthInProgress(true);
//       setIsBioLoading(true);
//       setTenant(companyCode);

//       const optionRes = await bioLoginOptionsPasswordless();

//       if (!optionRes?.success || !optionRes?.data) {
//         throw new Error(
//           optionRes?.message || "Failed to load biometric login options."
//         );
//       }

//       const publicKey = prepareLoginPublicKey(optionRes.data);

//       const credential = await navigator.credentials.get({ publicKey });

//       if (!credential) {
//         throw new Error("Biometric authentication was cancelled.");
//       }

//       const payload = {
//         credential: serializeLoginCredential(credential),
//       };

//       await loginWithBiometricPasswordless({
//         companyCode,
//         payload,
//       });

//       await Swal.fire({
//         toast: true,
//         position: "top-end",
//         icon: "success",
//         title: "Welcome back!",
//         showConfirmButton: false,
//         timer: 1800,
//         timerProgressBar: true,
//       });

//       navigate("/", { replace: true });
//     } catch (err) {
//       const msg =
//         err?.response?.data?.message ||
//         err?.message ||
//         "Unable to login using biometrics.";

//       if (err?.name === "NotAllowedError") {
//         await Swal.fire({
//           icon: "info",
//           title: "Biometric Login Cancelled",
//           text: "Authentication was cancelled or timed out.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       await Swal.fire({
//         icon: "error",
//         title: "Biometric Login Failed",
//         text: msg,
//         confirmButtonText: "OK",
//       });
//     } finally {
//       setBioAuthInProgress(false);
//       setIsBioLoading(false);
//     }
//   };

//   const handleBiometricLogin = async () => {
//     try {
//       if (!companyCode) {
//         await Swal.fire({
//           icon: "warning",
//           title: "Select Company",
//           text: "Please choose a company before logging in.",
//         });
//         return;
//       }

//       if (!form.USER_CODE.trim()) {
//         await Swal.fire({
//           icon: "warning",
//           title: "User ID Required",
//           text: "Please enter your User ID first.",
//         });
//         return;
//       }

//       if (
//         !window.PublicKeyCredential ||
//         typeof navigator.credentials?.get !== "function"
//       ) {
//         await Swal.fire({
//           icon: "error",
//           title: "Biometric Login Not Supported",
//           text: "This browser or device does not support biometric login.",
//         });
//         return;
//       }

//       setBioAuthInProgress(true);
//       setIsBioLoading(true);
//       setTenant(companyCode);

//       const optionRes = await bioLoginOptions(form.USER_CODE.trim());

//       if (!optionRes?.success || !optionRes?.data) {
//         throw new Error(
//           optionRes?.message || "Failed to load biometric login options."
//         );
//       }

//       const publicKey = prepareLoginPublicKey(optionRes.data);

//       const credential = await navigator.credentials.get({
//         publicKey,
//       });

//       if (!credential) {
//         throw new Error("Biometric authentication was cancelled.");
//       }

//       const payload = {
//         userCode: form.USER_CODE.trim(),
//         credential: serializeLoginCredential(credential),
//       };

//       await loginWithBiometric({
//         companyCode,
//         payload,
//       });

//       await Swal.fire({
//         toast: true,
//         position: "top-end",
//         icon: "success",
//         title: "Welcome back!",
//         showConfirmButton: false,
//         timer: 1800,
//         timerProgressBar: true,
//       });

//       navigate("/", { replace: true });
//     } catch (err) {
//       const status = err?.response?.status;
//       const code = err?.response?.data?.code;
//       const msg =
//         err?.response?.data?.message ||
//         err?.message ||
//         "Unable to login using biometrics.";

//       if (err?.name === "NotAllowedError") {
//         await Swal.fire({
//           icon: "info",
//           title: "Biometric Login Cancelled",
//           text: "Authentication was cancelled or timed out.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       if (status === 403 && code === "PENDING") {
//         await Swal.fire({
//           icon: "info",
//           title: "Awaiting System Administrator Approval",
//           html: `
//             <p style="font-size: 14px; color: #1f2937;">
//               Your account is currently <strong>pending activation</strong>.<br/>
//               Please wait for the administrator to approve your account and send a temporary password.
//             </p>
//           `,
//           confirmButtonText: "OK",
//           confirmButtonColor: "#1e3a8a",
//           background: "#f9fafb",
//           iconColor: "#2563eb",
//         });
//         return;
//       }

//       if (status === 403 && code === "INACTIVE") {
//         await Swal.fire({
//           icon: "error",
//           title: "Account Inactive",
//           text:
//             msg ||
//             "Your account has been deactivated. Please contact the administrator.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       if (status === 429 && code === "SEAT_LIMIT") {
//         await Swal.fire({
//           icon: "warning",
//           title: "Login Limit Reached",
//           text:
//             msg || "Maximum concurrent users reached. Please try again later.",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       await Swal.fire({
//         icon: "error",
//         title: "Biometric Login Failed",
//         text: msg,
//         confirmButtonText: "OK",
//       });
//     } finally {
//       setBioAuthInProgress(false);
//       setIsBioLoading(false);
//     }
//   };

//   return (
//     <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(to_bottom,#7392b7,#d8e1e9)]">
//       <div className="pointer-events-none absolute inset-0 -z-10">
//         <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-300/30 to-sky-200/30 blur-3xl" />
//         <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-tr from-purple-500/25 to-fuchsia-400/25 blur-3xl" />
//       </div>

//       <div className="mx-auto flex max-w-6xl flex-col items-center justify-start px-4 pt-6 pb-24 md:pt-10 lg:pt-12">
//         <div className="mb-3 flex flex-col items-center text-center md:mb-4">
//           <img
//             src="/naysa_logo.png"
//             alt="NAYSA Logo"
//             className="w-40 drop-shadow-md md:w-44"
//           />
//           <h1 className="mt-2 text-2xl font-bold tracking-tight text-blue-900 md:text-3xl">
//             NAYSA Financials Cloud
//           </h1>
//         </div>

//         <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/40 p-6 shadow-xl backdrop-blur-md dark:bg-white/10">
//           <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-4">
//             <label className="block">
//               <span className="mb-1 block text-sm font-medium text-slate-700">
//                 Company
//                 {!loadingCompanies && (
//                   <span className="ml-2 text-xs text-slate-500">
//                     ({companies.length} found)
//                   </span>
//                 )}
//               </span>
//               <div className="relative">
//                 <FiGlobe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                 <select
//                   value={companyCode}
//                   onChange={(e) => setCompanyCode(e.target.value)}
//                   disabled={loadingCompanies || isLoading || isBioLoading}
//                   className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
//                   required
//                 >
//                   <option value="" disabled>
//                     {loadingCompanies ? "Loading companies…" : "Select a company"}
//                   </option>
//                   {companies.map((c) => {
//                     const value = c.code || c.database;
//                     const label = c.company || value || "(unnamed)";
//                     return (
//                       <option key={value || label} value={value}>
//                         {label}
//                       </option>
//                     );
//                   })}
//                 </select>
//               </div>
//             </label>

//             <label className="block">
//               <span className="mb-1 block text-sm font-medium text-slate-700">
//                 User ID
//               </span>
//               <div className="relative">
//                 <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                 <input
//                   type="text"
//                   name="USER_CODE"
//                   autoComplete="username"
//                   value={form.USER_CODE}
//                   onChange={handleChange}
//                   className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
//                   placeholder="Enter your user ID"
//                 />
//               </div>
//               <p className="mt-1 text-xs text-slate-500">
//                 Needed only for password login or biometric fallback.
//               </p>
//             </label>

//             <label className="block">
//               <div className="mb-1 flex items-center justify-between">
//                 <span className="text-sm font-medium text-slate-700">
//                   Password
//                 </span>
//                 {capsOn && (
//                   <span className="text-xs font-semibold text-white">
//                     Caps Lock is ON
//                   </span>
//                 )}
//               </div>
//               <div className="relative">
//                 <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                 <input
//                   ref={pwdRef}
//                   type={showPwd ? "text" : "password"}
//                   name="PASSWORD"
//                   autoComplete="current-password"
//                   value={form.PASSWORD}
//                   onChange={handleChange}
//                   onKeyUp={handleCaps}
//                   onKeyDown={handleCaps}
//                   className="w-full rounded-xl border border-slate-200 bg-white/90 py-3 pl-10 pr-12 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
//                   placeholder="••••••••"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPwd((s) => !s)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
//                   aria-label={showPwd ? "Hide password" : "Show password"}
//                 >
//                   {showPwd ? (
//                     <FiEyeOff className="h-5 w-5" />
//                   ) : (
//                     <FiEye className="h-5 w-5" />
//                   )}
//                 </button>
//               </div>
//             </label>

//             <div className="flex justify-end pt-1">
//               <button
//                 type="button"
//                 onClick={onForgot}
//                 className="text-sm font-medium text-sky-700 hover:text-sky-600"
//               >
//                 Forgot password?
//               </button>
//             </div>

//             <button
//               type="submit"
//               disabled={
//                 isLoading ||
//                 isBioLoading ||
//                 loadingCompanies ||
//                 !companyCode ||
//                 !form.USER_CODE.trim() ||
//                 !form.PASSWORD
//               }
//               className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-3 font-medium text-white shadow-lg shadow-sky-600/20 transition hover:from-sky-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               {isLoading ? (
//                 <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
//                   <circle
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                     fill="none"
//                     className="opacity-25"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0A12 12 0 002 12h2z"
//                   />
//                 </svg>
//               ) : (
//                 <>Log In</>
//               )}
//             </button>

//             <div className="relative py-1">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-slate-200/80" />
//               </div>
//               <div className="relative flex justify-center">
//                 <span className="rounded-full bg-white/70 px-3 text-xs font-medium uppercase tracking-wide text-slate-500 backdrop-blur-sm">
//                   Biometric Sign In
//                 </span>
//               </div>
//             </div>

//             <button
//               type="button"
//               onClick={handlePasswordlessBiometricLogin}
//               disabled={isLoading || isBioLoading || loadingCompanies || !companyCode}
//               className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-medium text-emerald-800 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               {isBioLoading ? (
//                 <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
//                   <circle
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                     fill="none"
//                     className="opacity-25"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0A12 12 0 002 12h2z"
//                   />
//                 </svg>
//               ) : (
//                 <>
//                   <FiShield className="h-5 w-5" />
//                   Login with Biometrics
//                 </>
//               )}
//             </button>

//             <button
//               type="button"
//               onClick={handleBiometricLogin}
//               disabled={
//                 isLoading ||
//                 isBioLoading ||
//                 loadingCompanies ||
//                 !companyCode ||
//                 !form.USER_CODE.trim()
//               }
//               className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white/90 px-4 py-3 font-medium text-sky-800 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               {isBioLoading ? (
//                 <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
//                   <circle
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                     fill="none"
//                     className="opacity-25"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0A12 12 0 002 12h2z"
//                   />
//                 </svg>
//               ) : (
//                 <>
//                   <FiShield className="h-5 w-5" />
//                   Login with User ID + Biometrics
//                 </>
//               )}
//             </button>

//             <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
//               <span className="font-semibold">Tip:</span> Use{" "}
//               <span className="font-semibold">Login with Biometrics</span> first.
//               If no device credential is found, enter your User ID and use{" "}
//               <span className="font-semibold">Login with User ID + Biometrics</span>.
//             </div>
//           </form>

//           <div className="mt-6 text-center">
//             <button
//               onClick={onSwitchToRegister}
//               className="text-sm text-slate-700 hover:underline"
//             >
//               Don’t have an account? <span className="text-sky-700">Register</span>
//             </button>
//             <p className="mt-3 text-xs text-slate-500">
//               © {new Date().getFullYear()} NAYSA. All rights reserved.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useState, useRef } from "react";
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiGlobe,
} from "react-icons/fi";
import { Fingerprint, ScanLine } from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import {
  apiClient,
  setTenant,
  bioLoginOptionsPasswordless,
} from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import {
  prepareLoginPublicKey,
  serializeLoginCredential,
} from "@/NAYSA Cloud/Authentication/webauthn.js";

function normalizeCompaniesPayload(raw) {
  let arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (Array.isArray(raw?.data)) arr = raw.data;
  else if (raw?.data && typeof raw.data === "object") arr = Object.values(raw.data);
  else if (raw && typeof raw === "object") arr = Object.values(raw);

  return arr.map((r) => {
    const get = (o, ...keys) => keys.reduce((v, k) => v ?? o?.[k], undefined);
    const code =
      get(r, "code", "CODE", "Code") ??
      get(r, "database", "DATABASE", "Database") ??
      "";
    const company =
      get(r, "company", "COMPANY", "Company") ??
      get(r, "database", "DATABASE", "Database") ??
      get(r, "code", "CODE", "Code") ??
      "";
    const database = get(r, "database", "DATABASE", "Database") ?? "";

    return {
      code: String(code || "").trim(),
      company: String(company || "").trim(),
      database: String(database || "").trim(),
    };
  });
}

export default function Login({ onSwitchToRegister, onForgot }) {
  const { login, loginWithBiometric } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ USER_CODE: "", PASSWORD: "" });
  const [companies, setCompanies] = useState([]);
  const [companyCode, setCompanyCode] = useState(
    localStorage.getItem("companyCode") || ""
  );
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isBioLoading, setIsBioLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const pwdRef = useRef(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingCompanies(true);
        const { data } = await apiClient.get("/companies");
        const options = normalizeCompaniesPayload(data).filter(
          (x) => x.code || x.database
        );

        if (!alive) return;
        setCompanies(options);

        if (!companyCode && options.length === 1) {
          setCompanyCode(options[0].code || options[0].database || "");
        } else if (
          companyCode &&
          !options.some((o) => o.code === companyCode || o.database === companyCode)
        ) {
          if (options[0]) {
            setCompanyCode(options[0].code || options[0].database || "");
          }
        }
      } catch (e) {
        Swal.fire({
          icon: "error",
          title: "Unable to load companies",
          text:
            e?.response?.data?.message ||
            e?.message ||
            "Please check the /api/companies endpoint.",
        });
      } finally {
        if (alive) setLoadingCompanies(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [companyCode]);

  useEffect(() => {
    if (companyCode) localStorage.setItem("companyCode", companyCode);
  }, [companyCode]);

  const setBioAuthInProgress = (value) => {
    try {
      if (value) sessionStorage.setItem("bioAuthInProgress", "1");
      else sessionStorage.removeItem("bioAuthInProgress");
    } catch {}
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleCaps = (e) =>
    setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.USER_CODE.trim() || !form.PASSWORD) return;

    if (!companyCode) {
      await Swal.fire({
        icon: "warning",
        title: "Select Company",
        text: "Please choose a company before logging in.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await login({
        companyCode,
        USER_CODE: form.USER_CODE.trim(),
        PASSWORD: form.PASSWORD,
      });

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Welcome back!",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
      });

      navigate("/", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Please try again.";

      if (status === 403 && code === "PENDING") {
        await Swal.fire({
          icon: "info",
          title: "Awaiting System Administrator Approval",
          html: `
            <p style="font-size: 14px; color: #1f2937;">
              Your account is currently <strong>pending activation</strong>.<br/>
              Please wait for the administrator to approve your account and send a temporary password.
            </p>
          `,
          confirmButtonText: "OK",
          confirmButtonColor: "#1e3a8a",
          background: "#f9fafb",
          iconColor: "#2563eb",
        });
        return;
      }

      if (status === 403 && code === "INACTIVE") {
        await Swal.fire({
          icon: "error",
          title: "Account Inactive",
          text:
            msg ||
            "Your account has been deactivated. Please contact the administrator.",
          confirmButtonText: "OK",
        });
        return;
      }

      if (status === 429 && code === "SEAT_LIMIT") {
        await Swal.fire({
          icon: "warning",
          title: "Login Limit Reached",
          text:
            msg || "Maximum concurrent users reached. Please try again later.",
          confirmButtonText: "OK",
        });
        return;
      }

      await Swal.fire({
        icon: "error",
        title: "Login failed",
        text: msg,
        confirmButtonText: "OK",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      if (!companyCode) {
        await Swal.fire({
          icon: "warning",
          title: "Select Company",
          text: "Please choose a company before logging in.",
        });
        return;
      }

      if (
        !window.PublicKeyCredential ||
        typeof navigator.credentials?.get !== "function"
      ) {
        await Swal.fire({
          icon: "error",
          title: "Biometric Login Not Supported",
          text: "This browser or device does not support biometric login.",
        });
        return;
      }

      setBioAuthInProgress(true);
      setIsBioLoading(true);
      setTenant(companyCode);

      const optionRes = await bioLoginOptionsPasswordless();

      if (!optionRes?.success || !optionRes?.data) {
        throw new Error(
          optionRes?.message || "Failed to load biometric login options."
        );
      }

      const publicKey = prepareLoginPublicKey(optionRes.data);

      const credential = await navigator.credentials.get({ publicKey });

      if (!credential) {
        throw new Error("Biometric authentication was cancelled.");
      }

      const payload = {
        credential: serializeLoginCredential(credential),
      };

      await loginWithBiometric({
        companyCode,
        payload,
      });

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Welcome back!",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
      });

      navigate("/", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to login using biometrics.";

      if (err?.name === "NotAllowedError") {
        await Swal.fire({
          icon: "info",
          title: "Biometric Login Cancelled",
          text: "Authentication was cancelled or timed out.",
          confirmButtonText: "OK",
        });
        return;
      }

      await Swal.fire({
        icon: "error",
        title: "Biometric Login Failed",
        text: msg,
        confirmButtonText: "OK",
      });
    } finally {
      setBioAuthInProgress(false);
      setIsBioLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(to_bottom,#7392b7,#d8e1e9)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-300/30 to-sky-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-tr from-purple-500/25 to-fuchsia-400/25 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-start px-4 pt-6 pb-24 md:pt-10 lg:pt-12">
        <div className="mb-3 flex flex-col items-center text-center md:mb-4">
          <img
            src="/naysa_logo.png"
            alt="NAYSA Logo"
            className="w-40 drop-shadow-md md:w-44"
          />
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-blue-900 md:text-3xl">
            NAYSA Financials Cloud
          </h1>
          <p className="mt-2 text-sm text-slate-700">
            Sign in with your account or use biometrics for faster access.
          </p>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/40 p-6 shadow-xl backdrop-blur-md dark:bg-white/10">
          <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Company
                {!loadingCompanies && (
                  <span className="ml-2 text-xs text-slate-500">
                    ({companies.length} found)
                  </span>
                )}
              </span>
              <div className="relative">
                <FiGlobe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  disabled={loadingCompanies || isLoading || isBioLoading}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                  required
                >
                  <option value="" disabled>
                    {loadingCompanies ? "Loading companies…" : "Select a company"}
                  </option>
                  {companies.map((c) => {
                    const value = c.code || c.database;
                    const label = c.company || value || "(unnamed)";
                    return (
                      <option key={value || label} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                User ID
              </span>
              <div className="relative">
                <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="USER_CODE"
                  autoComplete="username"
                  value={form.USER_CODE}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                  placeholder="Enter your user ID"
                />
              </div>
            </label>

            <label className="block">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Password
                </span>
                {capsOn && (
                  <span className="text-xs font-semibold text-white">
                    Caps Lock is ON
                  </span>
                )}
              </div>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={pwdRef}
                  type={showPwd ? "text" : "password"}
                  name="PASSWORD"
                  autoComplete="current-password"
                  value={form.PASSWORD}
                  onChange={handleChange}
                  onKeyUp={handleCaps}
                  onKeyDown={handleCaps}
                  className="w-full rounded-xl border border-slate-200 bg-white/90 py-3 pl-10 pr-12 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </label>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onForgot}
                className="text-sm font-medium text-sky-700 hover:text-sky-600"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={
                isLoading ||
                isBioLoading ||
                loadingCompanies ||
                !companyCode ||
                !form.USER_CODE.trim() ||
                !form.PASSWORD
              }
              className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-3 font-medium text-white shadow-lg shadow-sky-600/20 transition hover:from-sky-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="opacity-25"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0A12 12 0 002 12h2z"
                  />
                </svg>
              ) : (
                <>Log In</>
              )}
            </button>

            <div className="pt-2">
              <div className="mb-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                or use biometrics
              </div>

              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={isLoading || isBioLoading || loadingCompanies || !companyCode}
                className="group w-full rounded-2xl border border-sky-200/80 bg-white/80 p-5 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-blue-200 shadow-inner">
                    <ScanLine className="absolute h-12 w-12 text-sky-500/40" />
                    <Fingerprint className="relative h-12 w-12 text-sky-700" />
                  </div>

                  <div className="text-center">
                    <div className="text-base font-semibold text-slate-800">
                      Login with Biometrics
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Touch fingerprint or face recognition to sign in automatically
                    </div>
                  </div>

                  {isBioLoading && (
                    <svg className="h-5 w-5 animate-spin text-sky-700" viewBox="0 0 24 24" aria-hidden="true">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="opacity-25"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0A12 12 0 002 12h2z"
                      />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onSwitchToRegister}
              className="text-sm text-slate-700 hover:underline"
            >
              Don’t have an account? <span className="text-sky-700">Register</span>
            </button>
            <p className="mt-3 text-xs text-slate-500">
              © {new Date().getFullYear()} NAYSA. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}