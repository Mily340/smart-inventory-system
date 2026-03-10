import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { globalErrorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Inventory Backend API Running",
  });
});

app.use("/api/v1", routes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;