import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";

import {
  useSwalDeleteConfirm,
  useSwalValidationAlert,
  useSwalDeleteRecord,
  useSwalInfoAlert,
} from "@/NAYSA Cloud/Global/behavior";

export const reftables = {
  Branch: "Branch Codes",
  BankType: "Bank Type Codes",
  UserAccRight: "User Access Rights",
  Company: "Company ID",
  VATRef: "VAT Codes",
  Cutoff: "Cycle Period",
  Currency: "Currency Codes",
  COAMast: "Chart of Accounts",
  UserUpdate: "Update User",
};

export const reftablesVideoGuide = {
  Branch:
    "https://www.youtube.com/watch?v=e5gBnrL-3u4&list=PLfNvt59xJjIgoEopcrnnG9fWfz76EMIxO&index=5&t=9s",
  COAMast:
    "https://www.youtube.com/watch?v=e5gBnrL-3u4&list=PLfNvt59xJjIgoEopcrnnG9fWfz76EMIxO&index=5&t=9s",
};

export const reftablesPDFGuide = {
  Branch: "/public/Guide/NAYSA AP Accounts Payable Voucher.pdf",
  COAMast: "/public/Guide/NAYSA AP Accounts Payable Voucher.pdf",
};

const showValidation = async (title, lines) => {
  const msg = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
  return useSwalValidationAlert({
    icon: "error",
    title,
    message: msg,
  });
};

export const useGlobalDuplicateRefTable = async (
  tblCode,
  payload,
  fieldcaption = "record"
) => {
  try {
    const response = await apiClient.post(`/checkDuplicate${tblCode}`, payload);

    const rawData =
      response?.data?.data?.[0]?.result ??
      response?.data?.data?.[0]?.[""] ??
      '{"result":"0"}';

    const { result } = JSON.parse(rawData);

    if (result === "1") {
      await useSwalInfoAlert(
        "Duplicate Entry",
        `The ${fieldcaption} code you entered already exists. Please use a unique code.`
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error("Duplicate check failed:", error);
    await showValidation("Error", [
      error?.response?.data?.message ||
        error?.message ||
        `Failed to validate duplicate ${fieldcaption}.`,
    ]);
    return true;
  }
};

export const useGlobalDeleteRefTable = async ({
  rowParam = null,
  selectedAccount = null,
  onSuccess,
  onReset,
  payload,
  tblCode,
  idKey = "acctCode",
  fieldcaption = "record",
}) => {
  const row = rowParam || selectedAccount;

  if (!row?.[idKey]) {
    await showValidation("Error", [
      `Please select a ${fieldcaption} to delete.`,
    ]);
    return;
  }

  try {
    const inUsed = await apiClient.post(`/checkInUsed${tblCode}`, payload);

    const rawData =
      inUsed?.data?.data?.[0]?.result ??
      inUsed?.data?.data?.[0]?.[""] ??
      '{"result":"0"}';

    const parsedData = JSON.parse(rawData);

    if (parsedData.result === "1") {
      await useSwalInfoAlert(
        "Action Restricted",
        `This ${fieldcaption} code is currently in use and cannot be deleted.`
      );
      return;
    }

    const confirm = await useSwalDeleteConfirm(
      `Delete this ${fieldcaption}?`,
      `Code: ${row[idKey]}`,
      "Yes, delete it"
    );

    if (!confirm?.isConfirmed) return;

    const response = await apiClient.post(`/delete${tblCode}`, payload);

    if (response?.data?.success) {
      await useSwalDeleteRecord();

      if (onSuccess) await onSuccess();

      if (selectedAccount?.[idKey] === row[idKey] && onReset) {
        onReset();
      }
    } else {
      await showValidation("Error", [
        response?.data?.message || `Failed to delete ${fieldcaption}.`,
      ]);
    }
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      `Failed to delete ${fieldcaption}.`;

    await showValidation("Error", [msg]);
  }
};