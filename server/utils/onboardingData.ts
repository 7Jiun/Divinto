import { ClientSession } from 'mongoose';
import { CardInput, JwtUserPayload } from './shape.ts';
import * as userModel from '../model/userModel.ts';
import * as whiteboardModel from '../model/whiteboardModel.ts';
import * as cardModel from '../model/cardModel.ts';

const onboardingWhiteboardTitle = 'onboarding';

function createOnboardingCard(whiteboardId: string): CardInput[] {
  const cardData = [
    {
      title: 'onboarding',
      whiteboardId: whiteboardId,
      position: {
        x: 100,
        y: 150,
      },
      content: '# joewjo',
      tags: [''],
    },
    {
      title: 'onboarding2',
      whiteboardId: whiteboardId,
      position: {
        x: 600,
        y: 150,
      },
      content: '# cool',
      tags: ['cool'],
    },
  ];
  return cardData;
}

export async function createOnboardingData(
  user: JwtUserPayload,
  session: ClientSession,
): Promise<boolean> {
  try {
    const onboardingWhiteboard = await whiteboardModel.createWhiteboard(
      user,
      onboardingWhiteboardTitle,
      session,
    );
    console.log('stage1', onboardingWhiteboard);
    if (!onboardingWhiteboard._id) {
      return false;
    }
    const onboardingWhiteboardId = onboardingWhiteboard._id.toString();
    const isAddWhiteboard = await userModel.addWhiteboardInUser(
      user.id.toString(),
      onboardingWhiteboardId,
      session,
    );
    console.log('stage2', isAddWhiteboard);

    if (!isAddWhiteboard) {
      return false;
    }
    const onboradingCards = createOnboardingCard(onboardingWhiteboardId);
    const createOnboardingCardPromises = onboradingCards.map((onboardingCard) => {
      const card = cardModel.createCard(user, onboardingCard, onboardingWhiteboardId, session);
      return card;
    });
    const createdOnboardingCards = await Promise.all(createOnboardingCardPromises);
    console.log('stage3', createdOnboardingCards);

    const addCardsInOnboardingWhiteboard = createdOnboardingCards.map((card) =>
      whiteboardModel.addWhiteboardCards(card._id, onboardingWhiteboardId, session),
    );
    await Promise.all(addCardsInOnboardingWhiteboard);
    return true;
  } catch (error) {
    console.error(error);
    throw Error('create onboarding data failed');
  }
}
