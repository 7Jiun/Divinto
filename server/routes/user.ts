import { Router } from 'express';
import * as userControl from '../controller/userControl.ts';
const router = Router();

router.route('/user/signup').post(userControl.nativeUserSignUp);

router.route('/user/signin').post(userControl.nativeUserSignIn);

export default router;
