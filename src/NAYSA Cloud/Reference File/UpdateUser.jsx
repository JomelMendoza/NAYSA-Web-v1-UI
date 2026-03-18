import { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import BranchLookupModal from "@/NAYSA Cloud/Lookup/SearchBranchRef";
import RCLookupModal from "@/NAYSA Cloud/Lookup/SearchRCMast";
import UserRoleModal from "@/NAYSA Cloud/Lookup/SetUserRole";
import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer.jsx";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrashAlt,
  faPlus,
  faPrint,
  faChevronDown,
  faFileCsv,
  faFileExcel,
  faFilePdf,
  faSave,
  faUndo,
  faUsers,
  faKey,
  faSpinner,
  faInfoCircle,
  faVideo,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";

import {
  reftables,
  reftablesPDFGuide,
  reftablesVideoGuide,
} from "@/NAYSA Cloud/Global/reftable";

import {
  useSwalErrorAlert,
  useSwalSuccessAlert,
  useSwalErrorAlertAPI,
  useSwalDeleteConfirm,
  useSwalDeleteRecord,
} from "@/NAYSA Cloud/Global/behavior";

const UpdateUser = () => {
  const docType = "UserUpdate";
  const { user } = useAuth();

  const documentTitle = reftables[docType];
  const pdfLink = reftablesPDFGuide[docType];
  const videoLink = reftablesVideoGuide[docType];

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [rcCode, setRcCode] = useState("");
  const [rcName, setRcName] = useState("");
  const [rcModalOpen, setRcModalOpen] = useState(false);
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);
  const [position, setPosition] = useState("");
  const [emailAdd, setEmailAdd] = useState("");
  const [viewCostamt, setViewCostamt] = useState("N");
  const [editUprice, setEditUprice] = useState("N");
  const [active, setActive] = useState("Yes");

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [isOpenExport, setOpenExport] = useState(false);
  const [isOpenGuide, setOpenGuide] = useState(false);

  const [userTypes, setUserTypes] = useState([""]);

  const exportRef = useRef(null);
  const guideRef = useRef(null);

  useEffect(() => {
    if (users.length > 0) {
      const uniqueTypes = [
        ...new Set(users.map((u) => u.userType).filter(Boolean)),
      ];
      setUserTypes(["", ...uniqueTypes]);
    }
  }, [users]);

  const handleOpenBranchModal = () => {
    if (isEditing) setBranchModalOpen(true);
  };

  const handleCloseBranchModal = (selectedBranch = null) => {
    setBranchModalOpen(false);
    if (selectedBranch) {
      setBranchCode(selectedBranch.branchCode || "");
      setBranchName(selectedBranch.branchName || "");
    }
  };

  const handleOpenRCModal = () => {
    if (isEditing) setRcModalOpen(true);
  };

  const handleCloseRCModal = (selectedRC = null) => {
    setRcModalOpen(false);
    if (selectedRC) {
      setRcCode(selectedRC.rcCode || "");
      setRcName(selectedRC.rcName || "");
    }
  };

  const LoadingSpinner = () => (
    <div className="global-tran-spinner-main-div-ui">
      <div className="global-tran-spinner-sub-div-ui">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          size="2x"
          className="text-blue-500 mb-2"
        />
        <p>Please wait...</p>
      </div>
    </div>
  );

  const activeLabel = (code) => {
    if (code === "Y") return "Yes";
    if (code === "P") return "Pending";
    if (code === "N") return "No";
    return "-";
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/load", {
        params: {
          Status:
            activeTab === "active"
              ? "Active"
              : activeTab === "pending"
              ? "Pending"
              : "Inactive",
        },
      });

      let userData = [];

      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        if (data.data[0]?.result) {
          try {
            userData = JSON.parse(data.data[0].result);
          } catch (parseError) {
            console.error("Error parsing JSON result:", parseError);
            userData = [];
          }
        }
      } else if (data?.result) {
        try {
          userData = JSON.parse(data.result);
        } catch (parseError) {
          console.error("Error parsing JSON result:", parseError);
          userData = [];
        }
      } else if (Array.isArray(data)) {
        userData = data;
      }

      if (Array.isArray(userData)) {
        const filteredUsers = userData.filter(
          (u) =>
            u &&
            (u.userCode ||
              u.userName ||
              u.userType ||
              u.emailAdd ||
              u.branchCode ||
              u.position ||
              u.rcCode ||
              u.active ||
              u.viewCostamt ||
              u.editUprice)
        );

        const normalized = filteredUsers.map((u) => ({
          ...u,
          branchName:
            u.branchName ??
            u.b?.branchName ??
            u.b?.branchname ??
            u.branchCode ??
            "",
          rcName: u.rcName ?? u.c?.rcName ?? u.c?.rcname ?? u.rcCode ?? "",
        }));

        setUsers(normalized);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      await useSwalErrorAlertAPI(
        "Error",
        `Failed to load users: ${
          error?.response?.data?.message || error.message || "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideExport =
        exportRef.current && !exportRef.current.contains(event.target);
      const clickedOutsideGuide =
        guideRef.current && !guideRef.current.contains(event.target);

      if (clickedOutsideExport) setOpenExport(false);
      if (clickedOutsideGuide) setOpenGuide(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saving && isEditing) {
          handleSaveUser();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, isEditing, userId, userName, userType, branchCode, rcCode, viewCostamt, editUprice, active, position, emailAdd, selectedUser]);

  useEffect(() => {
    let timer;
    if (loading || saving) {
      timer = setTimeout(() => setShowSpinner(true), 200);
    } else {
      setShowSpinner(false);
    }
    return () => clearTimeout(timer);
  }, [loading, saving]);

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const resetForm = () => {
    setUserId("");
    setUserName("");
    setUserType("");
    setBranchCode("");
    setBranchName("");
    setRcCode("");
    setRcName("");
    setPosition("");
    setEmailAdd("");
    setActive("Yes");
    setViewCostamt("N");
    setEditUprice("N");
    setSelectedUser(null);
    setIsEditing(false);
  };

  const handleSaveUser = async () => {
    if (!userId?.trim() || !userName?.trim()) {
      await useSwalErrorAlert(
        "Validation Error",
        "Please fill out User ID and User Name."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        json_data: {
          userCode: userId.trim(),
          userName: userName.trim(),
          emailAdd: emailAdd ? emailAdd.trim() : "",
          userType: userType || "",
          branchCode: branchCode || "",
          rcCode: rcCode || "",
          viewCostamt: viewCostamt || "N",
          editUprice: editUprice || "N",
          active: active === "Yes" ? "Y" : active === "Pending" ? "P" : "N",
          position: position ? position.trim() : "",
        },
      };

      const isNewRecord = !selectedUser;

      const response = await apiClient.post("/users/upsert", payload);
      const res = response.data;

      if (res?.success === true || res?.data?.status === "success") {
        if (isNewRecord && active === "Yes") {
          try {
            await apiClient.post("/users/approve", {
              userCode: userId.trim(),
              mode: "admin_add",
            });
          } catch (e) {
            console.warn("Temp password email failed:", e);
          }
        }

        await fetchUsers();

        if (isNewRecord) {
          await useSwalSuccessAlert(
            "Success!",
            "User created successfully. A temporary password has been sent to the user's email."
          );
        } else {
          await useSwalSuccessAlert("Success!", "User updated successfully.");
        }

        resetForm();
      } else {
        await useSwalErrorAlert("Error!", res?.message || "Failed to save user.");
      }
    } catch (error) {
      console.error("Save error:", error);
      await useSwalErrorAlertAPI(
        "Error!",
        error?.response?.data?.message || error.message || "Error saving user."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userToDelete = null) => {
    const targetUser = userToDelete || selectedUser;

    if (!targetUser?.userCode) {
      await useSwalErrorAlert(
        "Validation Error",
        "Please select a user to delete."
      );
      return;
    }

    const confirm = await useSwalDeleteConfirm(
      "Delete this user?",
      `ID: ${targetUser.userCode} | Name: ${targetUser.userName || ""}`,
      "Yes, delete it"
    );

    if (!confirm?.isConfirmed) return;

    try {
      const payload = {
        json_data: {
          userCode: targetUser.userCode,
          userName: targetUser.userName,
          userType: targetUser.userType,
          branchCode: targetUser.branchCode,
          rcCode: targetUser.rcCode,
          viewCostamt: targetUser.viewCostamt || "N",
          editUprice: targetUser.editUprice || "N",
          emailAdd: targetUser.emailAdd || "",
          position: targetUser.position || "",
          active: "N",
        },
      };

      const response = await apiClient.post("/users/upsert", payload);
      const res = response.data;

      if (res?.success === true || res?.data?.status === "success") {
        await useSwalDeleteRecord(
          "Deleted!",
          "User has been successfully deactivated."
        );

        await fetchUsers();

        if (selectedUser?.userCode === targetUser.userCode) {
          resetForm();
        }
      } else {
        const errorMsg =
          res?.message || res?.details || "Failed to deactivate user.";
        await useSwalErrorAlert("Error", errorMsg);
      }
    } catch (error) {
      console.error("Delete error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.details ||
        "Failed to deactivate user.";
      await useSwalErrorAlertAPI("Error", errorMsg);
    }
  };

  const handleEditUser = async (rowUser) => {
    let userData = rowUser;

    if (rowUser.active === "P") setActiveTab("pending");
    if (rowUser.active === "Y") setActiveTab("active");
    if (rowUser.active === "N") setActiveTab("inactive");

    if (
      (!rowUser.branchName && rowUser.branchCode) ||
      (!rowUser.rcName && rowUser.rcCode)
    ) {
      try {
        const { data } = await apiClient.get("/get", {
          params: {
            userCode: rowUser.userCode,
          },
        });

        let fullUserData = null;

        if (data?.data && Array.isArray(data.data) && data.data[0]?.result) {
          const parsedResult = JSON.parse(data.data[0].result);
          if (Array.isArray(parsedResult) && parsedResult.length > 0) {
            fullUserData = parsedResult[0];
          }
        } else if (data?.result) {
          const parsedResult = JSON.parse(data.result);
          if (Array.isArray(parsedResult) && parsedResult.length > 0) {
            fullUserData = parsedResult[0];
          }
        }

        if (fullUserData) {
          userData = { ...rowUser, ...fullUserData };
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }

    setUserId(userData.userCode || "");
    setUserName(userData.userName || "");
    setUserType(userData.userType || "");
    setBranchCode(userData.branchCode || "");
    setBranchName(userData.branchName || "");
    setRcCode(userData.rcCode || "");
    setRcName(userData.rcName || "");
    setPosition(userData.position || "");
    setEmailAdd(userData.emailAdd || "");
    setActive(
      userData.active === "Y" ? "Yes" : userData.active === "P" ? "Pending" : "No"
    );
    setViewCostamt(userData.viewCostamt === "Y" ? "Y" : "N");
    setEditUprice(userData.editUprice === "Y" ? "Y" : "N");

    setSelectedUser(userData);
    setIsEditing(true);
  };

  const startNew = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser?.userCode) {
      await useSwalErrorAlert(
        "Validation Error",
        "Please select a user to reset password."
      );
      return;
    }

    const confirmRes = await useSwalDeleteConfirm(
      "Reset Password",
      `Are you sure you want to reset the password for ${selectedUser.userName}?`,
      "Yes, reset it"
    );

    if (!confirmRes?.isConfirmed) return;

    try {
      setShowSpinner(true);

      const { data } = await apiClient.post("/users/request-password-reset", {
        userCode: selectedUser.userCode,
      });

      if (data?.status === "success") {
        await useSwalSuccessAlert(
          "Success",
          "Password reset link has been emailed to the user."
        );
      } else {
        await useSwalErrorAlert(
          "Error",
          data?.message || "Failed to send the reset email."
        );
      }
    } catch (error) {
      console.error("Password reset error:", error);
      const msg = error?.response?.data?.message || error.message || "Request failed.";
      await useSwalErrorAlertAPI("Error", msg);
    } finally {
      setShowSpinner(false);
    }
  };

  const handleReleaseAccount = async () => {
    if (!selectedUser?.userCode) {
      await useSwalErrorAlert(
        "Validation Error",
        "Please select a user to approve account."
      );
      return;
    }

    const confirmRes = await useSwalDeleteConfirm(
      "Approve Account",
      `Are you sure you want to approve the account for ${selectedUser.userName}?`,
      "Yes, approve it"
    );

    if (!confirmRes?.isConfirmed) return;

    try {
      setShowSpinner(true);

      const { data } = await apiClient.post("/users/approve", {
        userCode: selectedUser.userCode,
        mode: "release",
      });

      if (data?.status === "success") {
        await useSwalSuccessAlert(
          "Success",
          "Account approved. A password setup link has been sent."
        );

        setActiveTab("active");
        setSelectedUser(null);
        setIsEditing(false);

        await fetchUsers();
      } else {
        await useSwalErrorAlert("Error", data?.message || "Approval failed.");
      }
    } catch (error) {
      await useSwalErrorAlertAPI(
        "Error",
        error?.response?.data?.message || error.message || "Approval failed."
      );
    } finally {
      setShowSpinner(false);
    }
  };

  const handleExport = async (format) => {
    setOpenExport(false);

    try {
      const payload = {
        json_data: {
          filter:
            activeTab === "active"
              ? "Active"
              : activeTab === "pending"
              ? "Pending"
              : "Inactive",
        },
        format,
      };

      const response = await apiClient.post("/users/export", payload, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const ext = format === "excel" ? "xlsx" : format;
      const fileName = `users_export_${format}_${new Date()
        .toISOString()
        .slice(0, 10)}.${ext}`;

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      await useSwalErrorAlertAPI(
        "Export Error",
        `Failed to export to ${format.toUpperCase()}`
      );
    }
  };

  const handlePDFGuide = () => {
    if (pdfLink) window.open(pdfLink, "_blank");
    setOpenGuide(false);
  };

  const handleVideoGuide = () => {
    if (videoLink) window.open(videoLink, "_blank");
    setOpenGuide(false);
  };

  const tableRows = useMemo(() => {
    return users
      .filter((u) =>
        activeTab === "active"
          ? u.active === "Y"
          : activeTab === "pending"
          ? u.active === "P"
          : u.active === "N"
      )
      .map((u) => ({
        ...u,
        activeLabel: activeLabel(u.active),
        branchDisplay: u.branchName || u.branchCode || "-",
        rcDisplay: u.rcName || u.rcCode || "-",
      }));
  }, [users, activeTab]);

  const tableColumns = useMemo(() => {
    return [
      {
        key: "userCode",
        label: "User ID",
        sortable: true,
        className: "w-[110px] min-w-[110px]",
      },
      {
        key: "userName",
        label: "User Name",
        sortable: true,
        className: "w-[190px] min-w-[190px]",
      },
      {
        key: "userType",
        label: "User Type",
        sortable: true,
        className: "w-[110px] min-w-[110px]",
      },
      {
        key: "branchDisplay",
        label: "Branch",
        sortable: true,
        className: "w-[110px] min-w-[110px]",
      },
      {
        key: "rcDisplay",
        label: "Department",
        sortable: true,
        className: "w-[140px] min-w-[140px]",
      },
      {
        key: "position",
        label: "Position",
        sortable: true,
        className: "w-[180px] min-w-[180px]",
      },
      {
        key: "emailAdd",
        label: "Email Address",
        sortable: true,
        className: "min-w-[280px]",
      },
      {
        key: "activeLabel",
        label: "Active",
        sortable: true,
        className: "w-[90px] min-w-[90px] text-center",
      },
      {
        key: "editAction",
        label: "Edit",
        className: "w-[80px] min-w-[80px] text-center",
        render: (row) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditUser(row);
            }}
            title="Edit"
            className="flex items-center justify-center h-7 w-7 mx-auto rounded bg-blue-500 text-white hover:bg-blue-600 shadow-sm transition"
          >
            <FontAwesomeIcon icon={faEdit} className="text-[12px]" />
          </button>
        ),
      },
      {
        key: "roleAction",
        label: "Set Role",
        className: "w-[95px] min-w-[95px] text-center",
        render: (row) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(row);
              setShowUserRoleModal(true);
            }}
            title="Set Role"
            className="flex items-center justify-center h-7 w-7 mx-auto rounded bg-blue-500 text-white hover:bg-blue-600 shadow-sm transition"
          >
            <FontAwesomeIcon icon={faUserShield} className="text-[12px]" />
          </button>
        ),
      },
      {
        key: "deleteAction",
        label: "Delete",
        className: "w-[85px] min-w-[85px] text-center",
        render: (row) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(row);
              handleDeleteUser(row);
            }}
            title="Delete"
            className="flex items-center justify-center h-7 w-7 mx-auto rounded bg-red-500 text-white hover:bg-red-600 shadow-sm transition"
          >
            <FontAwesomeIcon icon={faTrashAlt} className="text-[12px]" />
          </button>
        ),
      },
    ];
  }, [activeTab, users, selectedUser]);

  return (
    <div className="global-ref-main-div-ui mt-24">
      {(showSpinner || loading || saving) && <LoadingSpinner />}

      {branchModalOpen && (
        <BranchLookupModal
          isOpen={branchModalOpen}
          onClose={handleCloseBranchModal}
        />
      )}

      {rcModalOpen && (
        <RCLookupModal isOpen={rcModalOpen} onClose={handleCloseRCModal} />
      )}

      {showUserRoleModal && selectedUser && (
        <UserRoleModal
          isOpen={showUserRoleModal}
          user={selectedUser}
          onClose={() => setShowUserRoleModal(false)}
        />
      )}

      <div className="fixed mt-4 top-14 left-6 right-6 z-30 global-ref-header-ui flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <h1 className="global-ref-headertext-ui">{documentTitle}</h1>
        </div>

        <div className="flex gap-2 justify-center text-xs flex-wrap">
          <button
            onClick={startNew}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FontAwesomeIcon icon={faPlus} /> Add
          </button>

          <button
            onClick={handleSaveUser}
            className={`bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 ${
              !isEditing || saving ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!isEditing || saving}
            title="Ctrl+S to Save"
          >
            <FontAwesomeIcon icon={faSave} /> Save
          </button>

          <button
            onClick={resetForm}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            disabled={saving}
          >
            <FontAwesomeIcon icon={faUndo} /> Reset
          </button>

          <div ref={exportRef} className="relative">
            <button
              onClick={() => setOpenExport((v) => !v)}
              className="bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <FontAwesomeIcon icon={faPrint} /> Export
              <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
            </button>

            {isOpenExport && (
              <div className="absolute right-0 mt-1 w-40 rounded-lg shadow-lg bg-white ring-1 ring-black/10 z-[60] dark:bg-gray-800">
                <button
                  onClick={() => handleExport("csv")}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900"
                >
                  <FontAwesomeIcon
                    icon={faFileCsv}
                    className="mr-2 text-green-600"
                  />
                  CSV
                </button>
                <button
                  onClick={() => handleExport("excel")}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900"
                >
                  <FontAwesomeIcon
                    icon={faFileExcel}
                    className="mr-2 text-green-600"
                  />
                  Excel
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900"
                >
                  <FontAwesomeIcon
                    icon={faFilePdf}
                    className="mr-2 text-red-600"
                  />
                  PDF
                </button>
              </div>
            )}
          </div>

          <div ref={guideRef} className="relative">
            <button
              onClick={() => setOpenGuide((v) => !v)}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <FontAwesomeIcon icon={faInfoCircle} /> Info
              <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
            </button>

            {isOpenGuide && (
              <div className="absolute right-0 mt-1 w-40 rounded-md shadow-lg bg-white ring-1 ring-black/10 z-[60] dark:bg-gray-800">
                <button
                  onClick={handlePDFGuide}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900"
                >
                  <FontAwesomeIcon
                    icon={faFilePdf}
                    className="mr-2 text-red-600"
                  />
                  User Guide
                </button>
                <button
                  onClick={handleVideoGuide}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900"
                >
                  <FontAwesomeIcon
                    icon={faVideo}
                    className="mr-2 text-blue-600"
                  />
                  Video Guide
                </button>
              </div>
            )}
          </div>

          {selectedUser && selectedUser.active === "Y" && (
            <button
              onClick={handleResetPassword}
              className="bg-purple-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
            >
              <FontAwesomeIcon icon={faKey} /> Reset Password
            </button>
          )}

          {selectedUser && selectedUser.active === "P" && (
            <button
              onClick={handleReleaseAccount}
              className="bg-orange-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700"
            >
              <FontAwesomeIcon icon={faUsers} /> Approve
            </button>
          )}
        </div>
      </div>

      <div className="global-tran-tab-div-ui">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="global-ref-textbox-group-div-ui">
            <FieldRenderer
              id="userId"
              name="userId"
              label="User ID"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={!isEditing || !!selectedUser}
            />

            <FieldRenderer
              id="userName"
              name="userName"
              label="User Name"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={!isEditing}
            />

            <FieldRenderer
              id="userType"
              name="userType"
              label="User Type"
              type="select"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              disabled={!isEditing}
              options={userTypes
                .filter((type) => type !== "")
                .map((type) => ({ value: type, label: type }))}
            />

            <FieldRenderer
              id="active"
              name="active"
              label="Active?"
              type="select"
              value={active}
              onChange={(e) => setActive(e.target.value)}
              disabled={!isEditing}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "Pending", label: "Pending" },
                { value: "No", label: "No" },
              ]}
            />
          </div>

          <div className="global-ref-textbox-group-div-ui">
            <FieldRenderer
              id="branchName"
              name="branchName"
              label="Branch"
              value={branchName || ""}
              onChange={() => {}}
              onLookup={handleOpenBranchModal}
              disabled={!isEditing}
              readOnly
            />

            <FieldRenderer
              id="rcName"
              name="rcName"
              label="Department"
              value={rcName || ""}
              onChange={() => {}}
              onLookup={handleOpenRCModal}
              disabled={!isEditing}
              readOnly
            />

            <FieldRenderer
              id="position"
              name="position"
              label="Position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              disabled={!isEditing}
            />

            <FieldRenderer
              id="emailAdd"
              name="emailAdd"
              label="Email Address"
              type="email"
              value={emailAdd}
              onChange={(e) => setEmailAdd(e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="global-ref-textbox-group-div-ui">
            <FieldRenderer
              id="viewCostamt"
              name="viewCostamt"
              label="View Cost Amount"
              type="select"
              value={viewCostamt || "N"}
              onChange={(e) => setViewCostamt(e.target.value)}
              disabled={!isEditing}
              options={[
                { value: "Y", label: "Yes" },
                { value: "N", label: "No" },
              ]}
            />

            <FieldRenderer
              id="editUprice"
              name="editUprice"
              label="Can Edit Unit Price?"
              type="select"
              value={editUprice}
              onChange={(e) => setEditUprice(e.target.value)}
              disabled={!isEditing}
              options={[
                { value: "Y", label: "Yes" },
                { value: "N", label: "No" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="global-ref-tab-div-ui mt-6">
        <div className="flex flex-row sm:flex-row mb-2">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 font-medium rounded-t-lg ${
              activeTab === "active"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Active Users
          </button>

          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 font-medium rounded-t-lg ${
              activeTab === "pending"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Pending Users
          </button>

          <button
            onClick={() => setActiveTab("inactive")}
            className={`px-4 py-2 font-medium rounded-t-lg ${
              activeTab === "inactive"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Inactive Users
          </button>
        </div>

        <div className="global-ref-table-main-div-ui">
          <div className="global-ref-table-main-div-ui">
            <div className="w-full overflow-x-auto">
              <SearchGlobalReferenceTable
                title={`${documentTitle} - ${
                  activeTab === "active"
                    ? "Active Users"
                    : activeTab === "pending"
                    ? "Pending Users"
                    : "Inactive Users"
                }`}
                data={tableRows}
                columns={tableColumns}
                loading={loading}
                onRowDoubleClick={handleEditUser}
                onRowClick={handleEditUser}
                defaultPageSize={10}
                pageSizeOptions={[10, 20, 50, 100]}
                searchPlaceholder="Search users..."
                emptyMessage="No users found"
                fileName={`users_${activeTab}`}
                enableExport={true}
                enableColumnToggle={true}
                enableColumnGrouping={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateUser;