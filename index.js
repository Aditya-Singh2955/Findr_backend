const express = require("express");
const app = express();
const cors = require("cors");

require("dotenv").config();
const PORT = process.env.PORT || 4000;

// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));
app.use(cors({
  origin: "*",
  credentials: false
}));

app.use(express.json());

require("./config/database").connect();

const user = require("./route/User");
const upload = require("./route/upload");
const job = require("./route/job");
const employer = require("./route/employer");
const application = require("./route/application");

app.use(user);
app.use(upload);
app.use(job);
app.use(employer);
app.use(application);
app.listen(PORT, () => {
  console.log(`App is Listening at ${PORT}`);
});
