import { Request, Response } from 'express';
import signJWT, { EXPIRE_TIME } from '../utils/signJWT.ts';
import * as userModel from '../model/userModel.ts';
import { createOnboardingData } from '../utils/onboardingData.ts';
import mongoose from 'mongoose';

async function createHashPassword(password: string): Promise<string | null> {
  try {
    const hashedPassword = await Bun.password.hash(password, {
      algorithm: 'bcrypt',
      cost: 4,
    });
    return hashedPassword;
  } catch (error) {
    console.error('bcrypted error');
    return null;
  }
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/',
  secure: true,
  sameSite: 'strict',
} as const;

export async function nativeUserSignUp(req: Request, res: Response) {
  const { email, name, password } = req.body;
  const createUserSession = await mongoose.startSession();

  try {
    createUserSession.startTransaction();
    const hashedPassword = await createHashPassword(password);

    if (!hashedPassword) return res.status(500).json({ data: 'create hashed user failed' });
    const UserPayload = await userModel.nativeUserSignUp(
      email,
      name,
      hashedPassword,
      createUserSession,
    );

    if (!UserPayload) {
      await createUserSession.abortTransaction();
      return res.status(500).json({ data: 'sign up failed' });
    }

    const isOnboardingData = await createOnboardingData(UserPayload, createUserSession);

    if (!isOnboardingData) {
      await createUserSession.abortTransaction();
      return res.status(500).json({ data: 'sign up failed' });
    }

    const token = await signJWT(UserPayload);
    res
      .cookie('jwtToken', token, COOKIE_OPTIONS)
      .status(200)
      .json({
        data: {
          access_token: token,
          access_expired: EXPIRE_TIME,
          user: {
            userId: UserPayload.id,
            provider: 'native',
            name,
            email,
          },
        },
      });
    await createUserSession.commitTransaction();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`sign up error: ${error.message}`);
      if (error.message === 'Email already in use')
        res.status(400).json({ data: 'email has been used' });
      res.status(500).json({ data: 'Signed up failed, please retry again' });
    }
    await createUserSession.abortTransaction();
  } finally {
    createUserSession.endSession();
  }
}

export async function nativeUserSignIn(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const checkedResult = await userModel.checkNativePassword(email, password);
    if (!checkedResult.isVerified || !checkedResult.userPayload) {
      throw new Error('invalid password');
    }
    const token = await signJWT(checkedResult.userPayload);
    res
      .cookie('jwtToken', token, COOKIE_OPTIONS)
      .status(200)
      .json({
        data: {
          access_token: token,
          access_expired: EXPIRE_TIME,
          user: {
            provider: 'native',
            userId: checkedResult.userPayload.id,
            name: checkedResult.userPayload.name,
          },
        },
      });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`sign in error: ${error.message}`);
      res.status(400).json({ data: 'wrong email or password' });
    }
  }
}

export async function getUserProfile(req: Request, res: Response) {
  const userPayload = res.locals.userPayload;
  const userId = userPayload.id.toString();
  const profile = await userModel.getUserProfile(userId);
  if (!profile) return res.status(400).json({ data: 'get user profile wrong' });
  res.status(200).json({ data: profile });
}

export async function getWhiteboardsByUser(req: Request, res: Response) {
  const userPayload = res.locals.userPayload;
  const userId = userPayload.id.toString();
  const whiteboards = await userModel.getWhiteboardsByUser(userId);
  if (!whiteboards) return res.status(400).json({ data: 'get users whiteboard wrong' });
  res.status(200).json({ data: whiteboards });
}

export async function getAgentsByUser(req: Request, res: Response) {
  const userPayload = res.locals.userPayload;
  const userId = userPayload.id.toString();
  const agents = await userModel.getAgentsByUser(userId);
  if (!agents) return res.status(400).json({ data: 'get users agent wrong' });
  res.status(200).json({ data: agents });
}
