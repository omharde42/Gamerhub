import { createChatEventHandlers, assertSameChatPair } from './handlers';

function createMockSocket(userId: string) {
  const emitted: any[] = [];
  const toEmitted: any[] = [];
  const joined: string[] = [];
  const left: string[] = [];
  const socket = {
    userId,
    joined,
    left,
    join: jest.fn((room: string) => {
      joined.push(room);
    }),
    leave: jest.fn((room: string) => {
      left.push(room);
    }),
    to: jest.fn(() => ({
      emit: (event: string, ...args: any[]) => toEmitted.push({ event, args }),
    })),
    emit: jest.fn((event: string, ...args: any[]) => emitted.push({ event, args })),
  };
  return { socket, emitted, toEmitted };
}

function createMockIo() {
  const emitted: any[] = [];
  const toEmitted: any[] = [];
  const io = {
    emit: jest.fn((event: string, ...args: any[]) => emitted.push({ event, args })),
    to: jest.fn(() => ({
      emit: (event: string, ...args: any[]) => toEmitted.push({ event, args }),
    })),
  };
  return { io, emitted, toEmitted };
}

function createDeps(overrides: any = {}) {
  return {
    prisma: {
      chatParticipant: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      profile: { findUnique: jest.fn() },
      user: { update: jest.fn().mockResolvedValue({}) },
      ...(overrides.prisma || {}),
    },
    chatService: {
      sendMessage: jest.fn(),
      markAsRead: jest.fn().mockResolvedValue({ messageIds: ['m1'] }),
      editMessage: jest.fn(),
      deleteMessage: jest.fn(),
      toggleReaction: jest.fn(),
      setPinned: jest.fn(),
      ...(overrides.chatService || {}),
    },
  };
}

describe('socket chat authorization', () => {
  const participants = [{ userId: 'user-a' }, { userId: 'user-b' }];

  function depsWithParticipants(participantIds: string[]) {
    const deps = createDeps();
    (deps.prisma.chatParticipant.findFirst as jest.Mock).mockImplementation(({ where }: any) =>
      Promise.resolve(participantIds.includes(where.userId) ? { id: 'p' } : null)
    );
    (deps.prisma.chatParticipant.findMany as jest.Mock).mockResolvedValue(
      participantIds.map((userId) => ({ userId }))
    );
    return deps;
  }

  describe('join:chat', () => {
    it('joins the room when the socket user is a participant', async () => {
      const deps = depsWithParticipants(['user-a', 'user-b']);
      const { io } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket } = createMockSocket('user-a');

      await h.handleJoinChat(socket as any, 'chat-1');

      expect(socket.join).toHaveBeenCalledWith('chat:chat-1');
      expect(socket.emit).not.toHaveBeenCalled();
    });

    it('rejects an unauthorized join and does NOT join the room', async () => {
      const deps = depsWithParticipants(['user-a', 'user-b']);
      const { io } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket, emitted } = createMockSocket('user-x'); // not a participant

      await h.handleJoinChat(socket as any, 'chat-1');

      expect(socket.join).not.toHaveBeenCalled();
      expect(emitted).toEqual([
        expect.objectContaining({ event: 'error', args: [expect.objectContaining({ message: 'Not authorized to join this chat' })] }),
      ]);
    });
  });

  describe('typing events', () => {
    it('forwards typing:start only for participants', async () => {
      const deps = depsWithParticipants(['user-a', 'user-b']);
      const { io } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket, toEmitted } = createMockSocket('user-a');

      await h.handleTypingStart(socket as any, 'chat-1');
      expect(toEmitted).toEqual([expect.objectContaining({ event: 'typing:start' })]);
    });

    it('blocks typing:start from a non-participant', async () => {
      const deps = depsWithParticipants(['user-a', 'user-b']);
      const { io } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket, emitted, toEmitted } = createMockSocket('user-x');

      await h.handleTypingStart(socket as any, 'chat-1');
      expect(toEmitted).toHaveLength(0);
      expect(emitted).toEqual([
        expect.objectContaining({ event: 'error', args: [expect.objectContaining({ message: 'Not authorized to send typing events for this chat' })] }),
      ]);
    });

    it('blocks typing:stop from a non-participant', async () => {
      const deps = depsWithParticipants(['user-a', 'user-b']);
      const { io } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket, toEmitted } = createMockSocket('user-x');

      await h.handleTypingStop(socket as any, 'chat-1');
      expect(toEmitted).toHaveLength(0);
    });
  });

  describe('message observation', () => {
    it('does not broadcast a message when chatService rejects a non-participant', async () => {
      const deps = createDeps();
      (deps.chatService.sendMessage as jest.Mock).mockRejectedValue(new Error('Not a participant in this chat'));
      const { io, toEmitted } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket, emitted } = createMockSocket('user-x');

      await h.handleMessageSend(socket as any, { chatId: 'chat-1', content: 'hi' });

      expect(toEmitted).toHaveLength(0);
      expect(emitted).toEqual([
        expect.objectContaining({ event: 'error', args: [expect.objectContaining({ message: 'Not a participant in this chat' })] }),
      ]);
    });

    it('broadcasts message:new only to the chat room for participants', async () => {
      const deps = createDeps();
      (deps.chatService.sendMessage as jest.Mock).mockResolvedValue({ id: 'm1', content: 'hi' });
      const { io, toEmitted } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket } = createMockSocket('user-a');

      await h.handleMessageSend(socket as any, { chatId: 'chat-1', content: 'hi' });

      expect(toEmitted).toEqual([
        expect.objectContaining({ event: 'message:new', args: [expect.objectContaining({ id: 'm1' })] }),
      ]);
    });

    it('broadcasts message:edited to the room when the edit succeeds', async () => {
      const deps = createDeps();
      (deps.chatService.editMessage as jest.Mock).mockResolvedValue({ id: 'm1', content: 'edited', isEdited: true });
      const { io, toEmitted } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket } = createMockSocket('user-a');

      await h.handleMessageEdit(socket as any, { chatId: 'chat-1', messageId: 'm1', content: 'edited' });

      expect(toEmitted).toEqual([
        expect.objectContaining({ event: 'message:edited', args: [expect.objectContaining({ message: expect.objectContaining({ id: 'm1' }) })] }),
      ]);
    });

    it('does not broadcast message:deleted when deletion fails', async () => {
      const deps = createDeps();
      (deps.chatService.deleteMessage as jest.Mock).mockRejectedValue(new Error('Not a participant in this chat'));
      const { io, toEmitted } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket, emitted } = createMockSocket('user-x');

      await h.handleMessageDelete(socket as any, { chatId: 'chat-1', messageId: 'm1' });

      expect(toEmitted).toHaveLength(0);
      expect(emitted[0]).toEqual(
        expect.objectContaining({ event: 'error', args: [expect.objectContaining({ message: 'Not a participant in this chat' })] })
      );
    });

    it('emits reaction-added after a successful toggle', async () => {
      const deps = createDeps();
      (deps.chatService.toggleReaction as jest.Mock).mockResolvedValue({ reacted: true, messageId: 'm1', emoji: '🔥' });
      const { io, toEmitted } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket } = createMockSocket('user-a');

      await h.handleMessageReact(socket as any, { chatId: 'chat-1', messageId: 'm1', emoji: '🔥' });

      expect(toEmitted).toEqual([
        expect.objectContaining({ event: 'message:reaction-added', args: [expect.objectContaining({ emoji: '🔥' })] }),
      ]);
    });

    it('emits pin-changed after a successful pin toggle', async () => {
      const deps = createDeps();
      (deps.chatService.setPinned as jest.Mock).mockResolvedValue({ id: 'm1', isPinned: true });
      const { io, toEmitted } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket } = createMockSocket('user-a');

      await h.handleMessagePin(socket as any, { chatId: 'chat-1', messageId: 'm1', isPinned: true });

      expect(toEmitted).toEqual([
        expect.objectContaining({ event: 'message:pin-changed', args: [expect.objectContaining({ isPinned: true })] }),
      ]);
    });
  });

  describe('read receipts', () => {
    let warnSpy: jest.SpyInstance;
    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('does not emit messages:read when markAsRead fails for a non-participant', async () => {
      const deps = createDeps();
      (deps.chatService.markAsRead as jest.Mock).mockRejectedValue(new Error('Not a participant in this chat'));
      const { io, toEmitted } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket } = createMockSocket('user-x');

      await h.handleMessagesRead(socket as any, { chatId: 'chat-1' });

      expect(toEmitted).toHaveLength(0);
    });
  });

  describe('call signaling', () => {
    it('delivers call:request only when both users are participants of the same chat', async () => {
      const deps = depsWithParticipants(['user-a', 'user-b']);
      (deps.prisma.profile.findUnique as jest.Mock).mockResolvedValue({ username: 'a', displayName: 'A', avatar: null });
      const { io, toEmitted } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket } = createMockSocket('user-a');

      await h.handleCallRequest(socket as any, {
        toUserId: 'user-b',
        chatId: 'chat-1',
        type: 'audio',
        callerInfo: { id: 'spoofed', username: 'spoofed' }, // client-supplied — must be ignored
      });

      expect(toEmitted).toHaveLength(1);
      const payload = toEmitted[0].args[0];
      expect(payload.fromUserId).toBe('user-a'); // derived from token, not callerInfo
      expect(payload.callerInfo).toEqual({ id: 'user-a', username: 'a', displayName: 'A', avatar: null });
    });

    it('blocks call:request when the sender is not a participant', async () => {
      const deps = depsWithParticipants(['user-a', 'user-b']);
      const { io, toEmitted } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket, emitted } = createMockSocket('user-x');

      await h.handleCallRequest(socket as any, { toUserId: 'user-b', chatId: 'chat-1', type: 'audio' });

      expect(toEmitted).toHaveLength(0);
      expect(emitted[0]).toEqual(
        expect.objectContaining({ event: 'error', args: [expect.objectContaining({ message: 'Not a participant in this chat' })] })
      );
    });

    it('blocks call:request when the recipient is not a participant of the same chat', async () => {
      const deps = depsWithParticipants(['user-a', 'user-b']);
      const { io, toEmitted } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket, emitted } = createMockSocket('user-a');

      await h.handleCallRequest(socket as any, { toUserId: 'user-z', chatId: 'chat-1', type: 'audio' });

      expect(toEmitted).toHaveLength(0);
      expect(emitted[0]).toEqual(
        expect.objectContaining({ event: 'error', args: [expect.objectContaining({ message: 'Recipient is not a participant in this chat' })] })
      );
    });

    it.each(['call:offer', 'call:answer', 'call:ice-candidate', 'call:ice-restart', 'call:end', 'call:accept', 'call:reject'] as const)(
      'blocks %s from an unauthorized sender and never reaches the recipient',
      async (event) => {
        const deps = depsWithParticipants(['user-a', 'user-b']);
        const { io, toEmitted } = createMockIo();
        const h = createChatEventHandlers(io as any, deps);
        const { socket } = createMockSocket('user-x');

        const payload: any = { toUserId: 'user-b', chatId: 'chat-1', type: 'audio', sdp: { type: 'offer', sdp: 'x' }, candidate: { candidate: 'x' }, reason: 'no' };

        switch (event) {
          case 'call:offer': await h.handleCallOffer(socket as any, payload); break;
          case 'call:answer': await h.handleCallAnswer(socket as any, payload); break;
          case 'call:ice-candidate': await h.handleCallIceCandidate(socket as any, payload); break;
          case 'call:ice-restart': await h.handleCallIceRestart(socket as any, payload); break;
          case 'call:end': await h.handleCallEnd(socket as any, payload); break;
          case 'call:accept': await h.handleCallAccept(socket as any, payload); break;
          case 'call:reject': await h.handleCallReject(socket as any, payload); break;
        }

        expect(toEmitted).toHaveLength(0);
      }
    );

    it('allows signaling between two participants of the same chat', async () => {
      const deps = depsWithParticipants(['user-a', 'user-b']);
      const { io, toEmitted } = createMockIo();
      const h = createChatEventHandlers(io as any, deps);
      const { socket } = createMockSocket('user-a');

      await h.handleCallOffer(socket as any, { toUserId: 'user-b', chatId: 'chat-1', sdp: { type: 'offer' } });

      expect(toEmitted).toHaveLength(1);
      expect(toEmitted[0].event).toBe('call:offer');
      expect(toEmitted[0].args[0].fromUserId).toBe('user-a');
    });
  });

  describe('assertSameChatPair', () => {
    it('rejects a recipient outside the chat', async () => {
      const deps = depsWithParticipants(['user-a', 'user-b']);
      await expect(assertSameChatPair(deps.prisma, 'chat-1', 'user-a', 'user-z')).rejects.toThrow(
        'Recipient is not a participant in this chat'
      );
    });

    it('rejects when the chat does not exist', async () => {
      const deps = createDeps();
      (deps.prisma.chatParticipant.findMany as jest.Mock).mockResolvedValue([]);
      await expect(assertSameChatPair(deps.prisma, 'missing', 'user-a', 'user-b')).rejects.toThrow(
        'Not a participant in this chat'
      );
    });
  });
});
