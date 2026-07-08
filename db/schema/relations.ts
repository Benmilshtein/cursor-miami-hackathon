import { relations } from "drizzle-orm";
import {
  staffInvite,
  staffMember,
  team,
  user,
} from "./auth";
import { teamInvite, teamMember } from "./teams";
import { screeningAnswer, screeningQuestion } from "./screening";
import { judgeScore } from "./scoring";
import { project } from "./projects";
import { mentorRequest } from "./mentor";
import { peerVote } from "./peer-voting";

export const userRelations = relations(user, ({ one, many }) => ({
  team: one(team, {
    fields: [user.teamId],
    references: [team.id],
    relationName: "assigned_team",
  }),
  createdTeams: many(team, { relationName: "team_creator" }),
  memberships: many(teamMember),
  removedMemberships: many(teamMember, { relationName: "membership_removed_by" }),
  createdInvites: many(teamInvite, { relationName: "invite_creator" }),
  screeningAnswers: many(screeningAnswer),
  staffMember: one(staffMember),
  createdStaffInvites: many(staffInvite),
  judgeScores: many(judgeScore),
  peerVotes: many(peerVote),
  assignedMentorRequests: many(mentorRequest, { relationName: "assigned_mentor" }),
  acceptedMentorRequests: many(mentorRequest, { relationName: "accepted_mentor" }),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
  assignedUsers: many(user, { relationName: "assigned_team" }),
  createdBy: one(user, {
    fields: [team.createdByUserId],
    references: [user.id],
    relationName: "team_creator",
  }),
  memberships: many(teamMember),
  invites: many(teamInvite),
  judgeScores: many(judgeScore),
  peerVotes: many(peerVote),
  project: one(project, {
    fields: [team.id],
    references: [project.teamId],
  }),
  mentorRequests: many(mentorRequest),
}));

export const projectRelations = relations(project, ({ one }) => ({
  team: one(team, {
    fields: [project.teamId],
    references: [team.id],
  }),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
  removedBy: one(user, {
    fields: [teamMember.removedByUserId],
    references: [user.id],
    relationName: "membership_removed_by",
  }),
}));

export const teamInviteRelations = relations(teamInvite, ({ one }) => ({
  team: one(team, {
    fields: [teamInvite.teamId],
    references: [team.id],
  }),
  createdBy: one(user, {
    fields: [teamInvite.createdByUserId],
    references: [user.id],
    relationName: "invite_creator",
  }),
}));

export const screeningQuestionRelations = relations(screeningQuestion, ({ many }) => ({
  answers: many(screeningAnswer),
}));

export const screeningAnswerRelations = relations(screeningAnswer, ({ one }) => ({
  user: one(user, { fields: [screeningAnswer.userId], references: [user.id] }),
  question: one(screeningQuestion, {
    fields: [screeningAnswer.questionId],
    references: [screeningQuestion.id],
  }),
}));

export const staffInviteRelations = relations(staffInvite, ({ one }) => ({
  createdBy: one(user, {
    fields: [staffInvite.createdByUserId],
    references: [user.id],
  }),
}));

export const staffMemberRelations = relations(staffMember, ({ one }) => ({
  user: one(user, {
    fields: [staffMember.userId],
    references: [user.id],
  }),
}));

export const judgeScoreRelations = relations(judgeScore, ({ one }) => ({
  team: one(team, {
    fields: [judgeScore.teamId],
    references: [team.id],
  }),
  judge: one(user, {
    fields: [judgeScore.judgeUserId],
    references: [user.id],
  }),
}));

export const peerVoteRelations = relations(peerVote, ({ one }) => ({
  team: one(team, {
    fields: [peerVote.teamId],
    references: [team.id],
  }),
  voter: one(user, {
    fields: [peerVote.voterUserId],
    references: [user.id],
  }),
}));

export const mentorRequestRelations = relations(mentorRequest, ({ one }) => ({
  team: one(team, {
    fields: [mentorRequest.teamId],
    references: [team.id],
  }),
  assignedMentor: one(user, {
    fields: [mentorRequest.assignedMentorId],
    references: [user.id],
    relationName: "assigned_mentor",
  }),
  acceptedMentor: one(user, {
    fields: [mentorRequest.acceptedMentorId],
    references: [user.id],
    relationName: "accepted_mentor",
  }),
}));
