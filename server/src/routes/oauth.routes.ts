import { Router } from 'express';
import passport from '../config/passport';
import { config } from '../config';

const router = Router();

const handleAuth = (provider: string) => (req: any, res: any, next: any) => {
  passport.authenticate(provider, { session: false }, (err: any, data: any, info: any) => {
    if (err || !data) return res.redirect(`${config.frontendUrl}/auth/login?error=${info?.message || 'auth_failed'}`);
    res.redirect(`${config.frontendUrl}/auth/oauth-callback?accessToken=${data.accessToken}&refreshToken=${data.refreshToken}`);
  })(req, res, next);
};

router.get('/google', passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));
router.get('/google/callback', handleAuth('google'));
router.get('/discord', passport.authenticate('discord', { session: false, scope: ['identify', 'email'] }));
router.get('/discord/callback', handleAuth('discord'));
router.get('/steam', passport.authenticate('steam', { session: false }));
router.get('/steam/callback', handleAuth('steam'));

export default router;
