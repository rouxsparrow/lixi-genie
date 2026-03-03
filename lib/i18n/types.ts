import { Locale } from "@/lib/types/contracts";

export type MessageKey =
  | "event.title"
  | "event.join"
  | "event.verify"
  | "event.admin"
  | "event.drawNow"
  | "event.drawing"
  | "event.lockSeed"
  | "event.seedLocked"
  | "event.roll"
  | "event.rolling"
  | "status.setup"
  | "status.locked"
  | "status.drawing"
  | "status.revealed"
  | "status.void"
  | "status.verified"
  | "verify.title"
  | "verify.upload"
  | "verify.run"
  | "admin.title"
  | "admin.login"
  | "admin.passcode"
  | "admin.logout";

export type Dictionary = Record<MessageKey, string>;

export type Translate = (key: MessageKey) => string;

export const defaultLocale: Locale = "en";
