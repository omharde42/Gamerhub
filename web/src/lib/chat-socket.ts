/**
 * Helpers for handling Socket.IO chat errors on the client.
 *
 * Extracted from the messages page so the optimistic-send failure flow can be
 * unit-tested without rendering the whole chat UI. The page wires these into
 * the socket `error` event listener.
 */

export interface ChatMessageLike {
  id: string;
  status?: string;
  [key: string]: unknown;
}

export const FALLBACK_SEND_ERROR = 'Failed to send message. Tap to retry.';

/** True when any message is still in the optimistic `sending` state. */
export function hasPendingSends<T extends ChatMessageLike>(messages: T[]): boolean {
  return messages.some((m) => m.status === 'sending');
}

/**
 * Mark every optimistic message still in `sending` state as `failed` so the UI
 * can offer tap-to-retry. Returns the same array reference when nothing is
 * pending (so React skips an unnecessary re-render), otherwise a new array —
 * the input is never mutated.
 */
export function markSendingMessagesFailed<T extends ChatMessageLike>(messages: T[]): T[] {
  if (!hasPendingSends(messages)) return messages;
  return messages.map((m) => (m.status === 'sending' ? { ...m, status: 'failed' } : m));
}

export interface SocketErrorHandlerDeps {
  /** Current optimistic message list (kept in a ref so the handler stays fresh). */
  getMessages: () => ChatMessageLike[];
  /** React state setter used to apply the failed-marking update. */
  setMessages: (updater: (prev: ChatMessageLike[]) => ChatMessageLike[]) => void;
  toast: { error: (message: string) => void };
}

/**
 * Handler for the Socket.IO `error` event emitted by the chat server when a
 * message send fails. Pending optimistic messages are marked `failed` and a
 * toast is shown — but only when there actually was a pending send, so
 * unrelated socket errors never produce a misleading "message failed" toast.
 */
export function createSocketErrorHandler({ getMessages, setMessages, toast }: SocketErrorHandlerDeps) {
  return (err?: { message?: string } | null): void => {
    const hadSending = hasPendingSends(getMessages());
    setMessages((prev) => markSendingMessagesFailed(prev));
    if (hadSending) toast.error(err?.message || FALLBACK_SEND_ERROR);
  };
}
