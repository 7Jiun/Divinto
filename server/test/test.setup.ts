import mongoose from 'mongoose';
// eslint-disable-next-line import/no-unresolved
import { beforeAll } from 'bun:test';

beforeAll(async () => {
  await mongoose.disconnect();
  await mongoose.connect(
    `mongodb+srv://${process.env.ATLAS_USERNAME}:${process.env.ATLAS_PASSWORD}@divinto-cluster.q51ep5x.mongodb.net/test?retryWrites=true&w=majority`,
  );
});
