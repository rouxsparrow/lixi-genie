import { createServiceRoleClient } from "@/lib/server/supabase";
import {
  AuditPackage,
  DrawRequest,
  DrawResponse,
  DrawStatus,
  EventRecord,
  EventStateResponse,
  ParticipantRecord,
  PrizeRecord,
  VerifyAuditResponse,
} from "@/lib/types/contracts";
import { decryptSeed, encryptSeed, generateServerSeed, shortProof } from "./crypto";
import { verifyAuditPackage } from "./verify";

export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function asArray<T>(value: T[] | null | undefined): T[] {
  if (!value) return [];
  return value;
}

function deriveAvatar(participant: ParticipantRecord): string {
  if (participant.avatar_type === "emoji") {
    return participant.avatar_emoji || "👤";
  }
  return "🖼️";
}

function formatTime(value: string): string {
  const dt = new Date(value);
  return dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function toSeedTuple(value: unknown): [string, string, string] {
  if (!Array.isArray(value) || value.length !== 3) {
    return ["?", "?", "?"];
  }
  return [String(value[0]), String(value[1]), String(value[2])];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateAuditPayload(payload: unknown): AuditPackage {
  if (!isRecord(payload)) {
    throw new AppError(400, "invalid_audit_payload", "Audit payload must be an object");
  }

  const event = payload.event;
  if (!isRecord(event)) {
    throw new AppError(400, "invalid_audit_payload", "Missing event object");
  }

  if (typeof payload.commitmentHash !== "string" || payload.commitmentHash.length === 0) {
    throw new AppError(400, "invalid_audit_payload", "Missing commitmentHash");
  }
  if (typeof payload.serverSeed !== "string" || payload.serverSeed.length === 0) {
    throw new AppError(400, "invalid_audit_payload", "Missing serverSeed");
  }
  if (typeof event.id !== "string" || typeof event.slug !== "string" || typeof event.name !== "string") {
    throw new AppError(400, "invalid_audit_payload", "Invalid event fields");
  }

  const prizeSnapshot = payload.prizeSnapshot;
  if (!Array.isArray(prizeSnapshot)) {
    throw new AppError(400, "invalid_audit_payload", "prizeSnapshot must be an array");
  }
  for (const prize of prizeSnapshot) {
    if (!isRecord(prize)) {
      throw new AppError(400, "invalid_audit_payload", "Invalid prizeSnapshot entry");
    }
    if (
      typeof prize.id !== "string" ||
      typeof prize.label !== "string" ||
      !isFiniteNumber(prize.amountVnd) ||
      !isFiniteNumber(prize.totalStock) ||
      !isFiniteNumber(prize.displayOrder)
    ) {
      throw new AppError(400, "invalid_audit_payload", "Invalid prizeSnapshot entry fields");
    }
  }

  const drawRecords = payload.drawRecords;
  if (!Array.isArray(drawRecords)) {
    throw new AppError(400, "invalid_audit_payload", "drawRecords must be an array");
  }
  for (const draw of drawRecords) {
    if (!isRecord(draw)) {
      throw new AppError(400, "invalid_audit_payload", "Invalid drawRecords entry");
    }
    if (
      typeof draw.id !== "string" ||
      typeof draw.participantId !== "string" ||
      typeof draw.ticket !== "string" ||
      typeof draw.proofHash !== "string" ||
      typeof draw.prevRowHash !== "string" ||
      typeof draw.rowHash !== "string" ||
      typeof draw.createdAt !== "string" ||
      !isFiniteNumber(draw.drawNonce) ||
      typeof draw.isEffective !== "boolean"
    ) {
      throw new AppError(400, "invalid_audit_payload", "Invalid drawRecords entry fields");
    }
    if (draw.status !== "locked" && draw.status !== "verified" && draw.status !== "void") {
      throw new AppError(400, "invalid_audit_payload", "Invalid draw status");
    }
    if (!Array.isArray(draw.clientSeed) || draw.clientSeed.length !== 3 || draw.clientSeed.some((v) => typeof v !== "string")) {
      throw new AppError(400, "invalid_audit_payload", "draw.clientSeed must be [string, string, string]");
    }
  }

  return payload as unknown as AuditPackage;
}

function logDrawService(level: "info" | "warn" | "error", event: string, payload: Record<string, unknown>) {
  const prefix = `[draw-service] ${event}`;
  if (level === "warn") {
    console.warn(prefix, payload);
    return;
  }
  if (level === "error") {
    console.error(prefix, payload);
    return;
  }
  console.info(prefix, payload);
}

function mapRpcError(errorMessage: string): AppError {
  const message = errorMessage.toLowerCase();

  if (message.includes("invalid_client_seed")) {
    return new AppError(400, "invalid_client_seed", "Client seed must contain exactly 3 symbols");
  }
  if (message.includes("participant_not_found_or_disabled")) {
    return new AppError(409, "participant_not_found_or_disabled", "Participant is missing or disabled");
  }
  if (message.includes("participant_already_drawn")) {
    return new AppError(409, "participant_already_drawn", "Participant already drawn");
  }
  if (message.includes("state_not_locked")) {
    return new AppError(409, "state_not_locked", "Event is not locked");
  }
  if (message.includes("phase_blocked")) {
    return new AppError(409, "phase_blocked", "Participant not allowed in this phase");
  }
  if (message.includes("no_prize_stock")) {
    return new AppError(409, "no_prize_stock", "No prize stock left");
  }
  if (message.includes("prize_update_conflict")) {
    return new AppError(409, "conflict_retry", "Prize stock changed, please retry draw");
  }
  if (message.includes("draws_incomplete")) {
    return new AppError(409, "draws_incomplete", "Not all participants have drawn");
  }
  if (message.includes("no_effective_draw_to_void")) {
    return new AppError(409, "no_effective_draw_to_void", "No draw to void");
  }
  if (message.includes("function hmac(") && message.includes("does not exist")) {
    return new AppError(
      500,
      "db_crypto_function_missing",
      "Database crypto function mismatch. Apply latest migrations for perform_draw."
    );
  }
  if (message.includes("column reference") && message.includes("is ambiguous")) {
    return new AppError(
      500,
      "db_function_ambiguous_column",
      "Database function has ambiguous column reference. Apply latest migrations."
    );
  }
  logDrawService("warn", "rpc_unmapped_error", { errorMessage });
  return new AppError(409, "conflict_retry", errorMessage);
}

async function getEventBySlug(slug: string): Promise<EventRecord> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    throw new AppError(404, "event_not_found", "Event not found");
  }

  return data as EventRecord;
}

function ensureEventPublic(event: EventRecord) {
  if (!event.is_public) {
    throw new AppError(404, "event_not_found", "Event not found");
  }
}

type RawBundle = {
  event: EventRecord;
  participants: ParticipantRecord[];
  prizes: PrizeRecord[];
  draws: Array<Record<string, unknown>>;
};

async function getRawBundle(slug: string): Promise<RawBundle> {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);

  const [{ data: participants, error: participantsError }, { data: prizes, error: prizesError }, { data: draws, error: drawsError }] =
    await Promise.all([
      supabase.from("participants").select("*").eq("event_id", event.id).order("sort_order", { ascending: true }).order("id", { ascending: true }),
      supabase.from("prizes").select("*").eq("event_id", event.id).order("display_order", { ascending: true }).order("id", { ascending: true }),
      supabase.from("draw_records").select("*").eq("event_id", event.id).order("created_at", { ascending: false }).order("id", { ascending: false }),
    ]);

  if (participantsError || prizesError || drawsError) {
    throw new AppError(500, "db_error", "Failed to fetch event bundle");
  }

  return {
    event,
    participants: asArray(participants) as ParticipantRecord[],
    prizes: asArray(prizes) as PrizeRecord[],
    draws: asArray(draws),
  };
}

function computeChainIntegrity(drawsDesc: Array<Record<string, unknown>>) {
  const asc = [...drawsDesc].reverse();
  let prev = "GENESIS";
  let intact = true;

  for (const draw of asc) {
    const prevRowHash = String(draw.prev_row_hash ?? "");
    const rowHash = String(draw.row_hash ?? "");
    if (prevRowHash !== prev) {
      intact = false;
      break;
    }
    prev = rowHash;
  }

  return {
    intact,
    chainLength: asc.length,
  };
}

function computeVerifySummary(drawsDesc: Array<Record<string, unknown>>) {
  const effective = drawsDesc.filter((draw) => draw.status !== "void" && Boolean(draw.is_effective));
  const passed = effective.filter((draw) => draw.verification_status === "pass").length;
  const failed = effective.filter((draw) => draw.verification_status === "fail").length;
  if (effective.length === 0) {
    return null;
  }
  return {
    total: effective.length,
    passed,
    failed,
  };
}

export async function getEventState(
  slug: string,
  options?: { includeHidden?: boolean }
): Promise<EventStateResponse> {
  const includeHidden = options?.includeHidden ?? false;
  const bundle = await getRawBundle(slug);
  if (!includeHidden) {
    ensureEventPublic(bundle.event);
  }

  const participantMap = new Map(bundle.participants.map((p) => [p.id, p]));
  const prizeMap = new Map(bundle.prizes.map((p) => [p.id, p]));

  const drawnSet = new Set(
    bundle.draws
      .filter((draw) => draw.status !== "void" && Boolean(draw.is_effective))
      .map((draw) => String(draw.participant_id))
  );

  const auditEntries = bundle.draws.map((draw) => {
    const participant = participantMap.get(String(draw.participant_id));
    const prize = draw.prize_id ? prizeMap.get(String(draw.prize_id)) : null;
    const seed = toSeedTuple(draw.client_seed_json);

    return {
      id: String(draw.id),
      participantId: String(draw.participant_id),
      participantName: participant?.display_name ?? "Unknown",
      participantAvatar: participant ? deriveAvatar(participant) : "👤",
      prizeId: draw.prize_id ? String(draw.prize_id) : null,
      prizeName: prize?.label ?? "VOID",
      prizeAmount: prize?.amount_vnd ?? 0,
      time: formatTime(String(draw.created_at)),
      proofHash: shortProof(String(draw.proof_hash ?? "")),
      status: String(draw.status) as DrawStatus,
      verification: String(draw.verification_status ?? "pending") as "pending" | "pass" | "fail",
      seed,
      rowHash: String(draw.row_hash ?? ""),
      prevRowHash: String(draw.prev_row_hash ?? ""),
      isEffective: Boolean(draw.is_effective),
      voidReason: draw.void_reason ? String(draw.void_reason) : null,
    };
  });

  return {
    event: {
      id: bundle.event.id,
      slug: bundle.event.slug,
      name: bundle.event.name,
      state: bundle.event.state,
      phase: bundle.event.phase,
      commitmentHash: bundle.event.commitment_hash,
      seedRevealed: Boolean(bundle.event.seed_revealed_at),
      seedRevealedAt: bundle.event.seed_revealed_at,
      serverSeed:
        bundle.event.seed_revealed_at && bundle.event.server_seed_ciphertext
          ? decryptSeed(bundle.event.server_seed_ciphertext)
          : null,
    },
    participants: bundle.participants.map((participant) => ({
      id: participant.id,
      name: participant.display_name,
      avatar: deriveAvatar(participant),
      avatarImageUrl: participant.avatar_image_path,
      mode: participant.participation_mode,
      drawEnabled: participant.draw_enabled,
      drawn: drawnSet.has(participant.id),
    })),
    prizes: bundle.prizes.map((prize) => ({
      id: prize.id,
      label: prize.label,
      description: prize.description,
      amountVnd: prize.amount_vnd,
      totalStock: prize.total_stock,
      remainingStock: prize.remaining_stock,
      displayOrder: prize.display_order,
    })),
    remainingSlots: bundle.prizes.reduce((acc, prize) => acc + prize.remaining_stock, 0),
    auditEntries,
    chainIntegrity: computeChainIntegrity(bundle.draws),
    verifySummary: computeVerifySummary(bundle.draws),
  };
}

export async function startLock(slug: string, bossInput: string) {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);

  if (event.state !== "setup") {
    throw new AppError(409, "already_locked", "Event already locked");
  }

  const generated = generateServerSeed(bossInput);
  const encryptedSeed = encryptSeed(generated.serverSeed);

  const { error } = await supabase
    .from("events")
    .update({
      state: "fairness_locked",
      commitment_hash: generated.commitmentHash,
      server_seed_ciphertext: encryptedSeed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", event.id);

  if (error) {
    throw new AppError(500, "db_error", "Failed to lock event");
  }

  await supabase.from("event_admin_audit").insert({
    event_id: event.id,
    action: "start_lock",
    payload_json: {
      commitmentHash: generated.commitmentHash,
      serverTime: generated.serverTime,
      serverNonce: generated.serverNonce,
    },
  });

  return {
    commitmentHash: generated.commitmentHash,
    lockedAt: generated.serverTime,
  };
}

export async function setEventPhase(slug: string, phase: "office" | "remote") {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);

  const { error } = await supabase
    .from("events")
    .update({
      phase,
      updated_at: new Date().toISOString(),
    })
    .eq("id", event.id);

  if (error) {
    throw new AppError(500, "db_error", "Failed to update phase");
  }

  await supabase.from("event_admin_audit").insert({
    event_id: event.id,
    action: "set_phase",
    payload_json: { phase },
  });

  return { phase };
}

export async function performDraw(
  slug: string,
  payload: DrawRequest,
  options?: { includeHidden?: boolean }
): Promise<DrawResponse> {
  const includeHidden = options?.includeHidden ?? false;
  const startedAt = Date.now();
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);
  if (!includeHidden) {
    ensureEventPublic(event);
  }

  logDrawService("info", "perform_draw_begin", {
    slug,
    eventId: event.id,
    state: event.state,
    phase: event.phase,
    drawNonce: event.draw_nonce,
    participantId: payload.participantId,
    clientSeed: payload.clientSeed,
    hasEncryptedSeed: Boolean(event.server_seed_ciphertext),
  });

  if (!event.server_seed_ciphertext) {
    logDrawService("warn", "perform_draw_rejected_no_seed", {
      slug,
      eventId: event.id,
      participantId: payload.participantId,
    });
    throw new AppError(409, "state_not_locked", "Event is not locked");
  }

  const serverSeed = decryptSeed(event.server_seed_ciphertext);

  const { data, error } = await supabase.rpc("perform_draw", {
    p_event_slug: slug,
    p_participant_id: payload.participantId,
    p_client_seed: payload.clientSeed,
    p_server_seed: serverSeed,
  });

  if (error || !data || data.length === 0) {
    logDrawService("warn", "perform_draw_rpc_failed", {
      slug,
      eventId: event.id,
      participantId: payload.participantId,
      rpcError: error?.message ?? null,
      hasData: Boolean(data),
      rowCount: Array.isArray(data) ? data.length : 0,
      elapsedMs: Date.now() - startedAt,
    });
    throw mapRpcError(error?.message ?? "conflict_retry");
  }

  const row = data[0] as {
    draw_id: string;
    prize_id: string;
    prize_label: string;
    amount_vnd: number;
    proof_hash: string;
    status: "locked";
  };

  logDrawService("info", "perform_draw_success", {
    slug,
    eventId: event.id,
    participantId: payload.participantId,
    drawId: row.draw_id,
    prizeId: row.prize_id,
    status: row.status,
    proofHash: shortProof(row.proof_hash),
    elapsedMs: Date.now() - startedAt,
  });

  return {
    drawId: row.draw_id,
    prize: {
      id: row.prize_id,
      label: row.prize_label,
      amountVnd: row.amount_vnd,
    },
    proofHash: shortProof(row.proof_hash),
    status: row.status,
  };
}

export async function voidLatestDraw(slug: string, reason: string) {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);

  const { data, error } = await supabase.rpc("void_latest_draw", {
    p_event_slug: slug,
    p_reason: reason,
  });

  if (error || !data || data.length === 0) {
    throw mapRpcError(error?.message ?? "no_effective_draw_to_void");
  }

  const row = data[0] as {
    void_record_id: string;
    restored_prize_id: string;
  };

  await supabase.from("event_admin_audit").insert({
    event_id: event.id,
    action: "void_latest",
    payload_json: { reason, voidRecordId: row.void_record_id, restoredPrizeId: row.restored_prize_id },
  });

  return {
    voidRecordId: row.void_record_id,
    restoredPrizeId: row.restored_prize_id,
  };
}

async function persistVerificationResults(audit: AuditPackage, verify: VerifyAuditResponse) {
  const supabase = createServiceRoleClient();

  const updates = verify.draws.map((result) => {
    return supabase
      .from("draw_records")
      .update({
        verification_status: result.pass ? "pass" : "fail",
        verification_reason: result.reason,
        status: result.pass ? "verified" : "locked",
      })
      .eq("id", result.drawId)
      .neq("status", "void");
  });

  await Promise.all(updates);

  await supabase
    .from("events")
    .update({
      state: verify.summary.failed === 0 && verify.commitment.pass && verify.chain.pass ? "completed" : "revealed",
      updated_at: new Date().toISOString(),
    })
    .eq("slug", audit.event.slug);
}

export async function revealEvent(slug: string) {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);

  if (!event.server_seed_ciphertext || !event.commitment_hash) {
    throw new AppError(409, "state_not_locked", "Event is not locked");
  }

  const serverSeed = decryptSeed(event.server_seed_ciphertext);

  const { data, error } = await supabase.rpc("reveal_and_verify_event", {
    p_event_slug: slug,
    p_server_seed: serverSeed,
  });

  if (error || !data || data.length === 0) {
    throw mapRpcError(error?.message ?? "draws_incomplete");
  }

  const audit = await buildAuditPackage(slug, true, true);
  const verify = verifyAuditPackage(audit);
  await persistVerificationResults(audit, verify);

  await supabase.from("event_admin_audit").insert({
    event_id: event.id,
    action: "reveal",
    payload_json: {
      commitmentValid: verify.commitment.pass,
      summary: verify.summary,
    },
  });

  return {
    serverSeed,
    commitmentValid: verify.commitment.pass,
    verifySummary: verify.summary,
  };
}

export async function buildAuditPackage(
  slug: string,
  allowBeforeReveal = false,
  includeHidden = false
): Promise<AuditPackage> {
  const bundle = await getRawBundle(slug);
  if (!includeHidden) {
    ensureEventPublic(bundle.event);
  }

  if (!bundle.event.seed_revealed_at && !allowBeforeReveal) {
    throw new AppError(409, "seed_not_revealed", "Seed has not been revealed yet");
  }

  if (!bundle.event.server_seed_ciphertext || !bundle.event.commitment_hash) {
    throw new AppError(409, "state_not_locked", "Event does not have locked fairness state");
  }

  const serverSeed = decryptSeed(bundle.event.server_seed_ciphertext);

  const participantMap = new Map(bundle.participants.map((p) => [p.id, p]));
  const prizeMap = new Map(bundle.prizes.map((p) => [p.id, p]));

  const drawRecords = bundle.draws.map((draw) => {
    const participant = participantMap.get(String(draw.participant_id));
    const prize = draw.prize_id ? prizeMap.get(String(draw.prize_id)) : null;
    const seed = toSeedTuple(draw.client_seed_json);

    return {
      id: String(draw.id),
      participantId: String(draw.participant_id),
      participantName: participant?.display_name ?? "Unknown",
      participantAvatar: participant ? deriveAvatar(participant) : "👤",
      participantMode: participant?.participation_mode ?? "office",
      prizeId: draw.prize_id ? String(draw.prize_id) : null,
      prizeLabel: prize?.label ?? null,
      prizeAmountVnd: prize?.amount_vnd ?? 0,
      status: String(draw.status) as DrawStatus,
      verificationStatus: String(draw.verification_status ?? "pending") as "pending" | "pass" | "fail",
      verificationReason: draw.verification_reason ? String(draw.verification_reason) : null,
      ticket: String(draw.ticket),
      clientSeed: seed,
      drawNonce: Number(draw.draw_nonce),
      proofHash: String(draw.proof_hash),
      prevRowHash: String(draw.prev_row_hash),
      rowHash: String(draw.row_hash),
      isEffective: Boolean(draw.is_effective),
      voidOfDrawId: draw.void_of_draw_id ? String(draw.void_of_draw_id) : null,
      voidReason: draw.void_reason ? String(draw.void_reason) : null,
      hashCreatedAtText: draw.hash_created_at_text ? String(draw.hash_created_at_text) : null,
      createdAt: String(draw.created_at),
    };
  });

  const verify = verifyAuditPackage({
    schemaVersion: "1.1.0",
    event: {
      id: bundle.event.id,
      slug: bundle.event.slug,
      name: bundle.event.name,
      phase: bundle.event.phase,
      state: bundle.event.state,
      seedRevealedAt: bundle.event.seed_revealed_at,
    },
    commitmentHash: bundle.event.commitment_hash,
    serverSeed,
    prizeSnapshot: bundle.prizes.map((prize) => ({
      id: prize.id,
      label: prize.label,
      description: prize.description,
      amountVnd: prize.amount_vnd,
      totalStock: prize.total_stock,
      displayOrder: prize.display_order,
    })),
    drawRecords,
    chainSummary: computeChainIntegrity(bundle.draws),
    verifySummary: { total: 0, passed: 0, failed: 0 },
    exportedAt: new Date().toISOString(),
  });

  return {
    schemaVersion: "1.1.0",
    event: {
      id: bundle.event.id,
      slug: bundle.event.slug,
      name: bundle.event.name,
      phase: bundle.event.phase,
      state: bundle.event.state,
      seedRevealedAt: bundle.event.seed_revealed_at,
    },
    commitmentHash: bundle.event.commitment_hash,
    serverSeed,
    prizeSnapshot: bundle.prizes.map((prize) => ({
      id: prize.id,
      label: prize.label,
      description: prize.description,
      amountVnd: prize.amount_vnd,
      totalStock: prize.total_stock,
      displayOrder: prize.display_order,
    })),
    drawRecords,
    chainSummary: {
      intact: verify.chain.pass,
      chainLength: verify.chain.chainLength,
    },
    verifySummary: verify.summary,
    exportedAt: new Date().toISOString(),
  };
}

export async function verifyAuditPayload(payload: unknown): Promise<VerifyAuditResponse> {
  const data = validateAuditPayload(payload);
  return verifyAuditPackage(data);
}

export async function listEvents() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(500, "db_error", "Failed to list events");
  }

  return asArray(data);
}

export async function listPublicEvents() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, slug, name, state, phase, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(500, "db_error", "Failed to list public events");
  }

  return asArray(data);
}

export async function createEvent(input: { slug: string; name: string }) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      slug: input.slug,
      name: input.name,
      is_public: true,
      state: "setup",
      phase: "office",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new AppError(409, "event_slug_exists", "Event slug already exists");
    }
    throw new AppError(500, "db_error", error.message || "Failed to create event");
  }

  if (!data) {
    throw new AppError(500, "db_error", "Failed to create event");
  }

  return data;
}

export async function deleteEvent(slug: string) {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", event.id);

  if (error) {
    throw new AppError(500, "db_error", "Failed to delete event");
  }

  return { ok: true };
}

export async function setEventVisibility(slug: string, isPublic: boolean) {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);

  const { error } = await supabase
    .from("events")
    .update({
      is_public: isPublic,
      updated_at: new Date().toISOString(),
    })
    .eq("id", event.id);

  if (error) {
    throw new AppError(500, "db_error", "Failed to update event visibility");
  }

  await supabase.from("event_admin_audit").insert({
    event_id: event.id,
    action: "set_visibility",
    payload_json: { isPublic },
  });

  return { isPublic };
}

export async function listParticipants(slug: string) {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("event_id", event.id)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw new AppError(500, "db_error", "Failed to list participants");
  return asArray(data);
}

export async function importParticipantsFromEvent(
  targetSlug: string,
  input: { sourceSlug: string; skipExistingByName?: boolean }
) {
  const sourceSlug = input.sourceSlug.trim();
  if (!sourceSlug) {
    throw new AppError(400, "invalid_request", "sourceSlug is required");
  }
  if (sourceSlug === targetSlug) {
    throw new AppError(400, "invalid_request", "Cannot import participants from the same event");
  }

  const skipExistingByName = input.skipExistingByName ?? true;
  const supabase = createServiceRoleClient();

  const [targetEvent, sourceEvent] = await Promise.all([
    getEventBySlug(targetSlug),
    getEventBySlug(sourceSlug),
  ]);

  const [
    { data: sourceParticipants, error: sourceError },
    { data: targetParticipants, error: targetError },
  ] = await Promise.all([
    supabase
      .from("participants")
      .select("*")
      .eq("event_id", sourceEvent.id)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("participants")
      .select("display_name, sort_order")
      .eq("event_id", targetEvent.id),
  ]);

  if (sourceError || targetError) {
    throw new AppError(500, "db_error", "Failed to load participants for import");
  }

  const sourceRows = asArray(sourceParticipants) as ParticipantRecord[];
  const targetRows = asArray(targetParticipants) as Array<{
    display_name: string;
    sort_order: number;
  }>;

  const existingNames = new Set(
    targetRows.map((row) => row.display_name.trim().toLowerCase()).filter((name) => name.length > 0)
  );

  const maxSortOrder = targetRows.reduce((max, row) => Math.max(max, Number(row.sort_order) || 0), 0);
  const rowsToInsert: Array<Record<string, unknown>> = [];
  let skipped = 0;

  for (const source of sourceRows) {
    const normalizedName = source.display_name.trim().toLowerCase();
    if (skipExistingByName && normalizedName && existingNames.has(normalizedName)) {
      skipped += 1;
      continue;
    }

    existingNames.add(normalizedName);

    rowsToInsert.push({
      event_id: targetEvent.id,
      display_name: source.display_name,
      avatar_type: source.avatar_type,
      avatar_emoji: source.avatar_emoji,
      avatar_image_path: source.avatar_image_path,
      participation_mode: source.participation_mode,
      draw_enabled: source.draw_enabled,
      sort_order: maxSortOrder + rowsToInsert.length + 1,
    });
  }

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase.from("participants").insert(rowsToInsert);
    if (insertError) {
      throw new AppError(500, "db_error", "Failed to import participants");
    }
  }

  await supabase.from("event_admin_audit").insert({
    event_id: targetEvent.id,
    action: "import_participants",
    payload_json: {
      sourceSlug,
      sourceEventId: sourceEvent.id,
      imported: rowsToInsert.length,
      skipped,
      skipExistingByName,
    },
  });

  return {
    imported: rowsToInsert.length,
    skipped,
    sourceSlug,
    targetSlug,
  };
}

export async function createParticipant(
  slug: string,
  input: {
    displayName: string;
    avatarType: "emoji" | "image";
    avatarEmoji?: string;
    avatarImagePath?: string;
    participationMode: "office" | "remote";
    drawEnabled?: boolean;
    sortOrder?: number;
  }
) {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);

  const { data, error } = await supabase
    .from("participants")
    .insert({
      event_id: event.id,
      display_name: input.displayName,
      avatar_type: input.avatarType,
      avatar_emoji: input.avatarEmoji ?? null,
      avatar_image_path: input.avatarImagePath ?? null,
      participation_mode: input.participationMode,
      draw_enabled: input.drawEnabled ?? true,
      sort_order: input.sortOrder ?? 0,
    })
    .select("*")
    .single();

  if (error || !data) throw new AppError(500, "db_error", "Failed to create participant");
  return data;
}

export async function updateParticipant(
  slug: string,
  participantId: string,
  input: Partial<{
    displayName: string;
    avatarType: "emoji" | "image";
    avatarEmoji: string | null;
    avatarImagePath: string | null;
    participationMode: "office" | "remote";
    drawEnabled: boolean;
    sortOrder: number;
  }>
) {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);

  const patch: Record<string, unknown> = {};
  if (input.displayName !== undefined) patch.display_name = input.displayName;
  if (input.avatarType !== undefined) patch.avatar_type = input.avatarType;
  if (input.avatarEmoji !== undefined) patch.avatar_emoji = input.avatarEmoji;
  if (input.avatarImagePath !== undefined) patch.avatar_image_path = input.avatarImagePath;
  if (input.participationMode !== undefined) patch.participation_mode = input.participationMode;
  if (input.drawEnabled !== undefined) patch.draw_enabled = input.drawEnabled;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from("participants")
    .update(patch)
    .eq("event_id", event.id)
    .eq("id", participantId)
    .select("*")
    .single();

  if (error || !data) throw new AppError(500, "db_error", "Failed to update participant");
  return data;
}

export async function deleteParticipant(slug: string, participantId: string) {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);
  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("event_id", event.id)
    .eq("id", participantId);

  if (error) throw new AppError(500, "db_error", "Failed to delete participant");
  return { ok: true };
}

export async function listPrizes(slug: string) {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);
  const { data, error } = await supabase
    .from("prizes")
    .select("*")
    .eq("event_id", event.id)
    .order("display_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw new AppError(500, "db_error", "Failed to list prizes");
  return asArray(data);
}

export async function createPrize(
  slug: string,
  input: { label: string; description?: string; amountVnd: number; totalStock: number; displayOrder: number }
) {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);
  const { data, error } = await supabase
    .from("prizes")
    .insert({
      event_id: event.id,
      label: input.label,
      description: input.description?.trim() ? input.description.trim() : null,
      amount_vnd: input.amountVnd,
      total_stock: input.totalStock,
      remaining_stock: input.totalStock,
      display_order: input.displayOrder,
    })
    .select("*")
    .single();

  if (error || !data) throw new AppError(500, "db_error", "Failed to create prize");
  return data;
}

export async function importPrizesFromEvent(
  targetSlug: string,
  input: { sourceSlug: string; skipExistingByLabel?: boolean }
) {
  const sourceSlug = input.sourceSlug.trim();
  if (!sourceSlug) {
    throw new AppError(400, "invalid_request", "sourceSlug is required");
  }
  if (sourceSlug === targetSlug) {
    throw new AppError(400, "invalid_request", "Cannot import prizes from the same event");
  }

  const skipExistingByLabel = input.skipExistingByLabel ?? true;
  const supabase = createServiceRoleClient();

  const [targetEvent, sourceEvent] = await Promise.all([
    getEventBySlug(targetSlug),
    getEventBySlug(sourceSlug),
  ]);

  const [
    { data: sourcePrizes, error: sourceError },
    { data: targetPrizes, error: targetError },
  ] = await Promise.all([
    supabase
      .from("prizes")
      .select("*")
      .eq("event_id", sourceEvent.id)
      .order("display_order", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("prizes")
      .select("label, display_order")
      .eq("event_id", targetEvent.id),
  ]);

  if (sourceError || targetError) {
    throw new AppError(500, "db_error", "Failed to load prizes for import");
  }

  const sourceRows = asArray(sourcePrizes) as PrizeRecord[];
  const targetRows = asArray(targetPrizes) as Array<{
    label: string;
    display_order: number;
  }>;

  const existingLabels = new Set(
    targetRows.map((row) => row.label.trim().toLowerCase()).filter((label) => label.length > 0)
  );
  const maxDisplayOrder = targetRows.reduce(
    (max, row) => Math.max(max, Number(row.display_order) || 0),
    0
  );

  const rowsToInsert: Array<Record<string, unknown>> = [];
  let skipped = 0;

  for (const source of sourceRows) {
    const normalizedLabel = source.label.trim().toLowerCase();
    if (skipExistingByLabel && normalizedLabel && existingLabels.has(normalizedLabel)) {
      skipped += 1;
      continue;
    }

    existingLabels.add(normalizedLabel);
    rowsToInsert.push({
      event_id: targetEvent.id,
      label: source.label,
      description: source.description,
      amount_vnd: source.amount_vnd,
      total_stock: source.total_stock,
      remaining_stock: source.total_stock,
      display_order: maxDisplayOrder + rowsToInsert.length + 1,
    });
  }

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase.from("prizes").insert(rowsToInsert);
    if (insertError) {
      throw new AppError(500, "db_error", "Failed to import prizes");
    }
  }

  await supabase.from("event_admin_audit").insert({
    event_id: targetEvent.id,
    action: "import_prizes",
    payload_json: {
      sourceSlug,
      sourceEventId: sourceEvent.id,
      imported: rowsToInsert.length,
      skipped,
      skipExistingByLabel,
    },
  });

  return {
    imported: rowsToInsert.length,
    skipped,
    sourceSlug,
    targetSlug,
  };
}

export async function updatePrize(
  slug: string,
  prizeId: string,
  input: Partial<{
    label: string;
    description: string | null;
    amountVnd: number;
    totalStock: number;
    remainingStock: number;
    displayOrder: number;
  }>
) {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);

  const patch: Record<string, unknown> = {};
  if (input.label !== undefined) patch.label = input.label;
  if (input.description !== undefined) patch.description = input.description;
  if (input.amountVnd !== undefined) patch.amount_vnd = input.amountVnd;
  if (input.totalStock !== undefined) patch.total_stock = input.totalStock;
  if (input.remainingStock !== undefined) patch.remaining_stock = input.remainingStock;
  if (input.displayOrder !== undefined) patch.display_order = input.displayOrder;

  const { data, error } = await supabase
    .from("prizes")
    .update(patch)
    .eq("event_id", event.id)
    .eq("id", prizeId)
    .select("*")
    .single();

  if (error || !data) throw new AppError(500, "db_error", "Failed to update prize");
  return data;
}

export async function deletePrize(slug: string, prizeId: string) {
  const supabase = createServiceRoleClient();
  const event = await getEventBySlug(slug);
  const { error } = await supabase
    .from("prizes")
    .delete()
    .eq("event_id", event.id)
    .eq("id", prizeId);

  if (error) throw new AppError(500, "db_error", "Failed to delete prize");
  return { ok: true };
}
