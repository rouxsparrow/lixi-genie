"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatSGD } from "@/lib/format/currency";

type EventItem = {
  id: string;
  slug: string;
  name: string;
  is_public: boolean;
  state: string;
  phase: "office" | "remote";
};

type ParticipantItem = {
  id: string;
  display_name: string;
  avatar_type: "emoji" | "image";
  avatar_emoji: string | null;
  avatar_image_path: string | null;
  participation_mode: "office" | "remote";
  draw_enabled: boolean;
  sort_order: number;
};

type PrizeItem = {
  id: string;
  label: string;
  description: string | null;
  amount_vnd: number;
  total_stock: number;
  remaining_stock: number;
  display_order: number;
};

export default function AdminPage() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");

  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [prizes, setPrizes] = useState<PrizeItem[]>([]);
  const [stateMeta, setStateMeta] = useState<{ commitmentHash: string | null; seedRevealed: boolean } | null>(null);

  const [bossInput, setBossInput] = useState("");
  const [newEventSlug, setNewEventSlug] = useState("");
  const [newEventName, setNewEventName] = useState("");

  const [newParticipant, setNewParticipant] = useState({
    displayName: "",
    avatarEmoji: "👤",
    participationMode: "office" as "office" | "remote",
  });
  const [importSourceSlug, setImportSourceSlug] = useState("");
  const [importPrizeSourceSlug, setImportPrizeSourceSlug] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<ParticipantItem | null>(null);
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editParticipantForm, setEditParticipantForm] = useState({
    displayName: "",
    avatarType: "emoji" as "emoji" | "image",
    avatarEmoji: "👤",
    avatarImagePath: "" as string | null,
    participationMode: "office" as "office" | "remote",
    drawEnabled: true,
    sortOrder: 0,
  });

  const [newPrize, setNewPrize] = useState({
    label: "",
    description: "",
    amountVnd: "100000",
    totalStock: "1",
    displayOrder: "0",
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  type RequestError = Error & {
    status?: number;
    code?: string;
  };

  const selectedEvent = useMemo(
    () => events.find((event) => event.slug === selectedSlug) ?? null,
    [events, selectedSlug]
  );
  const canStartLock = selectedEvent?.state === "setup";
  const importableEvents = useMemo(
    () => events.filter((event) => event.slug !== selectedSlug),
    [events, selectedSlug]
  );

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2500);
  };

  const showError = (text: string) => {
    setError(text);
    setTimeout(() => setError(null), 3500);
  };

  const requestJson = useCallback(async (url: string, init?: RequestInit) => {
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error((json as { error?: { message?: string } }).error?.message || "Request failed") as RequestError;
      err.status = res.status;
      err.code = (json as { error?: { code?: string } }).error?.code;
      throw err;
    }
    return json as Record<string, unknown>;
  }, []);

  const handleRequestError = useCallback((e: unknown, fallback: string) => {
    const err = e as RequestError;
    if (err.status === 401 || err.code === "unauthorized") {
      setIsAuthed(false);
      setAuthError("Admin session expired. Please sign in again.");
      return;
    }
    showError(err instanceof Error ? err.message : fallback);
  }, []);

  const loadEvents = useCallback(async () => {
    const json = await requestJson("/api/admin/events");
    const nextEvents = (json.events as EventItem[]) ?? [];
    setEvents(nextEvents);
    if (nextEvents.length > 0 && !nextEvents.find((event) => event.slug === selectedSlug)) {
      setSelectedSlug(nextEvents[0].slug);
    }
  }, [requestJson, selectedSlug]);

  const loadSelectedEventData = useCallback(async () => {
    if (!selectedSlug) return;

    const [participantsRes, prizesRes, stateRes] = await Promise.all([
      requestJson(`/api/admin/events/${selectedSlug}/participants`),
      requestJson(`/api/admin/events/${selectedSlug}/prizes`),
      fetch(`/api/events/${selectedSlug}/state`, { cache: "no-store" }).then((res) => res.json()),
    ]);

    setParticipants((participantsRes.participants as ParticipantItem[]) ?? []);
    setPrizes((prizesRes.prizes as PrizeItem[]) ?? []);
    setStateMeta({
      commitmentHash: (stateRes as { event?: { commitmentHash?: string | null } }).event?.commitmentHash ?? null,
      seedRevealed: Boolean((stateRes as { event?: { seedRevealed?: boolean } }).event?.seedRevealed),
    });
  }, [requestJson, selectedSlug]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        const json = (await res.json()) as { authenticated?: boolean };
        if (!mounted) return;
        setIsAuthed(Boolean(json.authenticated));
      } catch {
        if (!mounted) return;
        setIsAuthed(false);
      } finally {
        if (mounted) {
          setIsCheckingSession(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthed) return;
    loadEvents().catch((e) => handleRequestError(e, "Failed to load events"));
  }, [isAuthed, loadEvents, handleRequestError]);

  useEffect(() => {
    if (!isAuthed || !selectedSlug) return;
    loadSelectedEventData().catch((e) => handleRequestError(e, "Failed to load event data"));
  }, [isAuthed, selectedSlug, loadSelectedEventData, handleRequestError]);

  useEffect(() => {
    if (importableEvents.length === 0) {
      setImportSourceSlug("");
      setImportPrizeSourceSlug("");
      return;
    }
    if (!importSourceSlug || !importableEvents.some((event) => event.slug === importSourceSlug)) {
      setImportSourceSlug(importableEvents[0].slug);
    }
    if (!importPrizeSourceSlug || !importableEvents.some((event) => event.slug === importPrizeSourceSlug)) {
      setImportPrizeSourceSlug(importableEvents[0].slug);
    }
  }, [importPrizeSourceSlug, importSourceSlug, importableEvents]);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsBusy(true);
    try {
      await requestJson("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ passcode }),
      });
      setIsAuthed(true);
      setIsCheckingSession(false);
      setPasscode("");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsBusy(false);
    }
  };

  const logout = async () => {
    setIsBusy(true);
    try {
      await requestJson("/api/admin/logout", { method: "POST" });
      setIsAuthed(false);
      setIsCheckingSession(false);
      setEvents([]);
      setParticipants([]);
      setPrizes([]);
      setStateMeta(null);
    } finally {
      setIsBusy(false);
    }
  };

  const createEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newEventSlug.trim() || !newEventName.trim()) return;
    setIsBusy(true);
    try {
      await requestJson("/api/admin/events", {
        method: "POST",
        body: JSON.stringify({ slug: newEventSlug.trim(), name: newEventName.trim() }),
      });
      showMessage("Event created");
      setNewEventSlug("");
      setNewEventName("");
      await loadEvents();
    } catch (e) {
      handleRequestError(e, "Failed to create event");
    } finally {
      setIsBusy(false);
    }
  };

  const deleteSelectedEvent = async () => {
    if (!selectedEvent) return;
    const confirmed = window.confirm(
      `Delete event "${selectedEvent.name}" (${selectedEvent.slug})?\nThis will remove participants, prizes, draw records, and audit logs for this event.`
    );
    if (!confirmed) return;

    setIsBusy(true);
    try {
      await requestJson(`/api/admin/events/${selectedEvent.slug}`, {
        method: "DELETE",
      });

      showMessage(`Event "${selectedEvent.slug}" deleted`);
      setParticipants([]);
      setPrizes([]);
      setStateMeta(null);
      setSelectedSlug("");
      await loadEvents();
    } catch (e) {
      handleRequestError(e, "Failed to delete event");
    } finally {
      setIsBusy(false);
    }
  };

  const toggleSelectedEventVisibility = async () => {
    if (!selectedEvent) return;
    const nextIsPublic = !selectedEvent.is_public;
    setIsBusy(true);
    try {
      await requestJson(`/api/admin/events/${selectedEvent.slug}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublic: nextIsPublic }),
      });
      showMessage(nextIsPublic ? "Event is now visible to public" : "Event hidden from public");
      await loadEvents();
      await loadSelectedEventData();
    } catch (e) {
      handleRequestError(e, "Failed to update event visibility");
    } finally {
      setIsBusy(false);
    }
  };

  const createParticipant = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSlug || !newParticipant.displayName.trim()) return;

    setIsBusy(true);
    try {
      let avatarType: "emoji" | "image" = "emoji";
      let avatarImagePath: string | undefined;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const uploadRes = await fetch(`/api/admin/events/${selectedSlug}/avatars`, {
          method: "POST",
          body: formData,
        });
        const uploadJson = (await uploadRes.json()) as { path?: string; error?: { message?: string } };
        if (!uploadRes.ok || !uploadJson.path) {
          throw new Error(uploadJson.error?.message || "Avatar upload failed");
        }
        avatarType = "image";
        avatarImagePath = uploadJson.path;
      }

      await requestJson(`/api/admin/events/${selectedSlug}/participants`, {
        method: "POST",
        body: JSON.stringify({
          displayName: newParticipant.displayName.trim(),
          avatarType,
          avatarEmoji: newParticipant.avatarEmoji,
          avatarImagePath,
          participationMode: newParticipant.participationMode,
          drawEnabled: true,
          sortOrder: participants.length + 1,
        }),
      });
      setNewParticipant({ displayName: "", avatarEmoji: "👤", participationMode: "office" });
      setAvatarFile(null);
      showMessage("Participant created");
      await loadSelectedEventData();
    } catch (e) {
      handleRequestError(e, "Failed to create participant");
    } finally {
      setIsBusy(false);
    }
  };

  const createPrize = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSlug || !newPrize.label.trim()) return;
    setIsBusy(true);
    try {
      await requestJson(`/api/admin/events/${selectedSlug}/prizes`, {
        method: "POST",
        body: JSON.stringify({
          label: newPrize.label.trim(),
          description: newPrize.description.trim() || null,
          amountVnd: Number(newPrize.amountVnd),
          totalStock: Number(newPrize.totalStock),
          displayOrder: Number(newPrize.displayOrder),
        }),
      });
      setNewPrize({ label: "", description: "", amountVnd: "100000", totalStock: "1", displayOrder: "0" });
      showMessage("Prize created");
      await loadSelectedEventData();
    } catch (e) {
      handleRequestError(e, "Failed to create prize");
    } finally {
      setIsBusy(false);
    }
  };

  const importParticipants = async () => {
    if (!selectedSlug || !importSourceSlug) return;
    setIsBusy(true);
    try {
      const result = await requestJson(`/api/admin/events/${selectedSlug}/participants/import`, {
        method: "POST",
        body: JSON.stringify({
          sourceSlug: importSourceSlug,
          skipExistingByName: true,
        }),
      });

      const imported = Number(result.imported ?? 0);
      const skipped = Number(result.skipped ?? 0);
      showMessage(
        skipped > 0
          ? `Imported ${imported} participant(s), skipped ${skipped} duplicate name(s)`
          : `Imported ${imported} participant(s)`
      );
      await loadSelectedEventData();
    } catch (e) {
      handleRequestError(e, "Failed to import participants");
    } finally {
      setIsBusy(false);
    }
  };

  const importPrizes = async () => {
    if (!selectedSlug || !importPrizeSourceSlug) return;
    setIsBusy(true);
    try {
      const result = await requestJson(`/api/admin/events/${selectedSlug}/prizes/import`, {
        method: "POST",
        body: JSON.stringify({
          sourceSlug: importPrizeSourceSlug,
          skipExistingByLabel: true,
        }),
      });

      const imported = Number(result.imported ?? 0);
      const skipped = Number(result.skipped ?? 0);
      showMessage(
        skipped > 0
          ? `Imported ${imported} prize(s), skipped ${skipped} duplicate label(s)`
          : `Imported ${imported} prize(s)`
      );
      await loadSelectedEventData();
    } catch (e) {
      handleRequestError(e, "Failed to import prizes");
    } finally {
      setIsBusy(false);
    }
  };

  const removeParticipant = async (participantId: string) => {
    if (!selectedSlug) return;
    setIsBusy(true);
    try {
      await requestJson(`/api/admin/events/${selectedSlug}/participants/${participantId}`, {
        method: "DELETE",
      });
      await loadSelectedEventData();
    } catch (e) {
      handleRequestError(e, "Failed to remove participant");
    } finally {
      setIsBusy(false);
    }
  };

  const openEditParticipant = (participant: ParticipantItem) => {
    setEditingParticipant(participant);
    setEditAvatarFile(null);
    setEditParticipantForm({
      displayName: participant.display_name,
      avatarType: participant.avatar_type,
      avatarEmoji: participant.avatar_emoji ?? "👤",
      avatarImagePath: participant.avatar_image_path,
      participationMode: participant.participation_mode,
      drawEnabled: participant.draw_enabled,
      sortOrder: participant.sort_order,
    });
  };

  const closeEditParticipant = () => {
    setEditingParticipant(null);
    setEditAvatarFile(null);
  };

  const saveParticipantEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSlug || !editingParticipant) return;
    if (!editParticipantForm.displayName.trim()) {
      showError("Display name is required");
      return;
    }

    setIsBusy(true);
    try {
      let avatarType: "emoji" | "image" = editParticipantForm.avatarType;
      let avatarImagePath = editParticipantForm.avatarImagePath;

      if (editAvatarFile) {
        const formData = new FormData();
        formData.append("file", editAvatarFile);
        const uploadRes = await fetch(`/api/admin/events/${selectedSlug}/avatars`, {
          method: "POST",
          body: formData,
        });
        const uploadJson = (await uploadRes.json()) as { path?: string; error?: { message?: string } };
        if (!uploadRes.ok || !uploadJson.path) {
          throw new Error(uploadJson.error?.message || "Avatar upload failed");
        }
        avatarType = "image";
        avatarImagePath = uploadJson.path;
      }

      const payload: {
        displayName: string;
        avatarType: "emoji" | "image";
        avatarEmoji: string | null;
        avatarImagePath: string | null;
        participationMode: "office" | "remote";
        drawEnabled: boolean;
        sortOrder: number;
      } = {
        displayName: editParticipantForm.displayName.trim(),
        avatarType,
        avatarEmoji: avatarType === "emoji" ? editParticipantForm.avatarEmoji : null,
        avatarImagePath: avatarType === "image" ? avatarImagePath : null,
        participationMode: editParticipantForm.participationMode,
        drawEnabled: editParticipantForm.drawEnabled,
        sortOrder: Number(editParticipantForm.sortOrder),
      };

      await requestJson(`/api/admin/events/${selectedSlug}/participants/${editingParticipant.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      showMessage("Participant updated");
      closeEditParticipant();
      await loadSelectedEventData();
    } catch (error) {
      handleRequestError(error, "Failed to update participant");
    } finally {
      setIsBusy(false);
    }
  };

  const removePrize = async (prizeId: string) => {
    if (!selectedSlug) return;
    setIsBusy(true);
    try {
      await requestJson(`/api/admin/events/${selectedSlug}/prizes/${prizeId}`, {
        method: "DELETE",
      });
      await loadSelectedEventData();
    } catch (e) {
      handleRequestError(e, "Failed to remove prize");
    } finally {
      setIsBusy(false);
    }
  };

  const doStartLock = async () => {
    if (!selectedSlug || !bossInput.trim()) return;
    if (!canStartLock) {
      showError("Fairness is already locked for this event");
      return;
    }
    setIsBusy(true);
    try {
      await requestJson(`/api/events/${selectedSlug}/start-lock`, {
        method: "POST",
        body: JSON.stringify({ bossInput: bossInput.trim() }),
      });
      showMessage("Fairness locked");
      setBossInput("");
      await loadSelectedEventData();
    } catch (e) {
      handleRequestError(e, "Failed to start lock");
    } finally {
      setIsBusy(false);
    }
  };

  const setPhase = async (phase: "office" | "remote") => {
    if (!selectedSlug) return;
    setIsBusy(true);
    try {
      await requestJson(`/api/events/${selectedSlug}/phase`, {
        method: "POST",
        body: JSON.stringify({ phase }),
      });
      showMessage(`Phase updated to ${phase}`);
      await loadEvents();
      await loadSelectedEventData();
    } catch (e) {
      handleRequestError(e, "Failed to update phase");
    } finally {
      setIsBusy(false);
    }
  };

  const reveal = async () => {
    if (!selectedSlug) return;
    setIsBusy(true);
    try {
      await requestJson(`/api/events/${selectedSlug}/reveal`, { method: "POST" });
      showMessage("Seed revealed and verified");
      await loadEvents();
      await loadSelectedEventData();
    } catch (e) {
      handleRequestError(e, "Failed to reveal");
    } finally {
      setIsBusy(false);
    }
  };

  const voidLatest = async () => {
    if (!selectedSlug) return;
    setIsBusy(true);
    try {
      await requestJson(`/api/events/${selectedSlug}/void-latest`, {
        method: "POST",
        body: JSON.stringify({ reason: "Mistaken draw" }),
      });
      showMessage("Latest draw voided");
      await loadSelectedEventData();
    } catch (e) {
      handleRequestError(e, "Failed to void latest draw");
    } finally {
      setIsBusy(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-dvh bg-lixi-cream flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-lixi-gold/20 text-center">
          <p className="text-gray-600">Checking admin session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-dvh bg-lixi-cream flex items-center justify-center p-4">
        <form
          onSubmit={login}
          className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-lixi-gold/20 space-y-4"
        >
          <h1 className="text-2xl font-black text-lixi-red text-center">Admin Sign In</h1>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-lixi-gold"
            placeholder="Admin passcode"
          />
          {authError && <p className="text-sm text-red-600">{authError}</p>}
          <button
            type="submit"
            disabled={isBusy}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-lixi-red to-lixi-red-dark disabled:opacity-50"
          >
            {isBusy ? "Signing in..." : "Sign In"}
          </button>
          <Link href="/" className="block text-center text-sm text-gray-500 hover:text-gray-700">
            ← Back to Home
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-lixi-cream">
      <header className="bg-white/80 backdrop-blur-md border-b border-lixi-gold/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/");
                }
              }}
              className="text-gray-600 hover:text-lixi-red"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-lixi-red">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            {selectedEvent ? (
              <Link href={`/event/${selectedSlug}`} className="px-3 py-2 rounded-lg bg-lixi-red text-white text-sm font-medium">
                Open Event
              </Link>
            ) : (
              <span className="px-3 py-2 rounded-lg bg-gray-200 text-gray-500 text-sm font-medium">
                Open Event
              </span>
            )}
            <button onClick={logout} className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {message && <div className="clay-card p-3 text-green-700 bg-green-50 border border-green-200">{message}</div>}
        {error && <div className="clay-card p-3 text-red-700 bg-red-50 border border-red-200">{error}</div>}

        <section className="clay-card p-4 space-y-3">
          <h2 className="text-lg font-bold text-gray-800">Events</h2>
          {selectedEvent && (
            <p className="text-xs text-gray-600">
              Visibility:{" "}
              <span className={`font-semibold ${selectedEvent.is_public ? "text-green-700" : "text-amber-700"}`}>
                {selectedEvent.is_public ? "Public" : "Hidden"}
              </span>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedSlug(event.slug)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                  selectedSlug === event.slug ? "bg-lixi-red text-white border-lixi-red" : "bg-white text-gray-700 border-gray-200"
                }`}
              >
                {event.name} ({event.slug}){event.is_public ? "" : " • hidden"}
              </button>
            ))}
          </div>

          <form onSubmit={createEvent} className="grid md:grid-cols-3 gap-3">
            <input
              value={newEventSlug}
              onChange={(e) => setNewEventSlug(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300"
              placeholder="event-slug"
            />
            <input
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300"
              placeholder="Event Name"
            />
            <button type="submit" className="px-3 py-2 rounded-lg bg-lixi-gold text-white font-bold">
              Create Event
            </button>
          </form>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={toggleSelectedEventVisibility}
              disabled={isBusy || !selectedEvent}
              className={`px-3 py-2 rounded-lg text-white text-sm font-bold disabled:opacity-50 ${
                selectedEvent?.is_public ? "bg-amber-600" : "bg-emerald-600"
              }`}
            >
              {selectedEvent?.is_public ? "Hide from Public" : "Show to Public"}
            </button>
            <button
              type="button"
              onClick={deleteSelectedEvent}
              disabled={isBusy || !selectedEvent}
              className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-bold disabled:opacity-50"
            >
              Delete Selected Event
            </button>
          </div>
        </section>

        {selectedEvent && (
          <section className="grid lg:grid-cols-3 gap-4">
            <div className="clay-card p-4 space-y-3">
              <h3 className="text-base font-bold">Event Controls</h3>
              <p className="text-xs text-gray-500">
                State: <span className="font-semibold">{selectedEvent.state}</span> | Phase: <span className="font-semibold">{selectedEvent.phase}</span>
              </p>
              <p className="text-xs text-gray-500 break-all">
                Commitment: {stateMeta?.commitmentHash ?? "(not locked)"}
              </p>
              <input
                value={bossInput}
                onChange={(e) => setBossInput(e.target.value)}
                disabled={!canStartLock || isBusy}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
                placeholder={canStartLock ? "Boss input for lock" : "Fairness already locked"}
              />
              <button
                onClick={doStartLock}
                disabled={isBusy || !canStartLock}
                className="w-full py-2 rounded-lg bg-lixi-gold text-white font-bold disabled:opacity-50"
              >
                Start & Lock Fairness
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setPhase("office")} className="py-2 rounded-lg bg-blue-100 text-blue-700 font-medium">
                  Phase: Office
                </button>
                <button onClick={() => setPhase("remote")} className="py-2 rounded-lg bg-purple-100 text-purple-700 font-medium">
                  Phase: Remote
                </button>
              </div>
              <button onClick={voidLatest} className="w-full py-2 rounded-lg bg-gray-800 text-white font-medium">
                VOID Latest Draw
              </button>
              <button onClick={reveal} className="w-full py-2 rounded-lg bg-green-600 text-white font-bold">
                Reveal Seed
              </button>
              <a href={`/api/events/${selectedSlug}/audit.json`} className="block text-center w-full py-2 rounded-lg bg-lixi-red text-white font-bold">
                Download audit.json
              </a>
            </div>

            <div className="clay-card p-4 space-y-3">
              <h3 className="text-base font-bold">Participants ({participants.length})</h3>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                <p className="text-xs text-gray-600">
                  Import participants from another event.
                </p>
                <div className="flex gap-2">
                  <select
                    value={importSourceSlug}
                    onChange={(e) => setImportSourceSlug(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white"
                    disabled={importableEvents.length === 0 || isBusy}
                  >
                    {importableEvents.length === 0 ? (
                      <option value="">No source events available</option>
                    ) : (
                      importableEvents.map((event) => (
                        <option key={event.id} value={event.slug}>
                          {event.name} ({event.slug})
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={importParticipants}
                    disabled={!importSourceSlug || isBusy || importableEvents.length === 0}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50"
                  >
                    Import
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Duplicate display names in this event are skipped automatically.
                </p>
              </div>
              <form onSubmit={createParticipant} className="space-y-2">
                <input
                  value={newParticipant.displayName}
                  onChange={(e) => setNewParticipant((prev) => ({ ...prev, displayName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  placeholder="Display name"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newParticipant.avatarEmoji}
                    onChange={(e) => setNewParticipant((prev) => ({ ...prev, avatarEmoji: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                    placeholder="Emoji"
                  />
                  <select
                    value={newParticipant.participationMode}
                    onChange={(e) =>
                      setNewParticipant((prev) => ({ ...prev, participationMode: e.target.value as "office" | "remote" }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  >
                    <option value="office">office</option>
                    <option value="remote">remote</option>
                  </select>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
                <p className="text-xs text-gray-500">
                  Optional avatar upload. If provided, image avatar is used.
                </p>
                <button className="w-full py-2 rounded-lg bg-lixi-gold text-white font-bold">Add Participant</button>
              </form>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
                    <div>
                      <p className="text-sm font-medium">
                        {participant.avatar_type === "image" ? "🖼️" : (participant.avatar_emoji || "👤")} {participant.display_name}
                      </p>
                      <p className="text-xs text-gray-500">{participant.participation_mode}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEditParticipant(participant)} className="text-xs text-blue-600 hover:underline">
                        Edit
                      </button>
                      <button onClick={() => removeParticipant(participant.id)} className="text-xs text-red-600 hover:underline">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="clay-card p-4 space-y-3">
              <h3 className="text-base font-bold">Prizes ({prizes.length})</h3>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                <p className="text-xs text-gray-600">
                  Import prizes from another event.
                </p>
                <div className="flex gap-2">
                  <select
                    value={importPrizeSourceSlug}
                    onChange={(e) => setImportPrizeSourceSlug(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white"
                    disabled={importableEvents.length === 0 || isBusy}
                  >
                    {importableEvents.length === 0 ? (
                      <option value="">No source events available</option>
                    ) : (
                      importableEvents.map((event) => (
                        <option key={event.id} value={event.slug}>
                          {event.name} ({event.slug})
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={importPrizes}
                    disabled={!importPrizeSourceSlug || isBusy || importableEvents.length === 0}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50"
                  >
                    Import
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Duplicate prize labels in this event are skipped automatically.
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Configure prize title, short description, amount in SGD, stock, and display order.
              </p>
              <form onSubmit={createPrize} className="space-y-2">
                <input
                  value={newPrize.label}
                  onChange={(e) => setNewPrize((prev) => ({ ...prev, label: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  placeholder="Prize label"
                />
                <input
                  value={newPrize.description}
                  onChange={(e) => setNewPrize((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  placeholder="Prize description"
                />
                <div className="grid grid-cols-3 gap-2">
                  <label className="space-y-1">
                    <span className="block text-[11px] font-medium text-gray-500">
                      Amount (SGD)
                    </span>
                    <input
                      type="number"
                      value={newPrize.amountVnd}
                      onChange={(e) => setNewPrize((prev) => ({ ...prev, amountVnd: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300"
                      placeholder="e.g. 2"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[11px] font-medium text-gray-500">
                      Stock Qty
                    </span>
                    <input
                      type="number"
                      value={newPrize.totalStock}
                      onChange={(e) => setNewPrize((prev) => ({ ...prev, totalStock: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300"
                      placeholder="e.g. 3"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[11px] font-medium text-gray-500">
                      Display Order
                    </span>
                    <input
                      type="number"
                      value={newPrize.displayOrder}
                      onChange={(e) => setNewPrize((prev) => ({ ...prev, displayOrder: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300"
                      placeholder="e.g. 0"
                    />
                  </label>
                </div>
                <button className="w-full py-2 rounded-lg bg-lixi-gold text-white font-bold">Add Prize</button>
              </form>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {prizes.map((prize) => (
                  <div key={prize.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
                    <div>
                      <p className="text-sm font-medium">{prize.label}</p>
                      {prize.description && <p className="text-xs text-gray-500">{prize.description}</p>}
                      <p className="text-xs text-gray-500">
                        {formatSGD(prize.amount_vnd)} • {prize.remaining_stock}/{prize.total_stock}
                      </p>
                    </div>
                    <button onClick={() => removePrize(prize.id)} className="text-xs text-red-600 hover:underline">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {editingParticipant && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={saveParticipantEdit}
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 p-5 space-y-3"
          >
            <h3 className="text-lg font-bold text-gray-800">Edit Participant</h3>

            <input
              value={editParticipantForm.displayName}
              onChange={(e) => setEditParticipantForm((prev) => ({ ...prev, displayName: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300"
              placeholder="Display name"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={editParticipantForm.avatarType}
                onChange={(e) =>
                  setEditParticipantForm((prev) => ({
                    ...prev,
                    avatarType: e.target.value as "emoji" | "image",
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              >
                <option value="emoji">emoji</option>
                <option value="image">image</option>
              </select>

              <select
                value={editParticipantForm.participationMode}
                onChange={(e) =>
                  setEditParticipantForm((prev) => ({
                    ...prev,
                    participationMode: e.target.value as "office" | "remote",
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              >
                <option value="office">office</option>
                <option value="remote">remote</option>
              </select>
            </div>

            {editParticipantForm.avatarType === "emoji" ? (
              <input
                value={editParticipantForm.avatarEmoji}
                onChange={(e) => setEditParticipantForm((prev) => ({ ...prev, avatarEmoji: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
                placeholder="Emoji"
              />
            ) : (
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditAvatarFile(e.target.files?.[0] ?? null)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
                {editParticipantForm.avatarImagePath && (
                  <p className="text-xs text-gray-500 break-all">Current: {editParticipantForm.avatarImagePath}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 items-center">
              <input
                type="number"
                value={editParticipantForm.sortOrder}
                onChange={(e) => setEditParticipantForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
                placeholder="Sort order"
              />
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editParticipantForm.drawEnabled}
                  onChange={(e) => setEditParticipantForm((prev) => ({ ...prev, drawEnabled: e.target.checked }))}
                />
                Draw enabled
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeEditParticipant}
                className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isBusy}
                className="px-3 py-2 rounded-lg bg-lixi-red text-white font-bold disabled:opacity-50"
              >
                {isBusy ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
