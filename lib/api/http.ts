import { NextResponse } from "next/server";

export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export async function parseJsonBody<T extends Record<string, unknown>>(
  request: Request,
): Promise<T> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return {} as T;
  }

  try {
    const body = await request.json();

    if (body === null) {
      return {} as T;
    }

    if (typeof body !== "object" || Array.isArray(body)) {
      throw new AppError(400, "INVALID_JSON_BODY", "Request body must be a JSON object.");
    }

    return body as T;
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw new AppError(400, "INVALID_JSON_BODY", "Request body must be valid JSON.");
  }
}

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status },
  );
}

function mapDatabaseError(error: { code?: string; constraint_name?: string; message?: string }) {
  if (error.code === "23505") {
    return new AppError(
      409,
      "STATE_CONFLICT",
      "The request conflicted with the current team state. Refresh and retry.",
      error,
    );
  }

  if (error.code === "23514") {
    return new AppError(
      409,
      "CONSTRAINT_VIOLATION",
      "A database constraint blocked this operation.",
      error,
    );
  }

  return null;
}

export function toErrorResponse(error: unknown) {
  if (isAppError(error)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  if (
    error &&
    typeof error === "object" &&
    ("code" in error || "constraint_name" in error || "message" in error)
  ) {
    const mapped = mapDatabaseError(
      error as { code?: string; constraint_name?: string; message?: string },
    );

    if (mapped) {
      return toErrorResponse(mapped);
    }
  }

  console.error(error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error.",
      },
    },
    { status: 500 },
  );
}
