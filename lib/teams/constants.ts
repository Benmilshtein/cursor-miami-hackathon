export const TEAM_LIMITS = {
  maxMembers: 5,
  nameMinLength: 2,
  nameMaxLength: 64,
  descriptionMaxLength: 500,
  inviteCodeLength: 8,
  inviteCodeGenerationAttempts: 10,
  adminListDefaultLimit: 20,
  adminListMaxLimit: 100,
  adminTwoFactorMaxAgeSeconds: 15 * 60,
} as const;

export const TEAM_INVITE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Target size for auto-matched teams. */
export const MATCH_TEAM_SIZE = 4;

/** Fun team names assigned to auto-formed teams (mirrors the reference SPA). */
export const TEAM_NAME_POOL = [
  "Runtime Terror", "Null Pointers", "Stack Overflow", "Byte Me", "Git Pushers",
  "The Recursion", "Syntax Error", "Big O", "Binary Bandits", "Code Blooded",
  "Cache Me Outside", "Data Driven", "Exception Handlers", "Infinite Loop",
  "Pixel Perfect", "Segfault Syndicate", "Bit Shifters", "Kernel Panic",
  "Race Condition", "Deadlock Dynasty", "Hash Slingers", "Tree Traversers",
  "Brute Force", "Greedy Algorithm", "Dynamic Programmers", "Neural Network",
  "Gradient Descent", "Overfit Oracles", "Backprop Bandits", "Epoch Warriors",
  "Tensor Titans", "Vector Vipers", "Quantum Coders", "Agile Alchemists",
  "Refactor Rangers", "Lambda Legends", "Tuple Titans", "Async Avengers",
  "Mutex Masters", "Ping Pong Proxy",
] as const;

export type AppUserRole =
  | "participant"
  | "moderator"
  | "reviewer"
  | "super_admin"
  | "judge"
  | "mentor";
export type TeamMembershipRole = "lead" | "member";
export type AdminMembershipAction = "assign-member" | "remove-member" | "transfer-lead";
