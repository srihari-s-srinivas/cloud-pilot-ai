import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.ts';
import mongoose from 'mongoose';
import { z } from 'zod';
import { 
  localFindUserByEmail, 
  localCreateUser, 
  localFindUserById, 
  localComparePassword, 
  localUpdateUserProfile 
} from '../utils/localStore.ts';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
  }
  return secret;
};

// Zod validation schemas
const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

/**
 * Generate JWT Token (Expired after 24 hours)
 */
const generateToken = (id: string) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: '24h',
  });
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(', ');
      return res.status(400).json({ message: errorMsg });
    }

    const { name, email, password } = validation.data;

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters' 
      });
    }

    // CHECK: Is MongoDB actually connected?
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ MongoDB not connected. Using Local File DB Fallback for registration.');
      
      const existing = await localFindUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const localUser = await localCreateUser({ name, email, password });
      return res.status(201).json({
        _id: localUser._id,
        name: localUser.name,
        email: localUser.email,
        profileImage: localUser.profileImage,
        token: generateToken(localUser._id),
        isDemo: false
      });
    }

    const userExists = await User.findOne({ email }).maxTimeMS(2000);

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error('[authController][registerUser]', error);
    if (error?.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(', ');
      return res.status(400).json({ message: errorMsg });
    }

    const { email, password } = validation.data;

    // CHECK: Is MongoDB actually connected?
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ MongoDB not connected. Using Local File DB Fallback for login.');
      
      const existing = await localFindUserByEmail(email);
      if (existing && await localComparePassword(password, existing.password)) {
        return res.json({
          _id: existing._id,
          name: existing.name,
          email: existing.email,
          profileImage: existing.profileImage,
          token: generateToken(existing._id),
          isDemo: false
        });
      }

      // Allow default demo login under demo@example.com for ease
      if (email === 'demo@example.com' || (existing === null && email.toLowerCase().includes('demo'))) {
        return res.json({
          _id: '000000000000000000000001',
          name: 'Demo Pilot',
          email: email,
          token: generateToken('000000000000000000000001'),
          isDemo: true
        });
      }

      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = await User.findOne({ email }).select('+password').maxTimeMS(2000);

    if (user && (await (user as any).matchPassword(password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error('[authController][loginUser]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getMe = async (req: any, res: Response) => {
  const user = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    profileImage: req.user.profileImage,
  };
  res.json(user);
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req: any, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
       const id = req.user._id;
       const localUpdates: any = {};
       if (req.body.name) localUpdates.name = req.body.name;
       if (req.body.email) localUpdates.email = req.body.email;
       if (req.body.profileImage !== undefined) localUpdates.profileImage = req.body.profileImage;
       
       if (req.body.password) {
         if (req.body.password.length < 6) {
           return res.status(400).json({ message: 'Password must be at least 6 characters' });
         }
         localUpdates.password = req.body.password;
       }

       const updated = await localUpdateUserProfile(id, localUpdates);
       if (updated) {
         return res.json({
           _id: updated._id,
           name: updated.name,
           email: updated.email,
           profileImage: updated.profileImage,
           token: generateToken(updated._id.toString())
         });
       }

       return res.json({
         _id: req.user._id,
         name: req.body.name || req.user.name,
         email: req.body.email || req.user.email,
         profileImage: req.body.profileImage !== undefined ? req.body.profileImage : req.user.profileImage,
         token: req.headers.authorization?.split(' ')[1]
       });
    }
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.profileImage !== undefined) {
        (user as any).profileImage = req.body.profileImage;
      }

      if (req.body.password) {
        if (req.body.password.length < 6) {
          return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        (user as any).password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileImage: (updatedUser as any).profileImage,
        token: generateToken(updatedUser._id.toString()),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    console.error('[authController][updateProfile]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Debug Auth & Mongoose DB connection details
 * @route   GET /api/auth/debug
 * @access  Private
 */
export const debugAuth = async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }

  try {
    const state = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const connectionState = states[state] || 'unknown';

    let collections: string[] = [];
    let indexes: any = {};
    let usersCount = 0;

    if (state === 1 && mongoose.connection.db) {
      const collectionsData = await mongoose.connection.db.listCollections().toArray();
      collections = collectionsData.map(c => c.name);
      
      try {
        const UserCollection = mongoose.connection.db.collection('users');
        indexes = await UserCollection.indexes();
        usersCount = await UserCollection.countDocuments();
      } catch (idxErr: any) {
        indexes = { error: 'Internal index fetch error' };
      }
    }

    res.json({
      success: true,
      mongoUriConfigured: !!process.env.MONGO_URI,
      mongoUriRedacted: process.env.MONGO_URI ? process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@') : 'none',
      connectionState,
      readyState: state,
      collections,
      indexes,
      usersCount
    });

  } catch (error: any) {
    console.error('[authController][debugAuth]', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
