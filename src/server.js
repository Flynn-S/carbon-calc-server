import express from "express";
import listEndpoints from "express-list-endpoints";
import cors from "cors";

// ROUTE IMPORTS
import calcRoutes from "./calculator/index.js";

// ERROR HANDLING
import {
  badRequestErrorHandler,
  notFoundErrorHandler,
  forbiddenErrorHandler,
  catchAllErrorHandler,
} from "./errorHandling.js";

const server = express();

// port usually from .env variables
const PORT = process.env.PORT || 5000;

const loggerMiddleware = (req, res, next) => {
  console.log(`Request method: ${req.method} ${req.url} -- ${new Date()}`);
  next();
};

server.use(cors());
server.use(express.json());
server.use(loggerMiddleware);

// ROUTES;
server.use("/calculator", calcRoutes);

//ERROR MIDDLEWARES (AFTER ROUTES)
server.use(badRequestErrorHandler);
server.use(notFoundErrorHandler);
server.use(forbiddenErrorHandler);
server.use(catchAllErrorHandler);

console.log(listEndpoints(server));
server.listen(PORT, "0.0.0.0", () => {
  if (import.meta.env.PROD) {
    console.log(`Server running on cloud on port: ${PORT}`);
  } else {
    console.log(`Server running locally on port: ${PORT}`);
  }
});
