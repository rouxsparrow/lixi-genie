export type EventState =
  | "setup"
  | "fairness_locked"
  | "drawing"
  | "revealed"
  | "completed";

export type EventPhase = "office" | "remote";

export type DrawStatus = "locked" | "verified" | "void";

export type VerificationStatus = "pending" | "pass" | "fail";

export type Locale = "vi" | "en";

export interface EventRecord {
  id: string;
  slug: string;
  name: string;
  is_public: boolean;
  state: EventState;
  phase: EventPhase;
  commitment_hash: string | null;
  server_seed_ciphertext: string | null;
  seed_revealed_at: string | null;
  draw_nonce: number;
  created_at: string;
  updated_at: string;
}

export interface ParticipantRecord {
  id: string;
  event_id: string;
  display_name: string;
  avatar_type: "emoji" | "image";
  avatar_emoji: string | null;
  avatar_image_path: string | null;
  participation_mode: EventPhase;
  draw_enabled: boolean;
  sort_order: number;
  created_at: string;
}

export interface PrizeRecord {
  id: string;
  event_id: string;
  label: string;
  description: string | null;
  amount_vnd: number;
  total_stock: number;
  remaining_stock: number;
  display_order: number;
  created_at: string;
}

export interface DrawRecord {
  id: string;
  event_id: string;
  participant_id: string;
  prize_id: string | null;
  status: DrawStatus;
  ticket: string;
  client_seed_json: string[];
  draw_nonce: number;
  proof_hash: string;
  prev_row_hash: string;
  row_hash: string;
  is_effective: boolean;
  verification_status: VerificationStatus;
  verification_reason: string | null;
  void_of_draw_id: string | null;
  void_reason: string | null;
  hash_created_at_text: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  prizeId: string | null;
  prizeName: string;
  prizeAmount: number;
  time: string;
  proofHash: string;
  status: DrawStatus;
  verification: VerificationStatus;
  seed: string[];
  rowHash: string;
  prevRowHash: string;
  isEffective: boolean;
  voidReason: string | null;
}

export interface EventStateResponse {
  event: {
    id: string;
    slug: string;
    name: string;
    state: EventState;
    phase: EventPhase;
    commitmentHash: string | null;
    seedRevealed: boolean;
    seedRevealedAt: string | null;
    serverSeed: string | null;
  };
  participants: Array<{
    id: string;
    name: string;
    avatar: string;
    avatarImageUrl: string | null;
    mode: EventPhase;
    drawEnabled: boolean;
    drawn: boolean;
  }>;
  prizes: Array<{
    id: string;
    label: string;
    description: string | null;
    amountVnd: number;
    totalStock: number;
    remainingStock: number;
    displayOrder: number;
  }>;
  remainingSlots: number;
  auditEntries: AuditLogEntry[];
  chainIntegrity: {
    intact: boolean;
    chainLength: number;
  };
  verifySummary: {
    total: number;
    passed: number;
    failed: number;
  } | null;
}

export interface DrawRequest {
  participantId: string;
  clientSeed: [string, string, string];
}

export interface DrawResponse {
  drawId: string;
  prize: {
    id: string;
    label: string;
    amountVnd: number;
  };
  proofHash: string;
  status: "locked";
}

export interface VerifySummary {
  total: number;
  passed: number;
  failed: number;
}

export interface AuditPackage {
  schemaVersion: string;
  event: {
    id: string;
    slug: string;
    name: string;
    phase: EventPhase;
    state: EventState;
    seedRevealedAt: string | null;
  };
  commitmentHash: string;
  serverSeed: string;
  prizeSnapshot: Array<{
    id: string;
    label: string;
    description: string | null;
    amountVnd: number;
    totalStock: number;
    displayOrder: number;
  }>;
  drawRecords: Array<{
    id: string;
    participantId: string;
    participantName: string;
    participantAvatar: string;
    participantMode: EventPhase;
    prizeId: string | null;
    prizeLabel: string | null;
    prizeAmountVnd: number;
    status: DrawStatus;
    verificationStatus: VerificationStatus;
    verificationReason: string | null;
    ticket: string;
    clientSeed: [string, string, string];
    drawNonce: number;
    proofHash: string;
    prevRowHash: string;
    rowHash: string;
    isEffective: boolean;
    voidOfDrawId: string | null;
    voidReason: string | null;
    hashCreatedAtText?: string | null;
    createdAt: string;
  }>;
  chainSummary: {
    intact: boolean;
    chainLength: number;
  };
  verifySummary: VerifySummary;
  exportedAt: string;
}

export interface VerifyAuditResponse {
  commitment: {
    pass: boolean;
    expected: string;
    actual: string;
  };
  chain: {
    pass: boolean;
    chainLength: number;
    failures: string[];
  };
  draws: Array<{
    drawId: string;
    pass: boolean;
    reason: string;
  }>;
  summary: VerifySummary;
}
