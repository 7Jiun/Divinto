import { ClientSession } from 'mongoose';
import { CardInput, JwtUserPayload } from './shape.ts';
import * as userModel from '../model/userModel.ts';
import * as whiteboardModel from '../model/whiteboardModel.ts';
import * as cardModel from '../model/cardModel.ts';

const onboardingWhiteboardTitle = 'for feature test';

async function createOnboardingCard(whiteboardId: string): Promise<CardInput[]> {
  const templateId = '6580f6a0d8766d6813baf19e';
  const onboardingWhiteboardTemplate = await whiteboardModel.getWhiteboard(templateId);
  const templateCardData = onboardingWhiteboardTemplate.cards.map((card) => {
    let cardContent = '';
    card.content.main.forEach((block) => {
      cardContent += block.content;
    });
    const transferCardInput = {
      title: card.title,
      whiteboardId: whiteboardId,
      position: card.position,
      content: cardContent,
      tags: card.tags,
    };
    return transferCardInput;
  });
  return templateCardData;
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
    if (!onboardingWhiteboard._id) {
      return false;
    }
    const onboardingWhiteboardId = onboardingWhiteboard._id.toString();
    const isAddWhiteboard = await userModel.addWhiteboardInUser(
      user.id.toString(),
      onboardingWhiteboardId,
      session,
    );

    if (!isAddWhiteboard) {
      return false;
    }
    const onboradingCards = await createOnboardingCard(onboardingWhiteboardId);
    console.log(onboradingCards);
    const createOnboardingCardPromises = onboradingCards.map((onboardingCard) => {
      const card = cardModel.createCard(user, onboardingCard, onboardingWhiteboardId, session);
      return card;
    });
    const createdOnboardingCards = await Promise.all(createOnboardingCardPromises);

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
