const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const bodyParser=require('body-parser')
const mongoose = require("mongoose");
const login = require("./routes/loginRoutes");
const adminActionsRoutes = require("./routes/adminActionsRoutes");
const studentActionsRoutes=require('./routes/studentRoutes')
const teacherActions=require('./routes/teacherRoute')
const getActions=require('./routes/getRoutes')
const completionRoutes=require('./routes/completionRoutes')
const teacherSchedule=require('./routes/teacherSchedulingRoute')

const app = express();

const corsOptions = {
  origin: ["http://localhost:5173", "https://lms-client-3jaz.onrender.com/", "https://lms-frontend-three-jet.vercel.app/"],
  credentials: true
};
app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: "10mb" })); 
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json("Welcome to the School Management System API");
});

// Routes
app.use("/login", login);
app.use("/admin/actions", adminActionsRoutes);
app.use("/teacher/actions", teacherActions)
app.use("/profile", getActions)
app.use("/api", completionRoutes);
app.use('/api/teacher',teacherSchedule );

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_DB)
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
  });

// STarting the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
