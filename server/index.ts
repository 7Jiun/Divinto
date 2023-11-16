import figlet from 'figlet';
import express from 'express';
import cardRouter from './routes/card';
import swaggerRouter from './utils/apiDocs';
import whiteboardRouter from './routes/whiteboard';

const app = express();
const port = 3000;

app.use(express.json());

app.use(swaggerRouter);
app.use(cardRouter);
app.use(whiteboardRouter);

app.listen(port, () => {
  console.log(`STYLiSH listening on port ${port}`);
});
