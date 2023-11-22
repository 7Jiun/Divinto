import { Request, Response } from 'express';
import * as userModel from '../model/userModel.ts';
import signJWT, { EXPIRE_TIME } from '../utils/signJWT.ts';

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
  try {
    const hashedPassword = await createHashPassword(password);
    console.log(hashedPassword);
    if (!hashedPassword) return res.status(500).json({ data: 'create hashed user failed' });
    const UserPayload = await userModel.nativeUserSignUp(email, name, hashedPassword);
    console.log(UserPayload);
    if (!UserPayload) return res.status(500).json({ data: 'sign up failed' });
    const token = await signJWT(UserPayload);
    console.log(token);
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
  } catch (error) {
    if (error instanceof Error) {
      console.error(`sign up error: ${error.message}`);
      res.status(500).json({ data: 'sign up failed' });
    }
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
    }
  }
}
