import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import SearchGlobalReferenceTable from "../Lookup/SearchGlobalReferenceTable";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";

import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSave,
  faUndo,
  faFileExport,
  faInfoCircle,
  faChevronDown,
  faSpinner,
  faFilePdf,
  faVideo,
  faEdit,
  faTrash
} from "@fortawesome/free-solid-svg-icons";

import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar.jsx";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer.jsx";
import {
  reftables,
  reftablesPDFGuide,
  reftablesVideoGuide,
} from "@/NAYSA Cloud/Global/reftable";

import SearchBankRef from "@/NAYSA Cloud/Lookup/SearchBankRef.jsx";

const BankMast = () => {
  const { user } = useAuth();
  const userCode =
    user?.USER_CODE || user?.username || user?.userCode || "SYSTEM";

  const docType = "BankMaster";
  const documentTitle = reftables[docType] || "Bank Master Data";
  const pdfLink = reftablesPDFGuide[docType];
  const videoLink = reftablesVideoGuide[docType];

  const [banks, setBanks] = useState([]);

  const emptyBank = {
    bankCode: "",
    acctCode: "",
    acctName: "",
    bankAcctNo: "",
    bankAcctType: "",
    currCode: "",
    startCheckNo: "",
    lastCheckNo: "",
    autoCk: "Y",
    bankAddr1: "",
    bankAddr2: "",
    bankContact: "",
    bankPosition: "",
    bankTelNo: "",
    bankBranch: "",
    bankTypeCode: "",
    bankTypeName: "",
    __existing: false,
  };
  const [editingBank, setEditingBank] = useState(emptyBank);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  useEffect(() => {
    fetchBanks();
  }, []);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isOpenExport, setOpenExport] = useState(false);
  const [isOpenGuide, setOpenGuide] = useState(false);
  const [isBankTypeModalOpen, setBankTypeModalOpen] = useState(false);

  const guideRef = useRef(null);
  const exportRef = useRef(null);

  // ───────────────────────────
  // Loading Spinner
  // ───────────────────────────
  const LoadingSpinner = () => (
    <div className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-xl px-6 py-4 shadow-xl">
        {saving ? "Saving…" : "Loading…"}
      </div>
    </div>
  );

  // ───────────────────────────
  // Extract Rows Helper
  // ───────────────────────────
  const extractRows = (data) => {
    const result =
      data?.data?.[0]?.result || data?.[0]?.result || data?.result;
    if (!result) return [];
    try {
      return JSON.parse(result) || [];
    } catch {
      return [];
    }
  };

  // ───────────────────────────
  // Fetch Banks
  // ───────────────────────────
  const fetchBanks = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/bank");
      setBanks(extractRows(data));
    } catch (err) {
      Swal.fire("Error", "Failed to load bank records.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
    setIsEditing(true);
    setIsAdding(true);
  }, []);

  const startNew = () => {
    setEditingBank(emptyBank);
    setIsAdding(true);
    setIsEditing(true);
    setSelectedRow(null);
  };

  const resetForm = () => {
    setEditingBank(emptyBank);
    setIsEditing(false);
    setIsAdding(false);
    setSelectedRow(null);
  };

  // ───────────────────────────
  // Load Single Record
  // ───────────────────────────
  const handleEdit = async (row) => {
    if (!row) return;

    setLoading(true);
    try {
      const { data } = await apiClient.get("/getBank", {
        params: { bankCode: row.bankCode },
      });

      const rec = extractRows(data)[0];
      if (!rec) {
        Swal.fire("Error", "Bank record not found.", "error");
        return;
      }

      setEditingBank({ ...rec, __existing: true });
      setIsEditing(true);
      setIsAdding(false);
      setSelectedRow(row);
    } catch {
      Swal.fire("Error", "Failed to retrieve record.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────
  // Save
  // ───────────────────────────
  const handleSave = async () => {
    if (!editingBank) return;

    const required = [
      "bankCode",
      "acctCode",
      "bankAcctNo",
      "bankAcctType",
      "currCode",
    ];

    const missing = required.filter(
      (f) => !editingBank[f]?.toString().trim()
    );

    if (missing.length > 0) {
      Swal.fire(
        "Missing Data",
        "Please fill all required fields.",
        "warning"
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "Save Bank Master?",
      icon: "question",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const { data } = await apiClient.post("/upsertBank", {
        json_data: {
          ...editingBank,
          userCode,
        },
      });

      if (data?.success || data?.status === "success") {
        Swal.fire("Saved", "Bank record saved successfully.", "success");
        fetchBanks();
        resetForm();
      } else {
        Swal.fire("Error", data?.message || "Save failed.", "error");
      }
    } catch {
      Swal.fire("Error", "Error saving record.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) {
      Swal.fire("Warning", "Please select a record to delete.", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Delete Record?",
      text: `Bank Code: ${selectedRow.bankCode}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      const { data } = await apiClient.post("/deleteBank", {
        bankCode: selectedRow.bankCode,
        userCode,
      });

      if (data?.success || data?.status === "success") {
        Swal.fire("Deleted", "Record deleted successfully.", "success");
        fetchBanks();
        resetForm();
      } else {
        Swal.fire("Error", data?.message || "Delete failed.", "error");
      }
    } catch {
      Swal.fire("Error", "Error deleting record.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────
  // Table Columns
  // ───────────────────────────
  const bankColumns = useMemo(
    () => [
      { key: "bankCode", label: "Bank Code", sortable: true },
      { key: "bankTypeCode", label: "Bank Type", sortable: true },
      { key: "acctCode", label: "Acct Code", sortable: true },
      { key: "acctName", label: "Account Name", sortable: true },
      { key: "bankAcctNo", label: "Bank Acct No", sortable: true },
      { key: "bankAcctType", label: "Acct Type", sortable: true },
      {
        key: "autoCk",
        label: "Auto",
        render: (row) => (row.autoCk === "N" ? "No" : "Yes"),
      },
      { key: "currCode", label: "Currency", sortable: true },
      { key: "bankBranch", label: "Branch", sortable: true },
      {
        key: "__actions",
        label: "Actions",
        renderType: "actions",
        render: (row) => (
          <button
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="global-ref-main-div-ui mt-24">
      {(loading || saving) && <LoadingSpinner />}

      {/* HEADER */}
      <div className="fixed mt-4 top-14 left-6 right-6 z-30 global-ref-header-ui flex justify-between items-center">
        <h1 className="global-ref-headertext-ui">{documentTitle}</h1>

        <div className="flex gap-2 text-xs">
          <ButtonBar
            buttons={[
              {
                key: "add",
                label: "Add",
                icon: faPlus,
                onClick: startNew,
                disabled: isEditing,
              },
              {
                key: "save",
                label: "Save",
                icon: faSave,
                onClick: handleSave,
                disabled: !isEditing || saving,
              },
              {
                key: "delete",
                label: "Delete",
                icon: faTrash,
                onClick: handleDelete,
                disabled: !selectedRow || isEditing,
              },
              {
                key: "reset",
                label: "Reset",
                icon: faUndo,
                onClick: resetForm,
                disabled: saving,
              },
            ]}
          />
        </div>
      </div>

      {/* FORM CONTAINER */}
      <div className="border rounded-lg bg-gray-50 p-6 mt-6">

        <div className="grid grid-cols-5 gap-x-6 gap-y-3 items-start">

          {/* ================= MAIN FORM (COL 1-4) ================= */}
          <div className="col-span-4 grid grid-cols-4 gap-x-6 gap-y-4">

            {/* ROW 1 */}
            <FieldRenderer
              label="Bank Code"
              required
              type="text"
              value={editingBank.bankCode}
              disabled={!isEditing || editingBank.__existing}
              onChange={(val) =>
                setEditingBank((prev) => ({
                  ...prev,
                  bankCode: (val || "").toUpperCase(),
                }))
              }
            />

            <FieldRenderer
              label="Bank Type"
              type="lookup"
              value={
                editingBank.bankTypeCode
                  ? `${editingBank.bankTypeCode} - ${editingBank.bankTypeName || ""}`
                  : ""
              }
              disabled={!isEditing}
              onLookup={() => setBankTypeModalOpen(true)}
            />

            <FieldRenderer
              label="Account Code"
              required
              type="text"
              value={editingBank.acctCode}
              disabled={!isEditing}
              onChange={(val) =>
                setEditingBank((prev) => ({
                  ...prev,
                  acctCode: (val || "").toUpperCase(),
                }))
              }
            />

            <FieldRenderer
              label="Account Name"
              type="text"
              value={editingBank.acctName}
              disabled
            />

            {/* ROW 2 */}
            <FieldRenderer
              label="Bank Account No"
              required
              type="text"
              value={editingBank.bankAcctNo}
              disabled={!isEditing}
              onChange={(val) =>
                setEditingBank((prev) => ({
                  ...prev,
                  bankAcctNo: val,
                }))
              }
            />

            <FieldRenderer
              label="Bank Account Type"
              required
              type="select"
              value={editingBank.bankAcctType}
              disabled={!isEditing}
              options={[
                { value: "Current", label: "Current" },
                { value: "Savings", label: "Savings" },
                { value: "Time", label: "Time Deposit" },
              ]}
              onChange={(val) =>
                setEditingBank((prev) => ({
                  ...prev,
                  bankAcctType: val,
                }))
              }
            />

            <FieldRenderer
              label="Bank Branch"
              type="text"
              value={editingBank.bankBranch}
              disabled={!isEditing}
              onChange={(val) =>
                setEditingBank((prev) => ({
                  ...prev,
                  bankBranch: val,
                }))
              }
            />

            <FieldRenderer
              label="Contact Person"
              type="text"
              value={editingBank.bankContact}
              disabled={!isEditing}
              onChange={(val) =>
                setEditingBank((prev) => ({
                  ...prev,
                  bankContact: val,
                }))
              }
            />

            {/* ROW 3 */}
            <FieldRenderer
              label="Auto?"
              type="select"
              value={editingBank.autoCk === "N" ? "No" : "Yes"}
              disabled={!isEditing}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
              onChange={(val) =>
                setEditingBank((prev) => ({
                  ...prev,
                  autoCk: val === "Yes" ? "Y" : "N",
                }))
              }
            />

            <FieldRenderer
              label="Start Check No"
              type="text"
              value={editingBank.startCheckNo}
              disabled={!isEditing}
              onChange={(val) =>
                setEditingBank((prev) => ({
                  ...prev,
                  startCheckNo: val,
                }))
              }
            />

            <FieldRenderer
              label="Last Check No"
              type="text"
              value={editingBank.lastCheckNo}
              disabled={!isEditing}
              onChange={(val) =>
                setEditingBank((prev) => ({
                  ...prev,
                  lastCheckNo: val,
                }))
              }
            />

            <FieldRenderer
              label="Currency"
              required
              type="text"
              value={editingBank.currCode}
              disabled={!isEditing}
              onChange={(val) =>
                setEditingBank((prev) => ({
                  ...prev,
                  currCode: (val || "").toUpperCase(),
                }))
              }
            />

            {/* ROW 4 */}
            <FieldRenderer
              label="Position"
              type="text"
              value={editingBank.bankPosition}
              disabled={!isEditing}
              onChange={(val) =>
                setEditingBank((prev) => ({
                  ...prev,
                  bankPosition: val,
                }))
              }
            />

            <FieldRenderer
              label="Contact No"
              type="text"
              value={editingBank.bankTelNo}
              disabled={!isEditing}
              onChange={(val) =>
                setEditingBank((prev) => ({
                  ...prev,
                  bankTelNo: val,
                }))
              }
            />

            <FieldRenderer
              label="Address 1"
              type="text"
              value={editingBank.bankAddr1}
              disabled={!isEditing}
              onChange={(val) =>
                setEditingBank((prev) => ({
                  ...prev,
                  bankAddr1: val,
                }))
              }
            />

            <FieldRenderer
              label="Address 2"
              type="text"
              value={editingBank.bankAddr2}
              disabled={!isEditing}
              onChange={(val) =>
                setEditingBank((prev) => ({
                  ...prev,
                  bankAddr2: val,
                }))
              }
            />

          </div>

          {/* ================= REGISTRATION PANEL ================= */}
          <div className="border-l border-gray-300 pl-6">
            <RegistrationInfo
              data={editingBank}
              layout="stacked"
            />
          </div>

        </div>
      </div>

      {/* TABLE */}
      <div className="mt-6">
        <SearchGlobalReferenceTable
          docType={docType}
          columns={bankColumns}
          data={banks}
          itemsPerPage={50}
          showFilters
          isLoading={loading}
          selectedRow={selectedRow}
          onRowClick={(row) => setSelectedRow(row)}
          onRowDoubleClick={handleEdit}
        />
      </div>

      <SearchBankRef
        isOpen={isBankTypeModalOpen}
        onClose={() => setBankTypeModalOpen(false)}
      />
    </div>

  );
};

export default BankMast;