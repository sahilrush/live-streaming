import express from "express";
import cors from "cors";
import helmet from "helmet";
import { LivekitRouter } from "./routes/livekit-routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

app.use("/api", LivekitRouter);

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`error the server is running on part ${PORT}`);
});
