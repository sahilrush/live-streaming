import express from "express";
import cors from "cors";
import helmet from "helmet";
import { LivekitRouter } from "./routes/livekit-routes";
import { AuthRouter } from "./routes/auth-routes";
import { SessionRoute } from "./routes/session-routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

app.use("/api", AuthRouter);
app.use("/api", LivekitRouter);
app.use("/api", SessionRoute);

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`error the server is running on part ${PORT}`);
});
