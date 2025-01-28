import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js";

// Load environment variables

dotenv.config({
  path: "./env"
});
const PORT = process.env.PORT || 5000;
// Connect to MongoDB

connectDB()
 .then(() => {
  app.listen(PORT, ()=>{
    console.log(`Server running on port http://localhost:${PORT}`);
    console.log("MongoDB Connected...");
  })
  })
  .catch((err) => {console.log('Error connecting to MongoDB', err);});
