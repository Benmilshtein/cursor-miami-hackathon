import { EventEmitter } from "events";

const g = globalThis as unknown as { mentorEmitter?: EventEmitter };

if (!g.mentorEmitter) {
  g.mentorEmitter = new EventEmitter();
  g.mentorEmitter.setMaxListeners(500);
}

export const mentorEmitter = g.mentorEmitter;

export function mentorChannel(mentorId: string) {
  return `mentor:${mentorId}:notification`;
}

export function teamMentorChannel(teamId: number) {
  return `team:${teamId}:mentor`;
}

export function notifyMentor(mentorId: string, payload: object) {
  mentorEmitter.emit(mentorChannel(mentorId), payload);
}

export function notifyTeam(teamId: number, payload: object) {
  mentorEmitter.emit(teamMentorChannel(teamId), payload);
}
