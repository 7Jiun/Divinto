import mongoose, { ClientSession } from 'mongoose';
import { CheckedUser, IUser } from '../utils/shape.ts';
import { User } from './schema.ts';

export async function nativeUserSignUp(email: string, name: string, password: string) {
  const isEmailExist = await User.findOne({ email: email });

  if (isEmailExist) {
    throw new Error('Email already in use');
  }

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

export async function getWhiteboardsByUser(userId: string) {
  const whiteboards = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $addFields: {
        whiteboards: {
          $map: {
            input: '$whiteboards',
            as: 'whiteboards',
            in: { $toObjectId: '$$whiteboards' },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'whiteboards',
        localField: 'whiteboards',
        foreignField: '_id',
        as: 'whiteboards',
      },
    },
    {
      $project: {
        whiteboards: {
          $filter: {
            input: '$whiteboards',
            as: 'whiteboard',
            cond: { $eq: ['$$whiteboard.removeAt', null] },
          },
        },
        createdAt: '$createdAt',
        updateAt: '$updateAt',
        removeAt: '$removeAt',
      },
    },
  ]);
  return whiteboards;
}

export async function addWhiteboardInUser(
  userId: string,
  whiteboardId: string,
  session: ClientSession,
) {
  const updateWhiteboard = await User.findByIdAndUpdate(
    userId,
    {
      $push: { whiteboards: whiteboardId },
      $set: { updateAt: Date.now() },
    },
    { new: true, session: session },
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

export async function getAgentsByUser(userId: string) {
  const agents = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $addFields: {
        agents: {
          $map: {
            input: '$agents',
            as: 'agents',
            in: { $toObjectId: '$$agents' },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'agents',
        localField: 'agents',
        foreignField: '_id',
        as: 'agents',
      },
    },
    {
      $project: {
        agents: {
          $filter: {
            input: '$agents',
            as: 'agents',
            cond: { $eq: ['$$agents.removeAt', null] },
          },
        },
        createdAt: '$createdAt',
        updateAt: '$updateAt',
        removeAt: '$removeAt',
      },
    },
  ]);
  return agents;
}
