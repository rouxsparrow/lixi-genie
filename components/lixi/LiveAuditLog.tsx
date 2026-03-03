"use client";

import { useState } from "react";
import { AuditEntry, VerificationStatus } from "@/lib/lixi/mockData";
import { formatSGD } from "@/lib/format/currency";

interface LogEntryProps {
  entry: AuditEntry;
  showVerification: boolean;
  onClick: (entry: AuditEntry) => void;
}

function LogEntry({ entry, showVerification, onClick }: LogEntryProps) {
  const statusConfig = {
    locked: {
      color: "bg-amber-100 text-amber-700",
      label: "Locked",
    },
    verified: {
      color: "bg-green-100 text-green-700",
      label: "Verified",
    },
    void: {
      color: "bg-gray-100 text-gray-700",
      label: "VOID",
    },
  };

  const verificationConfig: Record<VerificationStatus, { icon: string; color: string; label: string }> = {
    pending: { icon: "⏳", color: "text-gray-400", label: "Pending" },
    pass: { icon: "✅", color: "text-green-500", label: "PASS" },
    fail: { icon: "❌", color: "text-red-500", label: "FAIL" },
  };

  const status = statusConfig[entry.status];
  const verification = entry.verification ? verificationConfig[entry.verification] : null;

  const isVoid = entry.status === "void";

  return (
    <button
      onClick={() => onClick(entry)}
      className={`w-full text-left rounded-xl p-2.5 sm:p-3 shadow-sm border transition-all hover:shadow-md ${
        isVoid 
          ? "bg-gray-50 border-gray-200 opacity-75" 
          : "bg-white border-gray-100 hover:border-lixi-gold/50"
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-base sm:text-lg ${isVoid ? "grayscale" : ""}`} aria-hidden="true">
            {entry.playerAvatar}
          </span>
          <span className={`font-medium text-xs sm:text-sm ${isVoid ? "text-gray-500" : "text-gray-800"}`}>
            {entry.playerName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* VOID Badge */}
          {isVoid && (
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 font-bold">
              VOID
            </span>
          )}
          {/* Status Badge */}
          <span
            className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${status.color}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
        <span>{entry.time}</span>
        <span className="font-mono opacity-60">{entry.proofHash}</span>
      </div>

      {/* Prize Amount and Verification */}
      <div className="mt-1 flex items-center justify-between">
        <div className={`text-sm sm:text-base font-bold ${isVoid ? "text-gray-400" : "text-lixi-red"}`}>
          {isVoid ? "VOID" : formatSGD(entry.prizeAmount)}
        </div>
        
        {/* PASS/FAIL Badge - Only shown after reveal */}
        {showVerification && verification && entry.status !== "void" && (
          <span className={`text-xs font-bold ${verification.color} flex items-center gap-1`}>
            <span>{verification.icon}</span>
            <span>{verification.label}</span>
          </span>
        )}
        
        {/* VOID badge for void entries when showing verification */}
        {showVerification && isVoid && (
          <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
            <span>🚫</span>
            <span>VOID</span>
          </span>
        )}
      </div>
    </button>
  );
}

interface AuditDetailDialogProps {
  entry: AuditEntry | null;
  isOpen: boolean;
  onClose: () => void;
  showVerification: boolean;
}

function AuditDetailDialog({ entry, isOpen, onClose, showVerification }: AuditDetailDialogProps) {
  if (!isOpen || !entry) return null;

  const isVoid = entry.status === "void";

  const verificationConfig: Record<VerificationStatus, { icon: string; color: string; label: string; bg: string }> = {
    pending: { icon: "⏳", color: "text-gray-600", label: "Pending Verification", bg: "bg-gray-100" },
    pass: { icon: "✅", color: "text-green-700", label: "Verification PASSED", bg: "bg-green-100" },
    fail: { icon: "❌", color: "text-red-700", label: "Verification FAILED", bg: "bg-red-100" },
  };

  const verification = entry.verification ? verificationConfig[entry.verification] : null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 sm:p-6 ${isVoid ? "bg-gray-100" : "bg-gradient-to-br from-lixi-gold/20 to-lixi-red/10"}`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-4xl sm:text-5xl ${isVoid ? "grayscale" : ""}`}>
              {entry.playerAvatar}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-500 hover:bg-white transition-colors"
            >
              ✕
            </button>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {entry.playerName}
          </h2>
          <p className="text-sm text-gray-500">{isVoid ? "VOID Draw" : entry.prizeName}</p>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Prize Amount */}
          {!isVoid && (
            <div className="text-center p-4 bg-gray-50 rounded-2xl">
              <p className="text-sm text-gray-500 mb-1">Prize Amount</p>
              <p className="text-3xl font-black text-lixi-red">
                {formatSGD(entry.prizeAmount)}
              </p>
            </div>
          )}

          {/* Seed */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Random Seed</p>
            <div className="flex justify-center gap-2">
              {(entry.seed || ["?", "?", "?"]).map((emoji, i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-xl bg-gradient-to-b from-gray-50 to-gray-100
                             border-2 border-gray-200 flex items-center justify-center text-2xl
                             shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] ${isVoid ? "grayscale" : ""}`}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>

          {/* Proof Hash */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Proof Hash</p>
            <div className="bg-gray-100 rounded-xl p-3 font-mono text-xs text-gray-600 break-all">
              {entry.proofHash}
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Time</span>
            <span className="font-medium text-gray-800">{entry.time}</span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              entry.status === "verified" ? "bg-green-100 text-green-700" :
              entry.status === "void" ? "bg-gray-200 text-gray-700" :
              "bg-amber-100 text-amber-700"
            }`}>
              {entry.status === "verified" ? "✅ Verified" :
               entry.status === "void" ? "🚫 VOID" :
               "🔒 Locked"}
            </span>
          </div>

          {/* Verification Result - Only shown after reveal */}
          {showVerification && verification && (
            <div className={`p-3 rounded-xl ${verification.bg} ${verification.color}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{verification.icon}</span>
                <span className="font-bold text-sm">{verification.label}</span>
              </div>
              {entry.verification === "pass" && (
                <p className="text-xs mt-1 opacity-80">
                  Hash chain verified — this draw is authentic and untampered.
                </p>
              )}
              {entry.verification === "fail" && (
                <p className="text-xs mt-1 opacity-80">
                  Hash mismatch detected — this record may have been tampered with.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface LiveAuditLogProps {
  entries: AuditEntry[];
  showVerification?: boolean;
}

export function LiveAuditLog({ entries, showVerification = false }: LiveAuditLogProps) {
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Calculate verification stats
  const verifiedCount = entries.filter(e => e.status === "verified" && e.verification === "pass").length;
  const failedCount = entries.filter(e => e.verification === "fail").length;
  const voidCount = entries.filter(e => e.status === "void").length;

  const handleEntryClick = (entry: AuditEntry) => {
    setSelectedEntry(entry);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => setSelectedEntry(null), 200);
  };

  return (
    <>
      <div className="bg-white/80 rounded-2xl shadow-md flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
              <span>📜</span> Live Audit Log
            </h3>
            
            {/* Verify All Status - Only shown after reveal */}
            {showVerification && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500">Verify:</span>
                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  {verifiedCount} ✅
                </span>
                {failedCount > 0 && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    {failedCount} ❌
                  </span>
                )}
                {voidCount > 0 && (
                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    {voidCount} 🚫
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Click any entry for details</p>
        </div>

        {/* Scrollable entries - ONLY scrollable element */}
        <div
          className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin"
          role="log"
          aria-live="polite"
          aria-label="Audit log entries"
        >
          {entries?.length === 0 && (
            <p className="text-center text-gray-400 text-xs sm:text-sm py-8">
              No draws yet — waiting for first entry
            </p>
          )}

          {entries?.map((entry) => (
            <LogEntry 
              key={entry.id} 
              entry={entry} 
              showVerification={showVerification}
              onClick={handleEntryClick}
            />
          ))}
        </div>
      </div>

      {/* Detail Dialog */}
      <AuditDetailDialog
        entry={selectedEntry}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        showVerification={showVerification}
      />
    </>
  );
}

export { LogEntry };
