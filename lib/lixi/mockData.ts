// Mock data for UI development - No backend logic

export interface Player {
  id: string;
  name: string;
  avatar: string;
}

export interface Prize {
  id: string;
  name: string;
  amount: number;
  stock: number;
  order: number;
}

export type VerificationStatus = "pending" | "pass" | "fail";

export interface AuditEntry {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  prizeId: string;
  prizeName: string;
  prizeAmount: number;
  time: string;
  proofHash: string;
  status: "locked" | "verified" | "void";
  verification?: VerificationStatus;
  seed?: string[];
}

// 14 Mock Players
export const mockPlayers: Player[] = [
  { id: "p1", name: "Hải An", avatar: "🐉" },
  { id: "p2", name: "Minh Quân", avatar: "🐯" },
  { id: "p3", name: "Thanh Mai", avatar: "🌸" },
  { id: "p4", name: "Lan Phương", avatar: "🦋" },
  { id: "p5", name: "Bình Minh", avatar: "☀️" },
  { id: "p6", name: "Ngọc Hân", avatar: "💎" },
  { id: "p7", name: "Đức Huy", avatar: "🦁" },
  { id: "p8", name: "Khải Nguyên", avatar: "🌟" },
  { id: "p9", name: "Thu Hà", avatar: "🌙" },
  { id: "p10", name: "Hoàng Nam", avatar: "🔥" },
  { id: "p11", name: "Mỹ Linh", avatar: "🌺" },
  { id: "p12", name: "Quang Huy", avatar: "⚡" },
  { id: "p13", name: "Phương Anh", avatar: "🎀" },
  { id: "p14", name: "Văn Tùng", avatar: "🎯" },
];

// Mock Prize Pool
export const mockPrizes: Prize[] = [
  { id: "pr1", name: "Special Red Packet", amount: 1000000, stock: 1, order: 1 },
  { id: "pr2", name: "Big Red Packet", amount: 500000, stock: 2, order: 2 },
  { id: "pr3", name: "Lucky Red Packet", amount: 200000, stock: 3, order: 3 },
  { id: "pr4", name: "Prosperity Red Packet", amount: 100000, stock: 5, order: 4 },
  { id: "pr5", name: "Mini Red Packet", amount: 50000, stock: 10, order: 5 },
];

// Calculate total prize slots
export const getTotalPrizeSlots = () =>
  mockPrizes.reduce((acc, p) => acc + p.stock, 0);

// Mock Commitment Hash (SHA256 of serverSeed)
export const mockCommitmentHash =
  "0x8f7d3c2a1b5e9f4d6c8a0b2e4f6d8c0a2e4f6d8c0a2e4f6d8c0a2e4f6d8c0a";

// Mock Server Seed (revealed after event)
export const mockServerSeed =
  "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a";

// Mock Audit Log Entries
export const mockAuditEntries: AuditEntry[] = [
  {
    id: "a1",
    playerId: "p5",
    playerName: "Bình Minh",
    playerAvatar: "☀️",
    prizeId: "pr1",
    prizeName: "Special Red Packet",
    prizeAmount: 1000000,
    time: "10:23",
    proofHash: "0x7a3b...9f2e",
    status: "verified",
    verification: "pass",
    seed: ["🎉", "✨", "🧧"],
  },
  {
    id: "a2",
    playerId: "p2",
    playerName: "Minh Quân",
    playerAvatar: "🐯",
    prizeId: "pr2",
    prizeName: "Big Red Packet",
    prizeAmount: 500000,
    time: "10:15",
    proofHash: "0x4c8d...2a1b",
    status: "verified",
    verification: "pass",
    seed: ["🎯", "🎊", "🎁"],
  },
  {
    id: "a3",
    playerId: "p3",
    playerName: "Thanh Mai",
    playerAvatar: "🌸",
    prizeId: "pr3",
    prizeName: "Lucky Red Packet",
    prizeAmount: 200000,
    time: "10:08",
    proofHash: "0x9e5f...7c3d",
    status: "verified",
    verification: "pass",
    seed: ["🌟", "🎀", "🎉"],
  },
  {
    id: "a4",
    playerId: "p4",
    playerName: "Lan Phương",
    playerAvatar: "🦋",
    prizeId: "pr2",
    prizeName: "Big Red Packet",
    prizeAmount: 500000,
    time: "09:52",
    proofHash: "0x2b6a...8e4f",
    status: "verified",
    verification: "pass",
    seed: ["💎", "✨", "🎊"],
  },
  {
    id: "a5",
    playerId: "p7",
    playerName: "Đức Huy",
    playerAvatar: "🦁",
    prizeId: "pr4",
    prizeName: "Prosperity Red Packet",
    prizeAmount: 100000,
    time: "09:45",
    proofHash: "0x5d8e...1c6a",
    status: "void",
    verification: "pending",
    seed: ["🚫", "⛔", "❌"],
  },
];

// Emoji pool for slot machine
export const emojiPool = [
  "🧧",
  "🎉",
  "✨",
  "🎊",
  "🎁",
  "🎯",
  "🌟",
  "💎",
  "🔥",
  "⚡",
  "🎀",
  "🌸",
  "🍀",
  "🎲",
];

// Generate random seed
export const generateRandomSeed = (): string[] => {
  return Array.from(
    { length: 3 },
    () => emojiPool[Math.floor(Math.random() * emojiPool.length)]
  );
};
