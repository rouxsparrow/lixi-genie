"use client";

import { useState } from "react";
import Link from "next/link";
import { UIState } from "@/lib/lixi/useEventState";

interface StatusBadgeProps {
  status: UIState;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<
    UIState,
    { icon: string; text: string; className: string }
  > = {
    beforeStart: {
      icon: "🟡",
      text: "Fairness Locked",
      className: "bg-amber-100 text-amber-800",
    },
    locked: {
      icon: "🟡",
      text: "Fairness Locked",
      className: "bg-amber-100 text-amber-800",
    },
    drawing: {
      icon: "🔵",
      text: "Drawing...",
      className: "bg-blue-100 text-blue-800",
    },
    prizeRevealed: {
      icon: "🟠",
      text: "Prize Revealed",
      className: "bg-amber-100 text-amber-800",
    },
    seedRevealed: {
      icon: "🟢",
      text: "Seed Revealed",
      className: "bg-green-100 text-green-800",
    },
    verifiedPass: {
      icon: "✅",
      text: "Verified",
      className: "bg-green-100 text-green-800",
    },
    void: {
      icon: "⚫",
      text: "VOID",
      className: "bg-gray-100 text-gray-800",
    },
  };

  const v = variants[status];

  return (
    <span
      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${v.className}`}
    >
      {v.icon} <span className="hidden sm:inline">{v.text}</span>
      <span className="sm:hidden">{v.text.split(" ")[0]}</span>
    </span>
  );
}

interface PrizeCounterProps {
  count: number;
}

function PrizeCounter({ count }: PrizeCounterProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 bg-lixi-gold/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
      <span className="text-base sm:text-lg">🎁</span>
      <span className="text-xs sm:text-sm font-medium text-gray-700">
        <span className="font-bold text-lixi-red">{count}</span>{" "}
        <span className="hidden sm:inline">slots left</span>
        <span className="sm:hidden">left</span>
      </span>
    </div>
  );
}

// Audit Dialog Component
interface AuditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

function AuditDialog({ isOpen, onClose, eventId }: AuditDialogProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloadError(null);
    setIsDownloading(true);

    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/audit.json`, {
        cache: "no-store",
      });

      if (!res.ok) {
        let message = `Failed to download audit file (${res.status})`;
        try {
          const json = (await res.json()) as { error?: { code?: string; message?: string } };
          if (json.error?.message) {
            message = json.error.code ? `[${json.error.code}] ${json.error.message}` : json.error.message;
          }
        } catch {
          // keep default message if response body is not JSON
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-${eventId}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Failed to download audit file");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

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
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 border-b border-amber-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>📦</span> Audit Package
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-500 hover:bg-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Download the audit file to verify the fairness of all draws independently. 
            You can also verify it on our verification page.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                downloaded
                  ? "bg-green-500"
                  : "bg-gradient-to-r from-lixi-gold to-amber-500 hover:from-amber-400 hover:to-amber-600 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
              }`}
            >
              <span className="text-lg">{downloaded ? "✓" : "💾"}</span>
              <span>
                {isDownloading ? "Downloading..." : downloaded ? "Downloaded!" : "Download audit.json"}
              </span>
            </button>

            {downloadError && <p className="text-sm text-red-600">{downloadError}</p>}

            <Link
              href="/verify"
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-lixi-red to-red-600 hover:from-red-500 hover:to-red-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <span className="text-lg">🔍</span>
              <span>Open Verify Page</span>
            </Link>
          </div>

          {/* Info */}
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-700">What is this?</span>{" "}
              The audit.json file contains all draw records, seeds, and proof hashes. 
              You can verify it even years later to confirm the event was fair.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EventHeaderProps {
  status: UIState;
  remainingSlots: number;
  eventId?: string;
}

export function EventHeader({ status, remainingSlots, eventId = "demo" }: EventHeaderProps) {
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Show audit button only when seed is revealed
  const showAuditButton = status === "seedRevealed" || status === "verifiedPass";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b border-lixi-gold/20 z-50 shadow-sm">
        <div className="h-full max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between">
          {/* Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">🧧</span>
            <h1 className="text-base sm:text-xl font-bold text-lixi-red hidden sm:block">
              Lucky Draw
            </h1>
            <h1 className="text-base font-bold text-lixi-red sm:hidden">
              Lucky Draw
            </h1>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors border border-gray-200"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Admin</span>
            </Link>

            {/* Audit Button - Only shown after reveal */}
            {showAuditButton && (
              <button
                onClick={() => setIsAuditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 rounded-full text-xs font-bold hover:from-amber-200 hover:to-orange-200 transition-colors border border-amber-200"
              >
                <span>📦</span>
                <span className="hidden sm:inline">Audit</span>
              </button>
            )}

            <StatusBadge status={status} />
            <PrizeCounter count={remainingSlots} />
          </div>
        </div>
      </header>

      {/* Audit Dialog */}
      <AuditDialog
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        eventId={eventId}
      />
    </>
  );
}

export { StatusBadge, PrizeCounter };
