import { JwtUserPayload } from '../utils/signJWT.ts';
import { User } from './schema.ts';

interface CheckedUser {
  userPayload: JwtUserPayload | null;
  isVerified: Boolean;
}

interface IUser {
  whiteboards: string[] | undefined | null;
  agents: string[] | undefined | null;
  createdAt: string | undefined | null;
  updateAt: string | undefined | null;
  removeAt: string | undefined | null;
  provider?: string | null | undefined;
  name?: string | null | undefined;
  email?: string | null | undefined;
  password?: string | null | undefined;
}

export async function nativeUserSignUp(email: string, name: string, password: string) {
  const user = await User.create({
    provider: 'native',
    email: email,
    name: name,
    password: password,
  });
  return {
    id: user._id,
    name: name,
  };
}

export async function checkNativePassword(
  email: string,
  hashedPassword: string,
): Promise<CheckedUser> {
  const user = await User.findOne({ email: email });
  if (user && user.name) {
    const savedPassword = user.password;
    const userPayload = {
      id: user._id,
      name: user.name,
    };
    if (savedPassword) {
      const isVerified = await Bun.password.verify(hashedPassword, savedPassword);
      const checkedResult = {
        userPayload: userPayload,
        isVerified: isVerified,
      };
      return checkedResult;
    }
  }
  return {
    userPayload: null,
    isVerified: false,
  };
}

export async function getUserProfile(userId: string): Promise<IUser | null> {
  const userRawdata = await User.findById(userId);
  if (!userRawdata) return null;
  if (!userRawdata.removeAt) {
    const user = {
      id: userId,
      name: userRawdata?.name,
      whiteboards: userRawdata?.whiteboards,
      agents: userRawdata?.agents,
      createdAt: userRawdata?.createdAt.toString(),
      updateAt: userRawdata?.updateAt.toString(),
      removeAt: null,
      provider: userRawdata?.provider,
      email: userRawdata?.email,
    };
    return user;
  } else {
    return null;
  }
}

export async function addWhiteboardInUser(userId: string, whiteboardId: string) {
  const updateWhiteboard = await User.findByIdAndUpdate(
    userId,
    {
      $push: { whiteboards: whiteboardId },
      $set: { updateAt: Date.now() },
    },
    { new: true },
  );
  return updateWhiteboard;
}

export async function deleteWhiteboardInUser(
  userId: string,
  whiteboardId: string,
): Promise<Boolean> {
  const deleteWhiteboard = await User.findByIdAndUpdate(
    userId,
    {
      $pull: { whiteboards: whiteboardId },
      $set: { updateAt: Date.now() },
    },
    { new: true },
  );
  if (deleteWhiteboard) {
    return true;
  } else {
    return false;
  }
}
