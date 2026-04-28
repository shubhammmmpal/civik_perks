import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import {connectDB} from "./src/db/db.js";
import authRoutes from "./src/routes/auth.route.js";
// const userRoutes = require("./routes/userRoutes");
// const postRoutes = require("./routes/postRoutes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/posts", postRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 