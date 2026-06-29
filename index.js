const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv')
const connectDB = require("./config/connection")

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "local"}`
});

connectDB();

const app = express();
const PORT = process.env.PORT

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRouter = require('./routes/auth')
app.use("/auth", authRouter)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 