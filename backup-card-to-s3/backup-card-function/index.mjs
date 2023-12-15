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
import { SQSClient, ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const secret_name = 'divinto-mongo-uri';
const REGION = 'ap-northeast-1';

const client = new SecretsManagerClient({
  region: REGION,
});

let response;

try {
  response = await client.send(
    new GetSecretValueCommand({
      SecretId: secret_name,
      VersionStage: 'AWSCURRENT',
    }),
  );
} catch (error) {
  console.error(error);
  throw error;
}

const secretObject = JSON.parse(response.SecretString);
const secret = secretObject.MONGODB_URI;

const sqsClient = new SQSClient({ region: REGION });

const s3Client = new S3Client({ region: REGION });

async function recieveSQS(queueUrl) {
  const params = {
    MaxNumberOfMessages: 10,
    QueueUrl: queueUrl,
    WaitTimeSeconds: 5,
    MessageAttributes: ['All'],
    VisibilityTimeout: 10,
  };

  try {
    const data = await sqsClient.send(new ReceiveMessageCommand(params));
    if (data.Messages) {
      return data.Messages.map((message) => {
        const messageBody = JSON.parse(message.Body);
        return { body: messageBody, receiptHandle: message.ReceiptHandle };
      });
    } else {
      console.log('No messages to process');
      return [];
    }
  } catch (err) {
    console.error('Error', err);
    throw err;
  }
}

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

async function transferCardMarkdown(card) {
  const mainContent = card.content.main;
  let markdown = '';
  mainContent.forEach((block) => {
    if (block.type === 'text') {
      markdown += block.content;
      markdown += '\n\n';
    } else if (block.type === 'image') {
      const imageContent = block.content;
      const folderDirs = imageContent.split('/');
      const username = folderDirs[1];
      const whiteboardId = folderDirs[2];
      const updatedImageContent = imageContent.replace(
        `/${username}/${whiteboardId}/${card._id}/assets/`,
        '/assets/',
      );
      markdown += updatedImageContent;
      markdown += '\n\n';
    }
  });

  return markdown;
}

async function uploadMarkdownToS3(bucketName, cardTitle, markdown) {
  try {
    const objectKey = `${cardTitle}.md`;
    const putParams = {
      Bucket: bucketName,
      Key: objectKey,
      Body: markdown,
      ContentType: 'text/markdown',
    };
    await s3Client.send(new PutObjectCommand(putParams));
    return objectKey;
  } catch (error) {
    console.error('Error processing card:', error);
    throw error;
  }
}

async function getCardAndTransferAndUploadCard(cardId, bucketName) {
  try {
    const cardData = await Card.findById(cardId);
    const markdown = await transferCardMarkdown(cardData);
    const result = await uploadMarkdownToS3(bucketName, cardData.title, markdown);
    return result;
  } catch (error) {
    console.error('error: ', error);
    return error;
  }
}

export async function handler(event) {
  try {
    await connectToDatabase(secret);
    const queueUrl =
      'https://sqs.ap-northeast-1.amazonaws.com/057571201923/divinto-autoBackup.fifo';
    const cardData = await recieveSQS(queueUrl);
    const bucketName = 'divinto';
    let getcardPromises = [];
    const cardIds = cardData.map((card) => {
      const cardId = card.body.cardId;
      getcardPromises.push(getCardAndTransferAndUploadCard(cardId, bucketName));
    });

    await Promise.all(getcardPromises);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: cardIds,
      }),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      message: JSON.stringify({ error: err }),
    };
  }
}
