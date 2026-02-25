import express from "express";
import { config } from "./config/index.js";
import routes from "./routes/index.js";

const app = express();

app.use(express.json());
app.use("/api", routes);

if (config.nodeEnv !== "test") {
  app.listen(config.port, () => {
    console.log(`Callora backend listening on http://localhost:${config.port}`);
  });
}

export default app;
