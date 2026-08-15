import {
  createSocketErrorHandler,
  hasPendingSends,
  markSendingMessagesFailed,
  FALLBACK_SEND_ERROR,
  ChatMessageLike,
} from './chat-socket';

describe('chat socket error handling', () => {
  describe('hasPendingSends', () => {
    it('detects optimistic messages still in the sending state', () => {
      expect(hasPendingSends([{ id: 'temp-1', status: 'sending' }])).toBe(true);
    });

    it('returns false when no message is sending', () => {
      expect(hasPendingSends([{ id: 'm1', status: 'sent' }, { id: 'm2', status: 'failed' }])).toBe(false);
      expect(hasPendingSends([])).toBe(false);
    });
  });

  describe('markSendingMessagesFailed', () => {
    it('marks only sending messages as failed and leaves the rest untouched', () => {
      const result = markSendingMessagesFailed([
        { id: 'temp-1', content: 'hi', status: 'sending' },
        { id: 'm1', content: 'ok', status: 'sent' },
        { id: 'temp-2', content: 'hey', status: 'sending' },
      ]);
      expect(result).toEqual([
        { id: 'temp-1', content: 'hi', status: 'failed' },
        { id: 'm1', content: 'ok', status: 'sent' },
        { id: 'temp-2', content: 'hey', status: 'failed' },
      ]);
    });

    it('does not mutate the input array', () => {
      const messages: ChatMessageLike[] = [{ id: 'temp-1', status: 'sending' }];
      markSendingMessagesFailed(messages);
      expect(messages[0].status).toBe('sending');
    });

    it('returns the same array reference when nothing is pending (avoids re-render)', () => {
      const messages: ChatMessageLike[] = [{ id: 'm1', status: 'sent' }];
      expect(markSendingMessagesFailed(messages)).toBe(messages);
    });
  });

  describe('createSocketErrorHandler', () => {
    it('marks pending messages failed and toasts with the server-provided message', () => {
      const getMessages = jest.fn(() => [{ id: 'temp-1', status: 'sending' }]);
      const setMessages = jest.fn();
      const toast = { error: jest.fn() };

      const handler = createSocketErrorHandler({ getMessages, setMessages, toast });
      handler({ message: 'Not a participant in this chat' });

      // The state setter was invoked with a transformer that fails pending sends.
      const updater = setMessages.mock.calls[0][0] as (prev: ChatMessageLike[]) => ChatMessageLike[];
      expect(updater([{ id: 'temp-1', status: 'sending' }])).toEqual([{ id: 'temp-1', status: 'failed' }]);
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith('Not a participant in this chat');
    });

    it('does not toast when there are no pending sends (unrelated socket errors)', () => {
      const getMessages = jest.fn(() => [{ id: 'm1', status: 'sent' }]);
      const setMessages = jest.fn();
      const toast = { error: jest.fn() };

      const handler = createSocketErrorHandler({ getMessages, setMessages, toast });
      handler({ message: 'some unrelated socket error' });

      expect(setMessages).toHaveBeenCalledTimes(1);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('falls back to the default message when the error carries no message', () => {
      const getMessages = jest.fn(() => [{ id: 'temp-1', status: 'sending' }]);
      const setMessages = jest.fn();
      const toast = { error: jest.fn() };

      const handler = createSocketErrorHandler({ getMessages, setMessages, toast });
      handler(null);

      expect(toast.error).toHaveBeenCalledWith(FALLBACK_SEND_ERROR);
    });

    it('is safe when the message list is empty', () => {
      const getMessages = jest.fn(() => []);
      const setMessages = jest.fn();
      const toast = { error: jest.fn() };

      const handler = createSocketErrorHandler({ getMessages, setMessages, toast });
      handler({ message: 'boom' });

      expect(setMessages).toHaveBeenCalledTimes(1);
      expect(toast.error).not.toHaveBeenCalled();
    });
  });
});
