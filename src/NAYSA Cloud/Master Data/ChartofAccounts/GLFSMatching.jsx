
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import Swal from "sweetalert2";
import {
  reftables,
  reftablesPDFGuide,
  reftablesVideoGuide,
} from "@/NAYSA Cloud/Global/reftable";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer.jsx";
import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable.jsx";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";

const getId = (row) => row?.bankTypeCode ?? row?.banktype_code ?? null;

const GLFSMatching = forwardRef(
  (
    {
      embedded = false,
      activeTab = "banktypes",
      setActiveTab = () => {},
      tabs = [],
    },
    ref
  ) => {
    const { user } = useAuth();
    const docType = "BankType";
    const documentTitle = reftables?.[docType] || "Bank Type Codes";
    const pdfLink = reftablesPDFGuide?.[docType];
    const videoLink = reftablesVideoGuide?.[docType];

    const guideRef = useRef(null);
    const codeInputRef = useRef(null);
    const tableRef = useRef(null);

    const [bankTypes, setBankTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isOpenGuide, setOpenGuide] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [bankTypeCode, setBankTypeCode] = useState("");
    const [bankTypeName, setBankTypeName] = useState("");

    const fetchBankTypes = useCallback(async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get("/bankType");
        let parsed = [];

        if (data?.success && Array.isArray(data.data)) {
          parsed = data.data[0]?.result ? JSON.parse(data.data[0].result) : data.data;
        }

        setBankTypes(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error("Fetch error:", err);
        Swal.fire("Error", "Failed to fetch data", "error");
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      if (!embedded) document.title = documentTitle;
      fetchBankTypes();
    }, [documentTitle, embedded, fetchBankTypes]);

    const resetForm = useCallback(() => {
      setBankTypeCode("");
      setBankTypeName("");
      setIsEditing(false);
      setIsAdding(false);
      setSelectedRow(null);
    }, []);

    const handleRowSelect = useCallback((row) => {
      setSelectedRow(row);
      setBankTypeCode(row?.bankTypeCode ?? row?.banktype_code ?? "");
      setBankTypeName(row?.bankTypeName ?? row?.banktype_name ?? "");
      setIsAdding(false);
      setIsEditing(false);
    }, []);

    const handleSave = async () => {
      const code = bankTypeCode.trim().toUpperCase();
      const name = bankTypeName.trim();

      if (!code || !name) {
        return Swal.fire("Error", "All fields are required.", "error");
      }

      if (
        isAdding &&
        bankTypes.some(
          (r) => String(r.bankTypeCode ?? r.banktype_code ?? "").toUpperCase() === code
        )
      ) {
        setBankTypeCode("");
        codeInputRef.current?.focus();
        return Swal.fire("Duplicate", "This code already exists.", "error");
      }

      setSaving(true);
      try {
        const payload = {
          action: isAdding ? "Add" : "Edit",
          bankTypeCode: code,
          bankTypeName: name,
          userCode: user?.USER_CODE || "SYSTEM",
        };

        const { data } = await apiClient.post("/upsertBankType", {
          json_data: JSON.stringify(payload),
        });

        if (data?.success || data?.status === "success") {
          Swal.fire(
            "Success",
            `Bank Type ${isAdding ? "added" : "updated"} successfully!`,
            "success"
          );
          await fetchBankTypes();
          resetForm();
        } else {
          Swal.fire(
            "Error",
            data?.message || "Failed to save Bank Type.",
            "error"
          );
        }
      } catch (error) {
        Swal.fire("Error", error?.message || "Save failed.", "error");
      } finally {
        setSaving(false);
      }
    };

    const startNew = useCallback(() => {
      resetForm();
      setIsAdding(true);
      setIsEditing(true);
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }, [resetForm]);

    const startEdit = useCallback(() => {
      if (!selectedRow) {
        return Swal.fire("Info", "Please select a record first.", "info");
      }
      setIsAdding(false);
      setIsEditing(true);
    }, [selectedRow]);

    const tableColumns = useMemo(
      () => [
        {
          key: "bankTypeCode",
          label: "Code",
          sortable: true,
          width: 140,
          render: (row) => row?.bankTypeCode ?? row?.banktype_code ?? "",
        },
        {
          key: "bankTypeName",
          label: "Name",
          sortable: true,
          width: 320,
          render: (row) => row?.bankTypeName ?? row?.banktype_name ?? "",
        },
      ],
      []
    );

    const tableData = useMemo(
      () =>
        (Array.isArray(bankTypes) ? bankTypes : []).map((row, index) => ({
          ...row,
          __idx: index,
          bankTypeCode: row?.bankTypeCode ?? row?.banktype_code ?? "",
          bankTypeName: row?.bankTypeName ?? row?.banktype_name ?? "",
        })),
      [bankTypes]
    );

    useImperativeHandle(ref, () => ({
      startNew,
      edit: startEdit,
      save: handleSave,
      reset: resetForm,
      refresh: fetchBankTypes,
    }));

    const registrationData = useMemo(
  () => ({
    registeredBy:
      selectedRow?.registeredBy ??
      selectedRow?.createdBy ??
      selectedRow?.userCode ??
      "",
    registeredDate:
      selectedRow?.registeredDate ??
      selectedRow?.dateCreated ??
      selectedRow?.created_at ??
      "",
    lastUpdatedBy:
      selectedRow?.lastUpdatedBy ??
      selectedRow?.updatedBy ??
      selectedRow?.modifiedBy ??
      "",
    lastUpdatedDate:
      selectedRow?.lastUpdatedDate ??
      selectedRow?.dateUpdated ??
      selectedRow?.updated_at ??
      "",
  }),
  [selectedRow]
);

return (
  // <div className={embedded ? "w-full" : "global-ref-main-div-ui mt-24"}>
    
      <div className={`${embedded ? "mt-28" : "global-ref-main-div-ui mt-24"} flex flex-col gap-3`}>
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-full">
      {/* LEFT SIDE */}
      <div className="xl:col-span-4 min-h-0">
        <div className="h-full flex flex-col gap-4">
          <div className="border rounded-lg p-4">
            <div className="grid grid-cols-1 gap-4">
              <FieldRenderer
                label="Bank Type Code"
                required
                value={bankTypeCode}
                inputRef={codeInputRef}
                onChange={(e) => setBankTypeCode(e.target.value.toUpperCase())}
                disabled={!isAdding || !isEditing}
              />

              <FieldRenderer
                label="Bank Type Name"
                required
                value={bankTypeName}
                onChange={(e) => setBankTypeName(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <RegistrationInfo
            data={registrationData}
            layout="stacked"
            showHeader={true}
          />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="xl:col-span-8 min-h-0 flex">
        <div className="flex-1 min-h-0 border rounded-lg p-2">
          <SearchGlobalReferenceTable
            ref={tableRef}
            columns={tableColumns}
            data={tableData}
            docType={docType}
            itemsPerPage={10}
            showFilters={true}
            isLoading={loading}
            className="h-full"
            onRowDoubleClick={(row) => {
              if (isEditing) return;
              handleRowSelect(row);
            }}
            tableSize = "Half"
          />
        </div>
      </div>
    </div>
  </div>
);
  }
);

export default GLFSMatching;