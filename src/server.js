import express from "express";
import cors from "cors";
import { router } from "./app/routes/index.js";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin.js";
import mongoose from "mongoose";
import { envVars } from "./app/config/env.js";

import cookieParser from "cookie-parser";


const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      'https://real-estate-punta.vercel.app',
      'http://localhost:3000'
    ],
    credentials: true,
  })
);

app.use("/api", router);

app.get("/", (req, res) => {
  res.send("Server is running.");
});


let server

const startServer = async () => {
  try {
    await mongoose.connect(envVars.DB_URL, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    })
    console.log('Connected to DB')

    server = app.listen(process.env.PORT, () => {
      console.log(`Server is listening to port ${process.env.PORT}`)
    })
  } catch (err) {
    console.log(err)
  }
}

(async () => {
  await startServer()
  seedSuperAdmin()
})()
export default app;
