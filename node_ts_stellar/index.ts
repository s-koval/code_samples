import express, {Express, Request, Response} from 'express';
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv';
import db from "./db";
import routes from "./routes";
import errorMiddleware from "./middleware/error";
import {runScheduler} from "./jobs";

dotenv.config();

const PORT = process.env.PORT;

const corsConfig = {
  credentials: true, origin: true
};

const setupMiddleware = (app: Express): void => {
  app.use(helmet())
  app.use(cors(corsConfig));
  app.use(express.json({
    limit: '10MB',
    type:  [
      'application/json',
      'text/plain',
    ],
  }));
  app
    .use((request, response, next) => {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader("Access-Control-Allow-Methods", '*');
      response.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
      next();
    })
};

const setupRoutes = (app: Express) => {
  routes.forEach(([path, router]) => {
    app.use(path, router);
  });
  app.use((req, res, next) => res.sendStatus(404))
  app.use(errorMiddleware);
};

const createServer = (): Express => {
  const app = express();

  setupMiddleware(app);

  setupRoutes(app);

  app.get('/ping', (req: Request, res: Response) => {
    res.send('pong ' + new Date());
  });

  return app;
};


(async () => {
  try {
    console.log('Starting a server...');
    const server = createServer();
    await db.sync();
    server.listen(PORT, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
    })
    runScheduler();
  } catch (err) {
    console.error('Error occurred while starting a server: ', err);
  }
})()



