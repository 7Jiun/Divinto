import express from 'express';
import cardRouter from './routes/card.ts';
import swaggerRouter from './utils/apiDocs.ts';
import whiteboardRouter from './routes/whiteboard.ts';
import markdownRouter from './routes/markdown.ts';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('uploads'));

app.use(swaggerRouter);
app.use(cardRouter);
app.use(whiteboardRouter);
app.use(markdownRouter);

app.listen(port, () => {
  console.log(`STYLiSH listening on port ${port}`);
});
