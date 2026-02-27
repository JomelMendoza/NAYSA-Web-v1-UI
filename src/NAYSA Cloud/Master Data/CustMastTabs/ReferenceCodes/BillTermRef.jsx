import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSave,
  faUndo,
  faList,
  faTrashAlt,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer";
import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo";
import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable";

import {
  useSwalErrorAlert,
  useSwalDeleteConfirm,
  useSwalDeleteRecord,
  useSwalshowSave,
  useSwalValidationAlert,
} from "@/NAYSA Cloud/Global/behavior";

/* ================= HELPERS ================= */

const Card = ({ children }) => (
  <div className="global-tran-textbox-group-div-ui self-start !h-fit">{children}</div>
);

const SectionHeader = ({ title }) => (
  <div className="mb-3">
    <div className="text-sm font-bold text-gray-800">{title}</div>
  </div>
);

const parseSprocJsonResult = (rows) => {
  if (!rows || !rows.length) return null;
  const r = rows[0]?.result;
  if (!r) return null;
  try {
    return JSON.parse(r);
  } catch {
    return null;
  }
};

/* ================= COMPONENT ================= */

export default function BillTermRef() {
  const title = "Billing Terms";
  const { user } = useAuth();

  const userCode =
    user?.userCode || user?.user_code || user?.USER_CODE || user?.UserCode || user?.code || "";

  const emptyForm = {
    code: "",
    name: "",
    daysDue: "",
    advances: "",
    active: "Y",
  };

  const [form, setForm] = useState(emptyForm);
  const formRef = useRef(form);
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const updateForm = (patch) => {
    formRef.current = { ...formRef.current, ...patch };
    setForm((p) => ({ ...p, ...patch }));
  };

  /* ================= NORMALIZER ================= */

  const normalizeRow = (x) => ({
    code: x?.billtermCode ?? x?.billterm_code ?? "",
    name: x?.billtermName ?? x?.billterm_name ?? "",
    daysDue: x?.daysDue ?? x?.days_due ?? 0,
    advances: x?.advances === "Y" ? "Y" : "",
    active: x?.active === "N" ? "N" : "Y",
    registeredBy: x?.registeredBy ?? "",
    registeredDate: x?.registeredDate ?? "",
    lastUpdatedBy: x?.lastUpdatedBy ?? "",
    lastUpdatedDate: x?.lastUpdatedDate ?? "",
  });

  /* ================= LOAD LIST ================= */

  const loadList = useCallback(async () => {
    try {
      setIsLoading(true);

      const res = await apiClient.get("/billterm");

      const raw = Array.isArray(res.data?.data)
        ? parseSprocJsonResult(res.data.data) || []
        : [];

      const normalized = raw.map(normalizeRow);

      setRows(normalized);
      setAllRows(normalized);
    } catch (err) {
      console.error(err);
      useSwalErrorAlert("Error", "Failed to load Billing Terms.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ================= FETCH ONE ================= */

  const fetchOne = async (code) => {
    if (!code) return;

    try {
      setIsLoading(true);

      const res = await apiClient.get("/getBillterm", {
        params: { BILLTERM_CODE: code },
      });

      const parsed = parseSprocJsonResult(res?.data?.data);
      const row = parsed?.[0];

      if (!row) return;

      const normalized = normalizeRow(row);

      setForm(normalized);
      setSelectedCode(normalized.code);
    } catch (e) {
      console.error(e);
      await useSwalErrorAlert("Error", "Failed to fetch record.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= SAVE ================= */

  const save = async () => {
    const f = formRef.current;

    if (!f.code || !f.name) {
      return useSwalValidationAlert({
        icon: "error",
        title: "Missing Required Fields",
        message: "Code and Name are required.",
      });
    }

    const payload = {
      json_data: {
        billtermCode: f.code.trim(),
        billtermName: f.name.trim(),
        dueDays: f.daysDue === "" ? null : Number(f.daysDue),
        userCode,
      },
    };



    try {
      setIsLoading(true);

      await apiClient.post("/upsertBillterm", {
        json_data: JSON.stringify(payload)
      });

      await useSwalshowSave();
      setIsEditing(false);
      await loadList();
      await fetchOne(f.code);
    } catch (e) {
      console.error(e);
      await useSwalErrorAlert("Error", "Failed to save record.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const deleteRecord = async () => {
    if (!selectedCode) return;

    const confirm = await useSwalDeleteConfirm(
      "Delete this Billing Term?",
      selectedCode,
      "Yes, delete it"
    );
    if (!confirm?.isConfirmed) return;
    try {
      setIsLoading(true);

      await apiClient.post("/deleteBillterm", {
        json_data: JSON.stringify({ billtermCode: selectedCode }),
      });

      await useSwalDeleteRecord();
      setForm(emptyForm);
      setSelectedCode("");
      await loadList();
    } catch (e) {
      console.error(e);
      await useSwalErrorAlert("Error", "Failed to delete.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= SEARCH ================= */

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (!search) return setRows(allRows);

    const s = search.toLowerCase();
    setRows(
      allRows.filter(
        (r) => r.code.toLowerCase().includes(s) || r.name.toLowerCase().includes(s)
      )
    );
  }, [search, allRows]);

  /* ================= BUTTONS ================= */

  const buttons = [
    { key: "add", label: "Add", icon: faPlus, onClick: () => { setForm(emptyForm); setSelectedCode(""); setIsEditing(true); } },
    { key: "save", label: "Save", icon: faSave, onClick: save, disabled: !isEditing },
    {
      key: "reset",
      label: "Reset",
      icon: faUndo,
      onClick: () => {
        setForm(emptyForm);
        setSelectedCode("");
        setIsEditing(false);
      },
    }
  ];

  const columns = useMemo(
    () => [
      { key: "code", label: "Billing Term Code", sortable: true },
      { key: "name", label: "Billing Term Name", sortable: true },
      { key: "daysDue", label: "Due Days", renderType: "number", sortable: true },
      { key: "active", label: "Active" },
      {
        key: "action",
        label: "Actions",
        render: (row) => (
          <div className="flex gap-3 items-center justify-center">

            {/* EDIT ICON */}
            <FontAwesomeIcon
              icon={faPenToSquare}
              className="cursor-pointer text-blue-600 hover:text-blue-800"
              onClick={() => {
                fetchOne(row.code);
                setIsEditing(true);
              }}
              title="Edit"
            />

            {/* DELETE ICON */}
            <FontAwesomeIcon
              icon={faTrashAlt}
              className="cursor-pointer text-red-600 hover:text-red-800"
              onClick={async () => {
                const confirm = await useSwalDeleteConfirm(
                  "Delete this Billing Term?",
                  row.code,
                  "Yes, delete it"
                );
                if (!confirm?.isConfirmed) return;

                try {
                  setIsLoading(true);

                  await apiClient.post("/deleteBillterm", {
                    json_data: JSON.stringify({ billtermCode: row.code }),
                  });

                  await useSwalDeleteRecord();

                  if (selectedCode === row.code) {
                    setForm(emptyForm);
                    setSelectedCode("");
                  }

                  await loadList();
                } catch (e) {
                  console.error(e);
                  await useSwalErrorAlert("Error", "Failed to delete.");
                } finally {
                  setIsLoading(false);
                }
              }}
              title="Delete"
            />

          </div>
        ),
      },
    ],
    [selectedCode, loadList]
  );
  /* ================= UI ================= */

  return (
    <>
      <Card>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faList} />
            <div className="font-bold">{title}</div>
          </div>

          <div className="flex gap-3 items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="global-tran-textbox-ui w-[250px]"
            />
            <ButtonBar buttons={buttons} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">

        {/* FORM */}
        <Card>
          <SectionHeader title="Basic Information" />

          <FieldRenderer
            label="Billing Term Code"
            type="text"
            value={form.code}
            onChange={(v) => updateForm({ code: v })}
            disabled={!isEditing || selectedCode !== ""}
          />

          <FieldRenderer
            label="Billing Term Name"
            type="text"
            value={form.name}
            onChange={(v) => updateForm({ name: v })}
            disabled={!isEditing}
          />

          <FieldRenderer
            label="Due Days"
            type="number"
            value={form.daysDue}
            onChange={(v) => updateForm({ daysDue: v })}
            disabled={!isEditing}
          />

          <FieldRenderer
            label="Active"
            type="select"
            options={[
              { value: "Y", label: "Yes" },
              { value: "N", label: "No" },
            ]}
            value={form.active}
            onChange={(v) => updateForm({ active: v })}
            disabled={!isEditing}
          />

          <SectionHeader title="Registration Information" />
          <RegistrationInfo data={form} disabled />
        </Card>

        {/* LIST */}
        <div>
          <h2 className="text-base font-semibold mb-4">List</h2>

          <SearchGlobalReferenceTable
            columns={columns}
            data={rows}
            docType="BILLTERM"
            isLoading={isLoading}
            showFilters={true}
            itemsPerPage={20}
            onRowDoubleClick={async (row) => {
              await fetchOne(row.code);
              setIsEditing(true);
            }}
          />
        </div>
      </div>
    </>
  );
}