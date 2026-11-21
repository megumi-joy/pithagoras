import { useRef } from "react";
import { Link } from "react-router-dom";
import { AgentAvatar, useChatAvatar } from "./AgentAvatar";
import type { VoiceLevels } from "./VoiceOrb";
import { t } from "../i18n";

/**
 * What /voice shows before a conversation: the orb of the agent and its name. The sound of a browser starts
 * only with a touch, so the first touch of the orb is what starts the conversation.
 */
export function VoicePageIdle({ sessionId, starting, onStart, chat }: { sessionId: string; starting: boolean; onStart: () => void; chat: string }) {
  const { agent, look } = useChatAvatar(sessionId);
  const levels = useRef<VoiceLevels>({ input: 0, output: 0 });
  return (
    <div data-testid="voice-page-idle" className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4">
      <p className="text-lg font-semibold tracking-wide text-fg">{agent?.name ?? "Voicy"}</p>
      <button
        type="button"
        onClick={onStart}
        disabled={starting}
        aria-label={t("Tap to start the conversation")}
        className="voice-avatar my-10 w-[min(70vw,45dvh,22rem)] rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <AgentAvatar look={look} agent={agent} mode="idle" levels={levels} still />
      </button>
      <p className="text-sm text-fg-muted">{t("Tap the orb to talk")}</p>
      <Link to={chat} className="text-sm text-accent hover:underline">{t("Open the chat")}</Link>
    </div>
  );
}
