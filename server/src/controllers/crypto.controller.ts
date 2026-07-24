import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';
import { NotFoundError, ValidationError } from '../utils/errors';

export class CryptoController {
  /**
   * Registers or updates the user's E2EE Public Key Bundle on the server.
   * Private keys NEVER leave the user's device!
   */
  registerKeys = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { identityPublicKey, signingPublicKey } = req.body;
    if (!identityPublicKey) {
      throw new ValidationError({ identityPublicKey: ['Identity public key is required'] });
    }

    const keyBundleStr = JSON.stringify({ identityPublicKey, signingPublicKey });

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        passwordResetTokens: {
          // Store public key bundle in user metadata or JSON field
        } as any,
      },
    }).catch(async () => {
      // Fallback: Store public key bundle on Profile bio or metadata JSON
      await prisma.profile.update({
        where: { userId: req.user!.userId },
        data: {
          bioSummary: keyBundleStr,
        },
      });
    });

    // Save or update public key in database
    await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: {
        bioSummary: keyBundleStr,
      },
    });

    sendSuccess(res, { success: true }, 'Public key registered successfully');
  });

  /**
   * Fetches a recipient user's E2EE Public Key Bundle for message encryption.
   */
  getPublicKey = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { bioSummary: true, username: true },
    });

    if (!profile || !profile.bioSummary) {
      return sendError(res, 404, 'User public key not found or not initialized for E2EE');
    }

    try {
      const keys = JSON.parse(profile.bioSummary);
      sendSuccess(res, keys);
    } catch {
      sendError(res, 404, 'User public key bundle invalid');
    }
  });
}

export const cryptoController = new CryptoController();
