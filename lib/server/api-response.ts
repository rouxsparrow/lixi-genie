import { NextResponse } from "next/server";
import { AppError } from "./event-service";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(extra ?? {}),
      },
    },
    { status }
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return fail(error.status, error.code, error.message);
  }

  if (error instanceof Error) {
    if (error.message === "unauthorized") {
      return fail(401, "unauthorized", "Admin authentication required");
    }
    return fail(500, "internal_error", error.message);
  }

  return fail(500, "internal_error", "Unexpected error");
}
