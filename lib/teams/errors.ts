import { AppError } from "@/lib/api/http";

export function createTeamError(status: number, code: string, message: string, details?: unknown) {
  return new AppError(status, code, message, details);
}
