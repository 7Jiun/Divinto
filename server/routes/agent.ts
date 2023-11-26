import { Router } from 'express';
import authenticate from '../middleware/authenticateUser.ts';
import * as agentControl from '../controller/agentController.ts';

const router = Router();

router.route('/agent/:whiteboardId').post(authenticate, agentControl.createAgent);

router.route('/agent/:agentId').delete(authenticate, agentControl.deleteAgent);

router.route('/agent/thread/:agentId').post(authenticate, agentControl.createThread);

router.route('/agent/thread/:threadId').get(authenticate, agentControl.getThread);

router.route('/agent/thread/:threadId').put(authenticate, agentControl.updateThreadTitle);

router.route('/agent/thread/:threadId').delete(authenticate, agentControl.deleteThread);

router
  .route('/agent/:agentId/thread/:threadId/message')
  .put(authenticate, agentControl.updateThreadMessage);

router
  .route('/agent/thread/:threadId/approvement')
  .put(authenticate, agentControl.updateThreadApprovement);

router
  .route('/agent/thread/:threadId/approvement')
  .put(authenticate, agentControl.updateThreadDisapprovement);

export default router;
