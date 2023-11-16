import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  id: String,
  title: String,
  position: {
    x: Number,
    y: Number,
  },
  content: {
    main: String,
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
});

const whiteboardSchema = new mongoose.Schema({
  id: String,
  title: String,
  cards: [String],
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
  updateAt: {
    type: Date,
    default: () => Date.now(),
  },
});

const userSchema = new mongoose.Schema({
  provider: String,
  name: String,
  email: String,
  password: String,
  whiteboards: [String],
  dialogues: [String],
  agents: [String],
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
  updateAt: {
    type: Date,
    default: () => Date.now(),
  },
});

const agentSchema = new mongoose.Schema({
  id: String,
  name: String,
  icon: String,
  whiteboardResource: String,
  configures: Object,
  threads: [String],
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
  updateAt: {
    type: Date,
    default: () => Date.now(),
  },
});

const threadSchema = new mongoose.Schema({
  id: String,
  title: String,
  content: [
    {
      speaker: {
        type: String,
        enum: ['agent', 'user'],
      },
      text: String,
    },
  ],
  approvement: String || null,
  disapprovement: String || null,
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
  updateAt: {
    type: Date,
    default: () => Date.now(),
  },
});

const markdownSchema = new mongoose.Schema({
  id: String,
  title: String,
  content: String,
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

export const Card = mongoose.model('Card', cardSchema);
export const Whiteboard = mongoose.model('Whiteboard', whiteboardSchema);
export const User = mongoose.model('User', userSchema);
export const Agent = mongoose.model('Agent', agentSchema);
export const Thread = mongoose.model('Thread', threadSchema);
export const Markdown = mongoose.model('Markdown', markdownSchema);
