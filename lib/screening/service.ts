import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { team } from "@/db/schema/auth";
import { teamMember } from "@/db/schema/teams";
import { screeningQuestion, screeningAnswer } from "@/db/schema/screening";
import { AppError } from "@/lib/api/http";
import type { AppSessionUser } from "@/lib/auth/session";
import { isGoogleDriveUrl, isYouTubeUrl, normalizeExternalVideoUrl } from "@/lib/video-links";
import { SCREENING } from "./constants";

export async function listQuestionsForParticipant() {
  return db
    .select({
      id: screeningQuestion.id,
      title: screeningQuestion.title,
      description: screeningQuestion.description,
      options: screeningQuestion.options,
      sortOrder: screeningQuestion.sortOrder,
    })
    .from(screeningQuestion)
    .orderBy(screeningQuestion.sortOrder, screeningQuestion.id);
}

export async function getQuestionById(questionId: number) {
  const [q] = await db
    .select()
    .from(screeningQuestion)
    .where(eq(screeningQuestion.id, questionId))
    .limit(1);
  return q ?? null;
}

export async function resolveActiveTeamIdForUser(userId: string): Promise<number | null> {
  const [membership] = await db
    .select({ teamId: teamMember.teamId })
    .from(teamMember)
    .where(and(eq(teamMember.userId, userId), isNull(teamMember.leftAt)))
    .limit(1);

  return membership?.teamId ?? null;
}

export async function resolveActiveMembershipForUser(userId: string): Promise<{
  teamId: number;
  role: "lead" | "member";
} | null> {
  const [membership] = await db
    .select({ teamId: teamMember.teamId, role: teamMember.role })
    .from(teamMember)
    .where(and(eq(teamMember.userId, userId), isNull(teamMember.leftAt)))
    .limit(1);

  if (!membership) {
    return null;
  }

  return {
    teamId: membership.teamId,
    role: membership.role,
  };
}

export async function upsertAnswer(
  userId: string,
  questionId: number,
  selectedIndex: number
): Promise<{ isCorrect: boolean }> {
  const question = await getQuestionById(questionId);
  if (!question) throw new Error("Question not found");
  const options = question.options as string[];
  if (selectedIndex < 0 || selectedIndex >= options.length) {
    throw new Error("Invalid selected index");
  }
  const isCorrect = selectedIndex === question.correctIndex;
  await db
    .insert(screeningAnswer)
    .values({
      userId,
      questionId,
      selectedIndex,
      isCorrect,
    })
    .onConflictDoUpdate({
      target: [screeningAnswer.userId, screeningAnswer.questionId],
      set: {
        selectedIndex,
        isCorrect,
        updatedAt: new Date(),
      },
    });
  return { isCorrect };
}

export async function getMyAnswers(userId: string) {
  return db
    .select({
      questionId: screeningAnswer.questionId,
      selectedIndex: screeningAnswer.selectedIndex,
      isCorrect: screeningAnswer.isCorrect,
      createdAt: screeningAnswer.createdAt,
    })
    .from(screeningAnswer)
    .where(eq(screeningAnswer.userId, userId));
}

export async function getTeamMembersWithAnswers(teamId: number) {
  const members = await db
    .select({
      userId: teamMember.userId,
    })
    .from(teamMember)
    .where(and(eq(teamMember.teamId, teamId), isNull(teamMember.leftAt)));
  const userIds = members.map((m) => m.userId);
  if (userIds.length === 0) return { members: [], answerCountByUser: new Map<string, number>() };
  const questionIds = await db
    .select({ id: screeningQuestion.id })
    .from(screeningQuestion);
  const requiredCount = questionIds.length;
  const answers = await db
    .select({
      userId: screeningAnswer.userId,
      questionId: screeningAnswer.questionId,
    })
    .from(screeningAnswer)
    .where(inArray(screeningAnswer.userId, userIds));
  const countByUser = new Map<string, number>();
  for (const uid of userIds) countByUser.set(uid, 0);
  for (const a of answers) {
    countByUser.set(a.userId, (countByUser.get(a.userId) ?? 0) + 1);
  }
  return {
    members: members.map((m) => ({ userId: m.userId })),
    answerCountByUser: countByUser,
    requiredAnswerCount: requiredCount,
  };
}

export async function getTeamScreeningStatus(teamId: number) {
  const [t] = await db
    .select({
      screeningStatus: team.screeningStatus,
      screeningVideoUrl: team.screeningVideoUrl,
      screeningVideoStoragePath: team.screeningVideoStoragePath,
      screeningSubmittedAt: team.screeningSubmittedAt,
      screeningRejectedAt: team.screeningRejectedAt,
      screeningRejectedReason: team.screeningRejectedReason,
    })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);
  return t ?? null;
}

export async function canTeamSubmit(teamId: number): Promise<{
  canSubmit: boolean;
  hasVideo: boolean;
  allMembersCompletedLogic: boolean;
  memberCount: number;
  requiredAnswerCount: number;
}> {
  const status = await getTeamScreeningStatus(teamId);
  const canSubmitStatus = status?.screeningStatus === "draft" || status?.screeningStatus === "rejected";
  if (!status || !canSubmitStatus) {
    return {
      canSubmit: false,
      hasVideo: false,
      allMembersCompletedLogic: false,
      memberCount: 0,
      requiredAnswerCount: SCREENING.requiredQuestionCount,
    };
  }
  const hasVideo = !!(status.screeningVideoUrl ?? status.screeningVideoStoragePath);
  const { members, answerCountByUser, requiredAnswerCount } =
    await getTeamMembersWithAnswers(teamId);
  const effectiveRequired = requiredAnswerCount ?? SCREENING.requiredQuestionCount;
  const memberCount = members.length;
  let allMembersCompletedLogic = memberCount > 0;
  for (const m of members) {
    if ((answerCountByUser.get(m.userId) ?? 0) < effectiveRequired) {
      allMembersCompletedLogic = false;
      break;
    }
  }
  const canSubmit =
    canSubmitStatus &&
    hasVideo &&
    allMembersCompletedLogic &&
    memberCount > 0;
  return {
    canSubmit: !!canSubmit,
    hasVideo,
    allMembersCompletedLogic,
    memberCount,
    requiredAnswerCount: effectiveRequired,
  };
}

export async function setTeamVideo(
  actor: AppSessionUser,
  teamId: number,
  payload: { videoUrl?: string | null }
) {
  const [membership] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(
      and(
        eq(teamMember.userId, actor.id),
        eq(teamMember.teamId, teamId),
        isNull(teamMember.leftAt),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new Error("You can only set video for your active team.");
  }
  const [t] = await db
    .select()
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);
  if (!t) throw new Error("Team not found");
  if (t.screeningStatus !== "draft" && t.screeningStatus !== "rejected") {
    throw new Error("Cannot change video when screening is already submitted or approved.");
  }
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (payload.videoUrl !== undefined) {
    const raw = payload.videoUrl?.trim() ?? "";
    if (raw) {
      if (!isYouTubeUrl(raw) && !isGoogleDriveUrl(raw)) {
        throw new AppError(
          400,
          "INVALID_VIDEO_URL",
          "Only YouTube and Google Drive links are supported.",
        );
      }
    }
    const normalized = raw ? normalizeExternalVideoUrl(raw) : null;
    updates.screeningVideoUrl = normalized || null;
    updates.screeningVideoStoragePath = null;
  }
  await db.update(team).set(updates as Record<string, unknown>).where(eq(team.id, teamId));
}

export async function submitTeamForReview(actor: AppSessionUser, teamId: number) {
  const [membership] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(
      and(
        eq(teamMember.userId, actor.id),
        eq(teamMember.teamId, teamId),
        isNull(teamMember.leftAt),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new Error("You can only submit your active team.");
  }
  const check = await canTeamSubmit(teamId);
  if (!check.canSubmit) {
    throw new Error(
      "Cannot submit: add video and ensure all team members have completed the logic questions."
    );
  }
  const [t] = await db
    .select()
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);
  if (!t || (t.screeningStatus !== "draft" && t.screeningStatus !== "rejected")) {
    throw new Error("Team cannot be submitted (only draft or rejected can resubmit).");
  }
  await db
    .update(team)
    .set({
      screeningStatus: "submitted",
      screeningSubmittedAt: new Date(),
      screeningRejectedAt: null,
      screeningRejectedReason: null,
      updatedAt: new Date(),
    })
    .where(eq(team.id, teamId));
}
