"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { VerifyAuditResponse } from "@/lib/types/contracts";

export default function VerifyPage() {
  const [fileName, setFileName] = useState("");
  const [auditPayload, setAuditPayload] = useState<unknown>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyAuditResponse | null>(null);

  const onUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result ?? "{}");
        setAuditPayload(JSON.parse(text));
        setResult(null);
        setError(null);
      } catch {
        setAuditPayload(null);
        setResult(null);
        setError("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  }, []);

  const verify = useCallback(async () => {
    if (!auditPayload) {
      setError("Upload a valid audit.json first");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch("/api/verify/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(auditPayload),
      });

      const json = (await res.json()) as VerifyAuditResponse & {
        error?: { code?: string; message?: string };
      };

      if (!res.ok) {
        const apiCode = json.error?.code ?? "verification_failed";
        const apiMessage = json.error?.message ?? "Verification failed";
        throw new Error(`[${apiCode}] ${apiMessage}`);
      }

      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
      setResult(null);
    } finally {
      setIsVerifying(false);
    }
  }, [auditPayload]);

  return (
    <div className="min-h-dvh bg-lixi-cream">
      <header className="bg-white/80 backdrop-blur-md border-b border-lixi-gold/20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-600 hover:text-lixi-red">
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-lixi-red">🔐 Verify Audit Log</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-white/80 rounded-2xl p-5 shadow-lg border border-lixi-gold/20">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Upload audit.json</h2>
          <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-lixi-gold transition-colors">
            <input type="file" className="hidden" accept=".json" onChange={onUpload} />
            <div className="text-4xl mb-2">📁</div>
            <p className="font-medium text-gray-800">{fileName || "Choose audit.json"}</p>
            <p className="text-xs text-gray-500 mt-1">Deterministic commitment, chain, and draw replay checks</p>
          </label>
          <button
            onClick={verify}
            disabled={!auditPayload || isVerifying}
            className="mt-4 w-full py-3 bg-gradient-to-r from-lixi-gold to-amber-500 text-white font-bold rounded-xl disabled:opacity-50"
          >
            {isVerifying ? "Verifying..." : "Run Verification"}
          </button>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </section>

        {result && (
          <section className="bg-white/80 rounded-2xl p-5 shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Verification Results</h2>

            <div className={`rounded-xl p-3 border-2 ${result.commitment.pass ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <p className="text-sm font-bold">Commitment: {result.commitment.pass ? "PASS" : "FAIL"}</p>
              <p className="text-xs text-gray-600 mt-1 break-all">expected: {result.commitment.expected}</p>
              <p className="text-xs text-gray-600 break-all">actual: {result.commitment.actual}</p>
            </div>

            <div className={`rounded-xl p-3 border-2 ${result.chain.pass ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <p className="text-sm font-bold">Chain: {result.chain.pass ? "PASS" : "FAIL"}</p>
              <p className="text-xs text-gray-600 mt-1">Length: {result.chain.chainLength}</p>
              {result.chain.failures.length > 0 && (
                <ul className="list-disc list-inside text-xs text-red-600 mt-2 space-y-1">
                  {result.chain.failures.map((failure) => (
                    <li key={failure}>{failure}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl p-3 bg-gray-50">
              <p className="text-sm font-bold text-gray-800">
                Summary: {result.summary.passed} pass / {result.summary.failed} fail ({result.summary.total} total)
              </p>
            </div>

            <div className="space-y-2">
              {result.draws.map((draw) => (
                <div
                  key={draw.drawId}
                  className={`rounded-lg p-2 border ${draw.pass ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                >
                  <p className="text-xs font-semibold">{draw.drawId}</p>
                  <p className="text-xs">{draw.pass ? "PASS" : "FAIL"} — {draw.reason}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
