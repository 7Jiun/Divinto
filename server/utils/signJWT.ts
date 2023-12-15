import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

const JWT_KEY = process.env.JWT_KEY;
export const EXPIRE_TIME = 60000 * 60;

export interface JwtUserPayload {
  id: Types.ObjectId;
  name: string;
}

export default function signJWT(UserPayload: JwtUserPayload) {
  if (JWT_KEY) {
    return new Promise((resolve, reject) => {
      try {
        const token = jwt.sign(UserPayload, JWT_KEY, { expiresIn: EXPIRE_TIME });
        resolve(token);
      } catch (error) {
        reject(error);
      }
    });
  }
}
