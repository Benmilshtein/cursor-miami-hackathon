import { AppError } from "@/lib/api/http";
import {
  TEAM_LIMITS,
  type AdminMembershipAction,
} from "@/lib/teams/constants";

type UnknownRecord = Record<string, unknown>;

export type CreateTeamInput = {
  name: string;
  description: string | null;
  inviteExpiresAt: Date | null;
  inviteMaxUses: number | null;
};

export type JoinTeamInput = {
  code: string;
};

export type UpdateTeamInput = {
  name?: string;
  description?: string | null;
  regenerateInvite: boolean;
  inviteExpiresAt?: Date | null;
  inviteMaxUses?: number | null;
};

export type TransferLeadInput = {
  newLeadUserId: string;
};

export type RemoveMemberInput = {
  memberUserId: string;
};

export type AdminForceMembershipInput =
  | {
      action: "assign-member";
      userId: string;
      makeLead: boolean;
      removeFromCurrentTeam: boolean;
    }
  | {
      action: "remove-member";
      userId: string;
      nextLeadUserId?: string;
    }
  | {
      action: "transfer-lead";
      newLeadUserId: string;
    };

function ensureObject(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError(400, "INVALID_INPUT", "Request payload must be an object.");
  }

  return input as UnknownRecord;
}

function parseRequiredString(
  input: UnknownRecord,
  field: string,
  { minLength = 1, maxLength }: { minLength?: number; maxLength?: number } = {},
) {
  const value = input[field];

  if (typeof value !== "string") {
    throw new AppError(400, "INVALID_INPUT", `${field} must be a string.`);
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length < minLength) {
    throw new AppError(400, "INVALID_INPUT", `${field} is too short.`);
  }

  if (maxLength && normalizedValue.length > maxLength) {
    throw new AppError(400, "INVALID_INPUT", `${field} is too long.`);
  }

  return normalizedValue;
}

function parseOptionalString(
  input: UnknownRecord,
  field: string,
  { maxLength, allowNull = false }: { maxLength?: number; allowNull?: boolean } = {},
) {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    if (allowNull) {
      return null;
    }

    throw new AppError(400, "INVALID_INPUT", `${field} cannot be null.`);
  }

  if (typeof value !== "string") {
    throw new AppError(400, "INVALID_INPUT", `${field} must be a string.`);
  }

  const normalizedValue = value.trim();

  if (maxLength && normalizedValue.length > maxLength) {
    throw new AppError(400, "INVALID_INPUT", `${field} is too long.`);
  }

  return normalizedValue;
}

function parseOptionalBoolean(input: UnknownRecord, field: string) {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new AppError(400, "INVALID_INPUT", `${field} must be a boolean.`);
  }

  return value;
}

function parseOptionalPositiveInteger(
  input: UnknownRecord,
  field: string,
  maxValue = TEAM_LIMITS.maxMembers,
): number | null | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > maxValue) {
    throw new AppError(
      400,
      "INVALID_INPUT",
      `${field} must be an integer between 1 and ${maxValue}.`,
    );
  }

  return value;
}

function parseOptionalDate(input: UnknownRecord, field: string) {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(400, "INVALID_INPUT", `${field} must be an ISO date string.`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, "INVALID_INPUT", `${field} must be a valid date string.`);
  }

  return date;
}

function parseAction(value: unknown): AdminMembershipAction {
  if (value !== "assign-member" && value !== "remove-member" && value !== "transfer-lead") {
    throw new AppError(400, "INVALID_INPUT", "action is invalid.");
  }

  return value;
}

export function parseCreateTeamInput(input: unknown): CreateTeamInput {
  const data = ensureObject(input);

  return {
    name: parseRequiredString(data, "name", {
      minLength: TEAM_LIMITS.nameMinLength,
      maxLength: TEAM_LIMITS.nameMaxLength,
    }),
    description:
      parseOptionalString(data, "description", {
        maxLength: TEAM_LIMITS.descriptionMaxLength,
        allowNull: true,
      }) ?? null,
    inviteExpiresAt: parseOptionalDate(data, "inviteExpiresAt") ?? null,
    inviteMaxUses: parseOptionalPositiveInteger(data, "inviteMaxUses") ?? null,
  };
}

export function parseJoinTeamInput(input: unknown): JoinTeamInput {
  const data = ensureObject(input);

  return {
    code: parseRequiredString(data, "code", { minLength: 4, maxLength: 64 }).toUpperCase(),
  };
}

export function parseUpdateTeamInput(input: unknown): UpdateTeamInput {
  const data = ensureObject(input);

  const regenerateInvite = parseOptionalBoolean(data, "regenerateInvite") ?? false;
  const inviteExpiresAt = parseOptionalDate(data, "inviteExpiresAt");
  const inviteMaxUses = parseOptionalPositiveInteger(data, "inviteMaxUses");

  if ((inviteExpiresAt !== undefined || inviteMaxUses !== undefined) && !regenerateInvite) {
    throw new AppError(
      400,
      "INVALID_INPUT",
      "inviteExpiresAt and inviteMaxUses require regenerateInvite=true.",
    );
  }

  return {
    name:
      parseOptionalString(data, "name", { maxLength: TEAM_LIMITS.nameMaxLength }) ?? undefined,
    description: parseOptionalString(data, "description", {
      maxLength: TEAM_LIMITS.descriptionMaxLength,
      allowNull: true,
    }),
    regenerateInvite,
    inviteExpiresAt,
    inviteMaxUses,
  };
}

export function parseTransferLeadInput(input: unknown): TransferLeadInput {
  const data = ensureObject(input);

  return {
    newLeadUserId: parseRequiredString(data, "newLeadUserId"),
  };
}

export function parseRemoveMemberInput(input: unknown): RemoveMemberInput {
  const data = ensureObject(input);

  return {
    memberUserId: parseRequiredString(data, "memberUserId"),
  };
}

export function parseAdminForceMembershipInput(input: unknown): AdminForceMembershipInput {
  const data = ensureObject(input);
  const action = parseAction(data.action);

  if (action === "assign-member") {
    return {
      action,
      userId: parseRequiredString(data, "userId"),
      makeLead: parseOptionalBoolean(data, "makeLead") ?? false,
      removeFromCurrentTeam: parseOptionalBoolean(data, "removeFromCurrentTeam") ?? true,
    };
  }

  if (action === "remove-member") {
    return {
      action,
      userId: parseRequiredString(data, "userId"),
      nextLeadUserId: parseOptionalString(data, "nextLeadUserId") ?? undefined,
    };
  }

  return {
    action,
    newLeadUserId: parseRequiredString(data, "newLeadUserId"),
  };
}
