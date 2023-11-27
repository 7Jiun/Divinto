import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost/divinto');

const cardContentBlockSchema = new mongoose.Schema({
  type: { type: String, enum: ['text', 'image', 'video', 'audio'] },
  content: String,
});

const cardSchema = new mongoose.Schema({
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
cardSchema.index({ tags: 1 });

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
  removeAt: {
    type: Date,
    default: null,
  },
});

const userSchema = new mongoose.Schema({
  provider: String,
  name: String,
  email: String,
  password: String,
  whiteboards: [String],
  agents: [String],
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

const agentSchema = new mongoose.Schema({
  id: String,
  name: String,
  icon: String,
  whiteboardResource: String,
  openAifileId: String,
  instruction: String,
  threads: [String],
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

const threadSchema = new mongoose.Schema({
  openAiThreadId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  messages: [
    {
      speaker: {
        type: String,
        enum: ['agent', 'user'],
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
    },
  ],
  approvements: [
    {
      type: String || null,
      default: null,
    },
  ],
  disapprovements: [
    {
      type: String || null,
      default: null,
    },
  ],
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

const markdownSchema = new mongoose.Schema({
  id: String,
  whiteboardId: String,
  route: String,
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
