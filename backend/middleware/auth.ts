import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.ts';
import mongoose from 'mongoose';
import { localFindUserById } from '../utils/localStore.ts';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Protect routes - ensures user is authenticated with a valid JWT
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Server misconfiguration' });
  }

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (Bearer TOKEN)
      token = req.headers.authorization.split(' ')[1];

      // Verify token without fallback
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

      // CHECK: If DB is not connected, authenticate via local fallback if possible
      if (mongoose.connection.readyState !== 1) {
        console.warn('⚠️ MongoDB not connected. Authenticating via Local File DB.');
        
        const localUser = await localFindUserById(decoded.id);
        if (localUser) {
          req.user = {
            _id: localUser._id,
            name: localUser.name,
            email: localUser.email,
            profileImage: localUser.profileImage
          };
          return next();
        }

        // Default legacy fallback
        req.user = {
          _id: decoded.id || '000000000000000000000001',
          name: 'Demo Pilot',
          email: 'demo@example.com'
        };
        return next();
      }

      // Get user from the token (Normal Mode)
      req.user = await User.findById(decoded.id).select('-password').maxTimeMS(2000);

      if (!req.user && decoded.id !== '000000000000000000000001') {
        return res.status(401).json({ message: 'User not found' });
      } else if (!req.user && decoded.id === '000000000000000000000001') {
         // Handle demo user from previous sessions
         req.user = { _id: '000000000000000000000001', name: 'Demo Pilot', email: 'demo@example.com' };
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
