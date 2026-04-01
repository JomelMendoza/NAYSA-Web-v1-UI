import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSwalErrorAlert } from "@/NAYSA Cloud/Global/behavior.jsx"; // adjust import path

const CancelTranModal = ({ isOpen, onClose, onSubmit }) => {
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setPassword("");
    }
  }, [isOpen]);

  const cancelMutation = useMutation({
    mutationFn: async (data) => {
      return await onSubmit?.(data);
    },
    onSuccess: (success) => {
      if (success) {
        setReason("");
        setPassword("");
        onClose(false);
      } else {
        useSwalErrorAlert(
          "Incorrect Password", 
          "The password you entered is incorrect. Please try again."
        );
        setPassword("");
      }
    },
    onError: (error) => {
      setPassword("");
      console.error("Cancel submission error:", error);
      useSwalErrorAlert(
        "Submission Error", 
        "An error occurred while trying to cancel the document."
      );
    },
  });

  const handleSubmit = () => {
    if (!reason.trim() || !password.trim()) {
      useSwalErrorAlert("Required Fields", "Reason and password are required.");
      return;
    }

    cancelMutation.mutate({
      reason: reason.trim(),
      password: password.trim(),
    });
  };

  const handleClose = () => {
    setReason("");
    setPassword("");
    onClose(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 transition-opacity">
      {/* Modal Container */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Removed bottom border to make it feel connected to the body */}
        <div className="px-6 pt-5 pb-2 flex justify-between items-center bg-white">
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Cancel Document</h2>
          <button 
            onClick={handleClose}
            disabled={cancelMutation.isPending}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body - Adjusted padding and space-y to tighten gaps */}
        <div className="px-6 pb-6 pt-2 space-y-4">
          
          {/* Warning Callout */}
          <div className="flex items-start gap-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-md">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-800 font-medium leading-snug">
               This action is permanent. Cancelled transactions cannot be unposted.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Reason for Cancellation
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you are canceling this document..."
                disabled={cancelMutation.isPending}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors resize-none disabled:bg-gray-50 disabled:text-gray-500 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to confirm"
                autoComplete="new-password"
                disabled={cancelMutation.isPending}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={cancelMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Keep Document
          </button>
          <button
            onClick={handleSubmit}
            disabled={cancelMutation.isPending}
            className="flex items-center justify-center min-w-[120px] px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {cancelMutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              "Cancel Document"
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default CancelTranModal;