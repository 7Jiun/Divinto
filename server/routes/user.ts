import { Router } from 'express';
import * as userControl from '../controller/userControl.ts';
import authenticate from '../middleware/authenticateUser.ts';
const router = Router();

router.route('/user/signup').post(userControl.nativeUserSignUp);

router.route('/user/signin').post(userControl.nativeUserSignIn);

router.route('/user/profile').get(authenticate, userControl.getUserProfile);

export default router;
