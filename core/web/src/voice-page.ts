import type { Agent, Session } from "./api";

/** What the /voice page needs of the portal: the agents, and a chat started in a folder. */
export interface VoicePageDeps {
  agents: () => Promise<{ agents: Pick<Agent, "id" | "name" | "home" | "first" | "newChats">[] }>;
  createSession: (workspace?: string) => Promise<Session>;
}

/**
 * The agent /voice talks to: the one `?agent=` names, else the one New starts chats with, else the first.
 * An id nobody has falls back the same way, so an old link still opens.
 */
export function agentForVoice<A extends Pick<Agent, "id" | "first" | "newChats">>(agents: A[], wanted: string | null): A | undefined {
  return agents.find((a) => wanted !== null && a.id === wanted) ?? agents.find((a) => a.newChats) ?? agents.find((a) => a.first) ?? agents[0];
}

/** The newest chat of its own (not a sub-chat, not a routine's or a heartbeat's) in the agent's home. */
export function latestChatIn(sessions: Session[], home: string): Session | undefined {
  return sessions
    .filter((s) => s.workspace === home && !s.parent && (s.kind === undefined || s.kind === "task" || s.kind === "agent"))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
}

/**
 * The chat /voice opens: the agent's latest one, and a new one when it has none. The conversation is one in every
 * channel, so this is the chat the text page shows too.
 */
export async function chatForVoice(deps: VoicePageDeps, sessions: Session[], wanted: string | null): Promise<{ session: Session; agent: string } | null> {
  const { agents } = await deps.agents();
  const agent = agentForVoice(agents, wanted);
  if (!agent) return null;
  const session = latestChatIn(sessions, agent.home) ?? (await deps.createSession(agent.home));
  return { session, agent: agent.name };
}
