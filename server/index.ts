import express from 'express';
import cardRouter from './routes/card.ts';
import userRoute from './routes/user.ts';
import swaggerRouter from './utils/apiDocs.ts';
import whiteboardRouter from './routes/whiteboard.ts';
import markdownRouter from './routes/markdown.ts';
import agentRouter from './routes/agent.ts';
import cors from 'cors';
import path from 'path';

const app = express();
const port = 3000;
const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('uploads'));
app.use(express.static('public/dist'));

app.use(swaggerRouter);
app.use(userRoute);
app.use(cardRouter);
app.use(whiteboardRouter);
app.use(markdownRouter);
app.use(agentRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`STYLiSH listening on port ${port}`);
});
