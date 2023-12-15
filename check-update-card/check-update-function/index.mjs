/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
import mongoose from 'mongoose';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const secret_name = 'divinto-mongo-uri';

const client = new SecretsManagerClient({
  region: 'ap-northeast-1',
});

const sqsClient = new SQSClient({ region: 'ap-northeast-1' });

function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份是從 0 開始的
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function sendToSQS(messageBody, queueUrl) {
  const params = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(messageBody),
    MessageGroupId: `${Date.now().toString()}`,
  };

  try {
    const data = await sqsClient.send(new SendMessageCommand(params));
    console.log('Success', data);
    return data;
  } catch (err) {
    console.error('Error', err);
    throw err;
  }
}

let response;

try {
  response = await client.send(
    new GetSecretValueCommand({
      SecretId: secret_name,
      VersionStage: 'AWSCURRENT', // VersionStage defaults to AWSCURRENT if unspecified
    }),
  );
} catch (error) {
  console.error(error);
  throw error;
}

const secretObject = JSON.parse(response.SecretString);
const secret = secretObject.MONGODB_URI;
const cardContentBlockSchema = new mongoose.Schema({
  type: { type: String, enum: ['text', 'image', 'video', 'audio'] },
  content: String,
});
const CardSchema = new mongoose.Schema({
  id: String,
  title: String,
  position: {
    x: Number,
    y: Number,
  },
  content: {
    main: [cardContentBlockSchema],
    summary: String || null,
    approvement: String || null,
    disapprovement: String || null,
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
  updateAt: {
    type: Date,
    default: () => Date.now(),
  },
  removeAt: {
    type: Date,
    default: null,
  },
});
const Card = mongoose.model('Card', CardSchema);

let cachedDb = null;

async function connectToDatabase(uri) {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  cachedDb = await mongoose.connect(uri);
  return cachedDb;
}

export async function handler(event) {
  try {
    await connectToDatabase(secret);
    const cards = await Card.find();
    if (!cards) return { statusCode: 404, body: 'No cards found' };
    const queueUrl =
      'https://sqs.ap-northeast-1.amazonaws.com/057571201923/divinto-autoBackup.fifo';
    const currentTime = new Date();
    let updateCards = [];
    let sendPromises = [];

    for (const card of cards) {
      if (card.removeAt) continue;
      const cardUpdateTime = new Date(card.updateAt);
      const oneDayAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
      if (cardUpdateTime > oneDayAgo) {
        const cardId = card._id.toString();
        updateCards.push(cardId);
        sendPromises.push(sendToSQS({ cardId: cardId }, queueUrl));
      }
    }

    await Promise.all(sendPromises);

    return {
      statusCode: 200,
      body: JSON.stringify(updateCards),
    };
  } catch (error) {
    console.error('Error during card check:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
}
