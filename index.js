require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();
const router = express.Router();

const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { spawn, exec } = require("promisify-child-process");

function loggingMiddleware(req, res, next) {
  console.log("ip:", req.ip);
  next();
}

//ACCEPT JSON AND FORM ENCODED
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//USE CORS
app.use(cors());

//CHECK IP
app.use(loggingMiddleware);

//SIMPLE ROUTE WITHOUT AUTH
app.get("/", (req, res) => {
  res.send("Heyhey!");
});

//GNERATE TOKEN WITH FAKE USER
app.get("/sign", (req, res) => {
  const token = generateToken();
  res.json({ token });
});

// ROUTE THAT call ls with async/await child-process
app.get("/check",  async (req, res) => {
  // spawn
  await do_spawn("ls", ["-al"])
  // exec
  await do_exec("ls -al")
  res.json({ msg: "ok done" });
});

// ROUTE THAT WORK ONLY IF AUTHORIZED
app.get("/private", validateToken,  async (req, res) => {
  // exec
  await do_exec("echo 'ciao' ")
  res.json({ msg: "ok you can pass" });
});

//LISTEN SERVER
app.listen(4000, () => {
  console.log("Listening on 4000");
});

//ADD EXPIRATION TO TOKEN
const jwt_options = {
  expiresIn: "2d"
};
//GET SECRET FROM .ENV
const secret = process.env.JWT_SECRET;
const generateToken = () => {
  //FAKE USER PAYLOAD
  const payload = {
    id: "220979",
    user: "benve",
    email: "benve@gmail.com"
  };
  const token = jwt.sign(payload, secret, jwt_options);
  console.log("token", token);

  return token;
};

//VALIDATION MIDDLEWERE
function validateToken(req, res, next) {
  const authorizationHeaader = req.headers.authorization;
  let result;
  if (authorizationHeaader) {
    const token = req.headers.authorization.split(" ")[1]; // Bearer <token>
    console.log("passed token", token);
    try {
      result = jwt.verify(token, secret, jwt_options);
      console.log("verify result", result);
      req.decoded = result;
      next();
    } catch (err) {
      throw new Error(err);
    }
  } else {
    result = {
      error: `Authentication error. Token required.`,
      status: 401
    };
    res.status(401).send(result);
  }
}


//DO SPAWN
async function do_spawn (cmd, options){
  const { stdout, stderr } = await spawn(cmd, options, { encoding: "utf8" });
  console.log("stdout=", stdout, "stderr=", stderr);
}

//DO EXEC
async function do_exec(cms){
  const { stdout, stderr } = await exec("ls -al");
  console.log("stdout=", stdout, "stderr=", stderr);
}
