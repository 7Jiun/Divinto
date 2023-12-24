// eslint-disable-next-line import/no-unresolved
import { test, expect, describe } from 'bun:test';
import { getCardById, classifyContent } from '../model/cardModel.ts';
import { BlockTypeEnum } from '../utils/shape.ts';
import mongoose from 'mongoose';

describe('classifyCardContent', () => {
  test('content with image', () => {
    const mockCardContent = `# 聯繫
  
          我收到了一封遠方朋友的信。
          他在信中提到了我們過去共同度過的時光，以及他對我們友誼的珍惜。
          看到他在國外很開心，也很開心他還記得我。
          有些默契就是這樣，平常不怎麼提，但是時候到了，互相還是記得那份情。
          
          ![maple.png](https://d3dw5mf8d1p6ix.cloudfront.net/6580f6a0d8766d6813baf19e/65815b6fd8766d6813bb0626/maple.png)`;
    const classifiedContent = classifyContent(mockCardContent);
    const assertedClassfiedContent = [
      {
        type: BlockTypeEnum.Text,
        content:
          '# 聯繫\n  \n          我收到了一封遠方朋友的信。\n          他在信中提到了我們過去共同度過的時光，以及他對我們友誼的珍惜。\n          看到他在國外很開心，也很開心他還記得我。\n          有些默契就是這樣，平常不怎麼提，但是時候到了，互相還是記得那份情。\n          ',
      },
      {
        type: BlockTypeEnum.Image,
        content:
          '          ![maple.png](https://d3dw5mf8d1p6ix.cloudfront.net/6580f6a0d8766d6813baf19e/65815b6fd8766d6813bb0626/maple.png)',
      },
    ];
    expect(classifiedContent).toEqual(assertedClassfiedContent);
  });
});

describe('getCardFromMongo', () => {
  test('with correct Id', async () => {
    const testId = '655dcd0b3a8d31a6d8792008';
    const getCard = await getCardById(testId);
    const testCard = {
      whiteboardId: null,
      _id: getCard._id.toString(),
      id: getCard.id,
      title: getCard.title,
      position: {
        x: getCard.position.x,
        y: getCard.position.y,
      },
      content: {
        main: [
          {
            type: getCard.content.main[0].type,
            content: getCard.content.main[0].content,
            _id: new mongoose.Types.ObjectId('65646ecb6167a80c333d2686'),
          },
        ],
        summary: null,
        approvement: null,
        disapprovement: null,
      },
      tags: getCard.tags.map((tag) => tag),
      createdAt: new Date(getCard.createdAt),
      updateAt: new Date(getCard.updateAt),
      removeAt: getCard.removeAt ? new Date(getCard.removeAt) : null,
    };
    const assertedCard = {
      whiteboardId: null,
      _id: '655dcd0b3a8d31a6d8792008',
      id: '22-1700646155895-671',
      title: '# a wonderful new card',
      position: {
        x: 797.6287344964885,
        y: 352.7651995647894,
      },
      content: {
        main: [
          {
            type: BlockTypeEnum.Text,
            content: '# a wonderful new card',
            _id: new mongoose.Types.ObjectId('65646ecb6167a80c333d2686'),
          },
        ],
        summary: null,
        approvement: null,
        disapprovement: null,
      },
      tags: ['excited'],
      createdAt: new Date('2023-11-22T09:42:35.898Z'),
      updateAt: new Date('2023-11-27T10:26:19.871Z'),
      removeAt: new Date('2023-11-27T10:26:19.900Z'),
    };
    expect(testCard).toEqual(assertedCard);
  });
  test('with incorrect Id', async () => {
    const testId = '655dcd0b3a8d31a6d8792002';
    const getCard = await getCardById(testId);
    const testIncorrectCard = getCard ? getCard : false;
    expect(testIncorrectCard).toEqual(false);
  });
});

describe('getCard api test', () => {
  test('request with cardId and valid authorization token', async () => {
    const testCardId = '655ec0822a102c4f70d49eff';
    const assertApiCard = {
      position: {
        x: 150,
        y: 200,
      },
      content: {
        main: [
          {
            type: BlockTypeEnum.Text,
            content: 'createTest',
            _id: '655ec0822a102c4f70d49f00',
          },
        ],
      },
      _id: '655ec0822a102c4f70d49eff',
      id: '655e0df9527fee5af99a8b7a-1700708482066-406',
      title: 'createTest2',
      tags: ['exciting'],
      removeAt: null,
      createdAt: '2023-11-23T03:01:22.077Z',
      updateAt: '2023-11-23T03:01:22.078Z',
      __v: 0,
    };
    const response = await fetch(`http://localhost:3000/api/card/${testCardId}`, {
      headers: {
        method: 'GET',
        authorization:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1Nzk3ZDg5NzdjMmNiMTdhMzE0YmU1MSIsIm5hbWUiOiJkZW1vIiwiaWF0IjoxNzAzMzQ2NjYwLCJleHAiOjE3MDY5NDY2NjB9.8dANrjKq9LNG5IU69R93B3p0w9Jt92IjiKzPWBZb7JI',
      },
    });
    const statusCode = response.status;
    const data = await response.json();
    expect(statusCode).toEqual(200);
    expect(data).toEqual(assertApiCard);
  });
  test('with remove card Id and correct request setup', async () => {
    const testCardId = '655dcd0b3a8d31a6d8792008';
    const response = await fetch(`http://localhost:3000/api/card/${testCardId}`, {
      headers: {
        method: 'GET',
        authorization:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1Nzk3ZDg5NzdjMmNiMTdhMzE0YmU1MSIsIm5hbWUiOiJkZW1vIiwiaWF0IjoxNzAzMzQ2NjYwLCJleHAiOjE3MDY5NDY2NjB9.8dANrjKq9LNG5IU69R93B3p0w9Jt92IjiKzPWBZb7JI',
      },
    });
    const statusCode = response.status;
    const data = await response.json();
    expect(statusCode).toEqual(400);
    expect(data).toEqual({ data: 'card is removed' });
  });
  test('request with invalid authorized token', async () => {
    const testCardId = '655dcd0b3a8d31a6d8792008';
    const response = await fetch(`http://localhost:3000/api/card/${testCardId}`, {
      headers: {
        method: 'GET',
        authorization:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eNiMTdhMzE0YmU1MSIsIm5hbWUiOiJkZW1vIiwiaWF0IjoxNzAzMzQ2NjYwLCJleHAiOjE3MDY5NDY2NjB9.8dANrjKq9LNG5IU69R93B3p0w9Jt92IjiKzPWBZb7JI',
      },
    });
    const statusCode = response.status;
    expect(statusCode).toEqual(401);
  });
});
