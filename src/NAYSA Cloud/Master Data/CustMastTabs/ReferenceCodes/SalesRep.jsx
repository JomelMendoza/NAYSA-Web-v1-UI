import React, { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer";
import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar";
import { Edit, Trash2 } from "lucide-react";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo";
import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable";
import { 
  useSwalErrorAlert, 
  useSwalValidationAlert, 
  useSwalDeleteRecord, 
  useSwalshowSave 
<<<<<<< HEAD
} from "@/NAYSA Cloud/Global/behavior";
=======
} from "@/NAYSA Cloud/Global/behavior.jsx";
>>>>>>> 701b926012ee5f3eb7e717f57ad3049d410c556c
import Swal from "sweetalert2";
 
// Helper function to extract rows from response
const extractRows = (payload) => {
  const res = payload?.data?.data?.[0]?.result ?? payload?.data?.result ?? payload?.data?.data;
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (typeof res === "string") {
    try { return JSON.parse(res) || []; } catch { return []; }
  }
  return [];
};

const SectionHeader = ({ title }) => (
  <div className="mb-3 border-b pb-1"><div className="text-sm font-bold text-gray-800">{title}</div></div>
);

export const SalesRep = () => {
  const title = "Sales Rep Codes";
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userCode = user?.userCode ?? "ADMIN";

  const emptyForm = {
    salesRepCode: "",
    salesRepName: "",
    salesRepType: "SR",
    salesRepBranch: "HO",
    registeredBy: "",
    registeredDate: "",
    lastUpdatedBy: "",
    lastUpdatedDate: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState("");
  const codeInputRef = useRef(null);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const resetUI = () => { setForm(emptyForm); setIsEditing(false); };

  // --- Queries & Mutations ---
  const { data: allRows = [], isLoading } = useQuery({
    queryKey: ["salesRep"],
    queryFn: async () => {
      const res = await apiClient.get("/salesRep");
      return extractRows(res);
    },
  });

  const upsertMutation = useMutation({
    mutationFn: (payload) => apiClient.post("/upsertsalesRep", { json_data: payload }),
    onSuccess: (res) => {
      const sqlRow = res?.data?.data?.[0] || {};
      if (Number(sqlRow.errorcount || 0) > 0) {
        useSwalErrorAlert("Error", sqlRow.errormsg || "Failed to save.");
      } else {
        useSwalshowSave();
        queryClient.invalidateQueries({ queryKey: ["salesRep"] });
        resetUI();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (code) => apiClient.post("/deletesalesRep", { json_data: { salesRepCode: code } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesRep"] });
      useSwalDeleteRecord();
      resetUI();
    },
  });

  // --- Validation ---
  const checkDuplicate = async (salesRepCode) => {
    const c = String(salesRepCode || "").trim();
    if (!c) return false;

    const res = await apiClient.post("/checkDuplicatesalesRep", { json_data: { salesRepCode: c } });

    const row0 = res?.data?.data?.[0] || {};
    const raw = row0?.result ?? row0?.[""] ?? '{"result":"0"}';
    const parsed = JSON.parse(raw);

    return String(parsed?.result) === "1";
  };

  const checkInUsed = async (salesRepCode) => {
    const c = String(salesRepCode || "").trim();
    if (!c) return false;

    const res = await apiClient.post("/checkInUsedSalesRep", { json_data: { salesRepCode: c } });

    const row0 = res?.data?.data?.[0] || {};
    const raw = row0?.result ?? row0?.[""] ?? '{"result":"0"}';
    const parsed = JSON.parse(raw);

    return String(parsed?.result) === "1";
  };

  const handleSalesRepCodeValidate = async () => {
    const code = String(form.salesRepCode || "").trim().toUpperCase();
    if (!code || !isEditing || form.__existing) return;

    // Check for duplicates
    const dup = await checkDuplicate(code);

    if (dup) {
      useSwalValidationAlert({ title: "Duplicate", message: `Code "${code}" is already in use.` });
      setField("salesRepCode", "");
      setTimeout(() => codeInputRef.current?.focus?.(), 0);
      return; // Prevent further execution if duplicate
    }

    // Check if the salesRepCode is in use
    const inUse = await checkInUsed(code);
    if (inUse) {
      useSwalValidationAlert({ title: "In Use", message: `Code "${code}" is currently in use.` });
      setField("salesRepCode", "");
      setTimeout(() => codeInputRef.current?.focus?.(), 0);
    }
  };

  const handleSave = async () => {
    const code = String(form.salesRepCode || "").trim().toUpperCase();

    // Check if the salesRepCode is already in use or duplicate
    try {
      // Check for duplicates
      const duplicateRes = await apiClient.post("/checkDuplicatesalesRep", { json_data: { salesRepCode: code } });
      const duplicateData = extractRows(duplicateRes)[0];
      if (String(duplicateData?.result) === "1") {
        return useSwalValidationAlert({ title: "Duplicate", message: `Code "${code}" is already in use.` });
      }

      // Check if the salesRepCode is in use
      const inUseRes = await apiClient.post("/checkInUsedsalesRep", { json_data: { salesRepCode: code } });
      const inUseData = extractRows(inUseRes)[0];
      if (String(inUseData?.result) === "1") {
        return useSwalValidationAlert({ title: "In Use", message: `Code "${code}" is currently in use.` });
      }

      // If validation passes, proceed to save
      upsertMutation.mutate({ ...form, userCode });

    } catch (err) {
      console.error("Validation failed", err);
      useSwalErrorAlert("Validation Error", "An error occurred while validating the sales rep code.");
    }
  };

  const columns = useMemo(() => [
    { key: "salesRepCode", label: "Sales Rep Code", sortable: true },
    { key: "salesRepName", label: "Sales Rep Name", sortable: true },
    { key: "salesRepType", label: "Type", sortable: true },
    { key: "salesRepBranch", label: "Branch", sortable: true },
    {
      key: "__actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2 justify-center">
          <button onClick={() => { setForm({...row, __existing: true}); setIsEditing(true); }} className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors"><Edit size={16} /></button>
          <button onClick={() => deleteMutation.mutate(row.salesRepCode)} className="p-1 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ], [deleteMutation]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="flex gap-3">
          <input className="global-tran-textbox-ui w-64" placeholder="Search..." onChange={(e) => setSearch(e.target.value)} />
          <ButtonBar buttons={[{ key: "add", label: "Add", onClick: () => { resetUI(); setIsEditing(true); } }, { key: "save", label: "Save", onClick: handleSave, disabled: !isEditing }, { key: "reset", label: "Reset", onClick: resetUI }]} />
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-6 max-w-lg h-fit">
          <section>
            <SectionHeader title="Basic Information" />
            <div className="grid grid-cols-2 gap-4">
              <FieldRenderer label="Sales Rep Code" required value={form.salesRepCode} inputRef={codeInputRef} onChange={(e) => setField("salesRepCode", e.target.value.toUpperCase())} onBlur={handleSalesRepCodeValidate} disabled={!isEditing || form.__existing} />
              <FieldRenderer label="Sales Rep Name" required value={form.salesRepName} onChange={(e) => setField("salesRepName", e.target.value)} disabled={!isEditing} />
              <FieldRenderer label="Sales Rep Type" type="select" options={[{value: "SR", label: "Sales Representative"}]} value={form.salesRepType} disabled={!isEditing} onChange={(v) => setField("salesRepType", v)} />
              <FieldRenderer label="Sales Rep Branch" type="select" options={[{value: "HO", label: "Head Office"}]} value={form.salesRepBranch} disabled={!isEditing} onChange={(v) => setField("salesRepBranch", v)} />
            </div>
          </section>
          <RegistrationInfo data={form} layout="minimize" />
        </div>
        <div className="border rounded-lg max-w-2xl overflow-hidden h-fit">
          <SearchGlobalReferenceTable columns={columns} data={allRows.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default SalesRep;