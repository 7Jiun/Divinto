import { JwtUserPayload } from '../utils/signJWT.ts';
import { User } from './schema.ts';

interface CheckedUser {
  userPayload: JwtUserPayload | null;
  isVerified: Boolean;
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
