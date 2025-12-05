import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./app/routes/index.js";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cors({
    origin: ['https://coffee-mocha-chi.vercel.app']
}))

app.use("/api", router);
app.get("/", (req, res) => {
  res.send("Coffee-Pastry Pairing API is running.");
});



if(process.env.ENVAIRONMENT == 'development'){
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
