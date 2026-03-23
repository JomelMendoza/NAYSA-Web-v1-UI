import React, { forwardRef, useState } from "react";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer";
import { useQuery } from "@tanstack/react-query";

import SearchCusMast from "@/NAYSA Cloud/Lookup/SearchCustMast.jsx";
import SearchBranchRef from "@/NAYSA Cloud/Lookup/SearchBranchRef.jsx";
import SearchATCRef from "@/NAYSA Cloud/Lookup/SearchATCRef.jsx";
import SearchVATRef from "@/NAYSA Cloud/Lookup/SearchVATRef.jsx";
import SearchBillTermRef from "@/NAYSA Cloud/Lookup/SearchBillTermRef.jsx";
import SearchCurrRef from "@/NAYSA Cloud/Lookup/SearchCurrRef.jsx";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";
import {
  useFieldLenghtCheck,
  useGetFieldLength,
} from "@/NAYSA Cloud/Global/procedure";

const SectionHeader = ({ title }) => (
  <div className="mb-3">
    <div className="text-[9px] sm:text-[12px] font-bold text-slate-500 tracking-widest border-b pb-2">
      {title}
    </div>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white shadow-sm ${className}`}>{children}</div>
);

const normalizeUpper = (v) => String(v ?? "").toUpperCase().trim();

const CustSetupTab = forwardRef(
  (
    {
      isLoading,
      isEditing,
      form = {},
      onChangeForm,
      onSelectCustomerCode,
      sltypeOptions = [],
      activeOptions = [],
      mappedTaxClassOptions = [],
      sourceOptions = [],
      handleTaxClassChange,
      handleBusinessNameChange,
    },
    ref
  ) => {
    const [salesTab, setSalesTab] = useState("sales");

    const { data: tblFieldArray = [] } = useQuery({
      queryKey: ["fieldLengths", "cust_mast"],
      queryFn: () => useFieldLenghtCheck("cust_mast"),
    });

    const [lookups, setLookups] = useState({
      cust: false,
      branch: false,
      salesRep: false,
      chain: false,
      chainCust: false,
      warehouse: false,
      curr: false,
      atc: false,
      vat: false,
      billTerm: false,
    });

    const toggleLookup = (key, val) =>
      setLookups((prev) => ({ ...prev, [key]: val }));

    const getLen = (colName, fallback = undefined) => {
      const n = useGetFieldLength(tblFieldArray, colName);
      return n || fallback;
    };

    const getValue = (input) => {
      if (input && typeof input === "object") {
        if ("target" in input) return input.target?.value ?? "";
        if ("value" in input) return input.value ?? "";
      }
      return input ?? "";
    };

    const isReadOnly = !isEditing;
    const isDisabled = isReadOnly || isLoading;

    const openCustomerLookup = () => {
      if (isLoading) return;
      toggleLookup("cust", true);
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start rounded-lg relative">
        <div className="flex flex-col gap-6">
          <Card className="border border-blue-500/30 p-6 rounded-lg space-y-4">
            <SectionHeader title="BASIC INFORMATION" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldRenderer
                label="SL Type"
                type="select"
                value={form?.sltypeCode || ""}
                options={sltypeOptions}
                onChange={(v) => onChangeForm({ sltypeCode: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
              />

              <FieldRenderer
                label="Active?"
                type="select"
                value={form?.active || "Y"}
                options={activeOptions}
                onChange={(v) => onChangeForm({ active: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldRenderer
                label="Customer Code"
                required
                type="lookup"
                value={form?.custCode || ""}
                onLookup={openCustomerLookup}
                readOnly={true}
                disabled={isLoading}
                maxLength={getLen("cust_code", 20)}
              />

              <FieldRenderer
                label="Tax Rate Class"
                required
                type="select"
                value={normalizeUpper(form?.taxClass || "")}
                options={mappedTaxClassOptions}
                onChange={(v) =>
                  (handleTaxClassChange ||
                    ((x) => onChangeForm({ taxClass: x })))(getValue(v))
                }
                readOnly={isReadOnly}
                disabled={isDisabled}
              />
            </div>

            <FieldRenderer
              label="Registered Name"
              required
              type="text"
              value={form?.custName || ""}
              onChange={(v) => onChangeForm({ custName: getValue(v) })}
              readOnly={isReadOnly}
              disabled={isDisabled}
              maxLength={getLen("cust_name", 150)}
            />

            <FieldRenderer
              label="Business Name"
              required
              type="text"
              value={form?.businessName || ""}
              onChange={(v) =>
                (handleBusinessNameChange ||
                  ((x) => onChangeForm({ businessName: x })))(getValue(v))
              }
              readOnly={isReadOnly}
              disabled={isDisabled}
              maxLength={getLen("business_name", 150)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FieldRenderer
                label="First Name"
                type="text"
                value={form?.firstName || ""}
                onChange={(v) => onChangeForm({ firstName: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen("first_name", 100)}
              />

              <FieldRenderer
                label="Middle Name"
                type="text"
                value={form?.middleName || ""}
                onChange={(v) => onChangeForm({ middleName: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen("middle_name", 100)}
              />

              <FieldRenderer
                label="Last Name"
                type="text"
                value={form?.lastName || ""}
                onChange={(v) => onChangeForm({ lastName: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen("last_name", 100)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldRenderer
                label="Old Code"
                type="text"
                value={form?.oldCode || ""}
                onChange={(v) => onChangeForm({ oldCode: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen("old_code", 50)}
              />

              <FieldRenderer
                label="Branch"
                type="lookup"
                value={form?.branchCode || ""}
                onLookup={
                  isDisabled ? undefined : () => toggleLookup("branch", true)
                }
                readOnly={isReadOnly}
                disabled={isDisabled}
              />
            </div>
          </Card>

          <Card className="border border-blue-500/30 p-6 rounded-lg space-y-4">
            <SectionHeader title="CONTACT INFORMATION" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldRenderer
                label="Contact Person"
                type="text"
                value={form?.custContact || ""}
                onChange={(v) => onChangeForm({ custContact: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen("cust_contact", 100)}
              />

              <FieldRenderer
                label="Position"
                type="text"
                value={form?.custPosition || ""}
                onChange={(v) => onChangeForm({ custPosition: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen("cust_position", 100)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldRenderer
                label="Telephone No."
                type="text"
                value={form?.custTelno || ""}
                onChange={(v) => onChangeForm({ custTelno: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen("cust_telno", 50)}
              />

              <FieldRenderer
                label="Mobile No."
                type="text"
                value={form?.custMobileno || ""}
                onChange={(v) => onChangeForm({ custMobileno: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen("cust_mobileno", 50)}
              />
            </div>

            <FieldRenderer
              label="Email Address"
              type="text"
              value={form?.custEmail || ""}
              onChange={(v) => onChangeForm({ custEmail: getValue(v) })}
              readOnly={isReadOnly}
              disabled={isDisabled}
              maxLength={getLen("cust_email", 150)}
            />

            <FieldRenderer
              label="Address 1"
              required
              type="text"
              value={form?.custAddr1 || ""}
              onChange={(v) => onChangeForm({ custAddr1: getValue(v) })}
              readOnly={isReadOnly}
              disabled={isDisabled}
              maxLength={getLen("cust_addr1", 255)}
            />

            <FieldRenderer
              label="Address 2"
              type="text"
              value={form?.custAddr2 || ""}
              onChange={(v) => onChangeForm({ custAddr2: getValue(v) })}
              readOnly={isReadOnly}
              disabled={isDisabled}
              maxLength={getLen("cust_addr2", 255)}
            />

            <FieldRenderer
              label="Address 3"
              type="text"
              value={form?.custAddr3 || ""}
              onChange={(v) => onChangeForm({ custAddr3: getValue(v) })}
              readOnly={isReadOnly}
              disabled={isDisabled}
              maxLength={getLen("cust_addr3", 255)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldRenderer
                label="ZIP Code"
                type="text"
                value={form?.custZip || ""}
                onChange={(v) => onChangeForm({ custZip: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen("cust_zip", 20)}
              />

              <FieldRenderer
                label="Source"
                required
                type="select"
                value={form?.source || ""}
                options={sourceOptions}
                onChange={(v) => onChangeForm({ source: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
              />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border border-blue-500/30 p-6 rounded-lg space-y-4">
            <div className="flex border-b border-gray-300 mb-6 overflow-x-auto">
              {[
                { id: "sales", label: "Sales & A/R Information" },
                { id: "other1", label: "Other Information 1" },
                { id: "other2", label: "Other Information 2" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSalesTab(tab.id)}
                  className={`px-4 py-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                    salesTab === tab.id
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-blue-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {salesTab === "sales" && (
              <>
                <SectionHeader title="SALES INFORMATION" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldRenderer
                    label="Sales Rep."
                    required
                    type="lookup"
                    value={form?.salesRep || ""}
                    onLookup={
                      isDisabled
                        ? undefined
                        : () => toggleLookup("salesRep", true)
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Customer Type"
                    type="select"
                    value={form?.customerType || ""}
                    options={[]}
                    onChange={(v) =>
                      onChangeForm({ customerType: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Area"
                    type="select"
                    value={form?.area || ""}
                    options={[]}
                    onChange={(v) => onChangeForm({ area: getValue(v) })}
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Zone"
                    type="select"
                    value={form?.zone || ""}
                    options={[]}
                    onChange={(v) => onChangeForm({ zone: getValue(v) })}
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Chain Flag"
                    type="select"
                    value={form?.chainFlag || ""}
                    options={[]}
                    onChange={(v) => onChangeForm({ chainFlag: getValue(v) })}
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Customer Since"
                    type="date"
                    value={form?.custSince || form?.customerSince || ""}
                    onChange={(v) => {
                      const value = getValue(v);
                      onChangeForm({ custSince: value, customerSince: value });
                    }}
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Chain Code"
                    type="lookup"
                    value={form?.chainCode || ""}
                    onLookup={
                      isDisabled ? undefined : () => toggleLookup("chain", true)
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Chain Customer"
                    type="lookup"
                    value={form?.chainCustomer || ""}
                    onLookup={
                      isDisabled
                        ? undefined
                        : () => toggleLookup("chainCust", true)
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <div className="md:col-span-2">
                    <FieldRenderer
                      label="Shipping Lines"
                      type="select"
                      value={form?.shippingLines || ""}
                      options={[]}
                      onChange={(v) =>
                        onChangeForm({ shippingLines: getValue(v) })
                      }
                      readOnly={isReadOnly}
                      disabled={isDisabled}
                    />
                  </div>

                  <FieldRenderer
                    label="Source"
                    required
                    type="select"
                    value={form?.source || ""}
                    options={sourceOptions}
                    onChange={(v) => onChangeForm({ source: getValue(v) })}
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Currency"
                    type="lookup"
                    value={form?.currCode || ""}
                    onLookup={
                      isDisabled ? undefined : () => toggleLookup("curr", true)
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Price Group"
                    type="select"
                    value={form?.priceGroup || ""}
                    options={[]}
                    onChange={(v) =>
                      onChangeForm({ priceGroup: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Direct SI/DR WH"
                    type="lookup"
                    value={form?.directWarehouse || ""}
                    onLookup={
                      isDisabled
                        ? undefined
                        : () => toggleLookup("warehouse", true)
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />
                </div>

                <SectionHeader title="ACCOUNTING INFORMATION" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldRenderer
                    label="TIN"
                    required
                    type="text"
                    value={form?.custTin || ""}
                    onChange={(v) => onChangeForm({ custTin: getValue(v) })}
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                    maxLength={getLen("cust_tin", 50)}
                  />

                  <FieldRenderer
                    label="ATC Code"
                    type="lookup"
                    value={form?.atcCode || ""}
                    onLookup={
                      isDisabled ? undefined : () => toggleLookup("atc", true)
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldRenderer
                    label="VAT Code"
                    required
                    type="lookup"
                    value={form?.vatCode || ""}
                    onLookup={
                      isDisabled ? undefined : () => toggleLookup("vat", true)
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Billing Terms"
                    required
                    type="lookup"
                    value={form?.billtermCode || ""}
                    onLookup={
                      isDisabled
                        ? undefined
                        : () => toggleLookup("billTerm", true)
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                    maxLength={getLen("billterm_code", 20)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldRenderer
                    label="Business Style"
                    type="select"
                    value={form?.businessStyle || ""}
                    options={[]}
                    onChange={(v) =>
                      onChangeForm({ businessStyle: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />
                </div>
              </>
            )}

            {salesTab === "other1" && (
              <>
                <SectionHeader title="C&C INFORMATION" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldRenderer
                    label="Credit Investigator"
                    type="text"
                    value={form?.creditInvestigator || ""}
                    onChange={(v) =>
                      onChangeForm({ creditInvestigator: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Credit Limit"
                    type="number"
                    value={form?.creditLimit || "0"}
                    onChange={(v) =>
                      onChangeForm({ creditLimit: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Total AR"
                    type="number"
                    value={form?.totalAR || ""}
                    onChange={(v) => onChangeForm({ totalAR: getValue(v) })}
                    readOnly={true}
                    disabled={true}
                  />

                  <FieldRenderer
                    label="Credit Balance"
                    type="number"
                    value={form?.creditBalance || "0"}
                    onChange={(v) =>
                      onChangeForm({ creditBalance: getValue(v) })
                    }
                    readOnly={true}
                    disabled={true}
                  />
                </div>
<<<<<<< HEAD

                <div className="mt-6">
                  <SectionHeader title="PRINTING INFORMATION" />
                </div>

                <div className="space-y-3">
                  <FieldRenderer
                    label="Customer Remarks"
                    type="textarea"
                    value={form?.customerRemarks || ""}
                    onChange={(v) =>
                      onChangeForm({ customerRemarks: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Customized DR Form"
                    type="text"
                    value={form?.customizedDrForm || ""}
                    onChange={(v) =>
                      onChangeForm({ customizedDrForm: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Customized SI Form"
                    type="text"
                    value={form?.customizedSiForm || ""}
                    onChange={(v) =>
                      onChangeForm({ customizedSiForm: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Customized DRC Form"
                    type="text"
                    value={form?.customizedDrcForm || ""}
                    onChange={(v) =>
                      onChangeForm({ customizedDrcForm: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Customized BS Form"
                    type="text"
                    value={form?.customizedBsForm || ""}
                    onChange={(v) =>
                      onChangeForm({ customizedBsForm: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Customized SVI Form"
                    type="text"
                    value={form?.customizedSviForm || ""}
                    onChange={(v) =>
                      onChangeForm({ customizedSviForm: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />
                </div>
=======
>>>>>>> 701b926012ee5f3eb7e717f57ad3049d410c556c
              </>
            )}

            {salesTab === "other2" && (
              <>
                <SectionHeader title="TAX CERTIFICATE SIGNATORY" />

                <div className="space-y-3">
                  <FieldRenderer
                    label="Name"
                    type="text"
                    value={form?.taxSignatoryName || ""}
                    onChange={(v) =>
                      onChangeForm({ taxSignatoryName: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="TIN"
                    type="text"
                    value={form?.taxSignatoryTin || ""}
                    onChange={(v) =>
                      onChangeForm({ taxSignatoryTin: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Position"
                    type="text"
                    value={form?.taxSignatoryPosition || ""}
                    onChange={(v) =>
                      onChangeForm({ taxSignatoryPosition: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Email Address"
                    type="text"
                    value={form?.taxSignatoryEmail || ""}
                    onChange={(v) =>
                      onChangeForm({ taxSignatoryEmail: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="ZIP Code"
                    type="text"
                    value={form?.taxSignatoryZip || ""}
                    onChange={(v) =>
                      onChangeForm({ taxSignatoryZip: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />
                </div>

<<<<<<< HEAD
                <div className="mt-6">
                  <SectionHeader title="SHIPMENT INFORMATION" />
=======
                {/* <div className="mt-6">
                  <SectionHeader title="SUPPLEMENTARY INFORMATION" />
>>>>>>> 701b926012ee5f3eb7e717f57ad3049d410c556c
                </div>

                <div className="space-y-3">
                  <FieldRenderer
                    label="Code 1"
                    type="text"
                    value={form?.shipmentCode1 || ""}
                    onChange={(v) =>
                      onChangeForm({ shipmentCode1: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Code 2"
                    type="text"
                    value={form?.shipmentCode2 || ""}
                    onChange={(v) =>
                      onChangeForm({ shipmentCode2: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Code 3"
                    type="text"
                    value={form?.shipmentCode3 || ""}
                    onChange={(v) =>
                      onChangeForm({ shipmentCode3: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Code 4"
                    type="text"
                    value={form?.shipmentCode4 || ""}
                    onChange={(v) =>
                      onChangeForm({ shipmentCode4: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
                  />

                  <FieldRenderer
                    label="Destination 2"
                    type="text"
                    value={form?.destination2 || ""}
                    onChange={(v) =>
                      onChangeForm({ destination2: getValue(v) })
                    }
                    readOnly={isReadOnly}
                    disabled={isDisabled}
<<<<<<< HEAD
                  />
                </div>
=======
                  /> */}
                {/* </div> */}
>>>>>>> 701b926012ee5f3eb7e717f57ad3049d410c556c
              </>
            )}
          </Card>

          <div className="mt-2">
            <RegistrationInfo
              layout="twoCols"
              disabled
              data={{
                registeredBy: form?.registeredBy || "",
                registeredDate: form?.registeredDate || "",
                lastUpdatedBy: form?.updatedBy || "",
                lastUpdatedDate: form?.updatedDate || "",
              }}
            />
          </div>
        </div>

        <SearchCusMast
          isOpen={lookups.cust}
          customParam="ActiveAll"
          onClose={async (selected) => {
            toggleLookup("cust", false);
            if (!selected) return;

            const code =
              getValue(selected?.custCode) || getValue(selected?.cust_code);
            const tin =
              getValue(selected?.custTin) ||
              getValue(selected?.cust_tin) ||
              getValue(selected?.tin);

            if (!code) return;

            onChangeForm({
              custCode: code,
              custTin: tin,
              __isNew: false,
            });

            await onSelectCustomerCode?.(code);
          }}
        />

        <SearchBranchRef
          isOpen={lookups.branch}
          onClose={(selected) => {
            toggleLookup("branch", false);
            if (!selected) return;
            onChangeForm({
              branchCode:
                getValue(selected?.branchCode) ||
                getValue(selected?.branch_code),
            });
          }}
        />

        <SearchATCRef
          isOpen={lookups.atc}
          onClose={(selected) => {
            toggleLookup("atc", false);
            if (!selected) return;
            onChangeForm({
              atcCode: getValue(selected?.atcCode) || getValue(selected?.atc_code),
              atcName: getValue(selected?.atcName) || getValue(selected?.atc_name),
            });
          }}
        />

        <SearchVATRef
          isOpen={lookups.vat}
          onClose={(selected) => {
            toggleLookup("vat", false);
            if (!selected) return;
            onChangeForm({
              vatCode: getValue(selected?.vatCode) || getValue(selected?.vat_code),
              vatName: getValue(selected?.vatName) || getValue(selected?.vat_name),
            });
          }}
        />

        <SearchBillTermRef
          isOpen={lookups.billTerm}
          onClose={(selected) => {
            toggleLookup("billTerm", false);
            if (!selected) return;
            onChangeForm({
              billtermCode:
                getValue(selected?.billtermCode) ||
                getValue(selected?.billterm_code) ||
                getValue(selected?.code),
              billtermName:
                getValue(selected?.billtermName) ||
                getValue(selected?.billterm_name) ||
                getValue(selected?.name),
            });
          }}
        />

        <SearchCurrRef
          isOpen={lookups.curr}
          onClose={(selected) => {
            toggleLookup("curr", false);
            if (!selected) return;
            onChangeForm({
              currCode: getValue(selected?.currCode),
              currName: getValue(selected?.currName),
            });
          }}
        />
      </div>
    );
  }
);

CustSetupTab.displayName = "CustSetupTab";
export default CustSetupTab;