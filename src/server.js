import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./app/routes/index.js";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin.js";
import mongoose from "mongoose";
import { envVars } from "./app/config/env.js";
import { connectDB } from "./app/config/db.js";


const app = express();
app.use(express.json());
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


// await connectDB()
// console.log("Connected to DB");
// if (process.env.ENVAIRONMENT == 'development') {
//   const PORT = 5000;
//   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// }
// await seedSuperAdmin()
let server

const startServer = async () => {
  try {
    await mongoose.connect(envVars.DB_URL)
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
