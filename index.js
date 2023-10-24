require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const mongodb = require("mongodb");
const fs = require("fs");
const nodemailer = require("nodemailer");

// Basic Configuration
const port = process.env.PORT || 3000;

// Configuring web application with appropriate middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/css"));

const main = fs.readFileSync(process.cwd() + "/index.html", "utf-8");
const login = fs.readFileSync(process.cwd() + "/login.html", "utf-8");
const signup = fs.readFileSync(process.cwd() + "/signup.html", "utf-8");
const appointment = fs.readFileSync(process.cwd() + "/appointment.html", "utf-8");
const error = fs.readFileSync(process.cwd() + "/error.html", "utf-8");
const booked = fs.readFileSync(process.cwd() + "/booked.html", "utf-8");

process.env.TZ = "Asia/Kolkata";

const MONGOVALUE = process.env.MONGO_URI;

// Connecting with database
mongoose.connect(MONGOVALUE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
});

// Checking if connection occured
const connection = mongoose.connection;
connection.on("error", console.error.bind(console, "connection error:"));
connection.once("open", () => {
  console.log("MongoDB connection established succesfully");
});

// Creating a new Schema with two values
const SignUpSchema = new mongoose.Schema({
  Username: { type: String },
  Email: { type: String },
  Password: { type: String }
});

//Creating a Schema for appointment
const AppointmentSchema = new mongoose.Schema({
  Name: { type: String },
  Email: { type: String },
  Phone: { type: Number },
  Date: { type: String },
  Time: { type: String },
  Subject: { type: String },
  Message: { type: String }
});

// Creating a model
const SignUpModel = mongoose.model("Logins", SignUpSchema);
const AppointmentModel = mongoose.model("Appointments", AppointmentSchema);

// Function which returns current date & time in required format
function returntime() {
  // Getting Date & Time of request
  // current_date_for_comparision & current_time & allow for comparision and checking
  const dateObject = new Date();

  const current_date = ("0" + dateObject.getDate()).slice(-2);
  const current_month = ("0" + (dateObject.getMonth() + 1)).slice(-2);
  const current_year = dateObject.getFullYear();

  const current_date_for_comparision =
    current_year + "-" + current_month + "-" + current_date;

  const current_hours = ("0" + dateObject.getHours()).slice(-2);
  const current_minutes = ("0" + dateObject.getMinutes()).slice(-2);

  const current_time = current_hours + ":" + current_minutes;
  const date_time_array = [current_date_for_comparision, current_time];
  return date_time_array;
}

// Displays the current port
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

//Getting Login Page
app.get("/", function (req, res) {
  res.end(signup.replace('{{%%ERROR-DEF%%}}', ''));
});

app.post("/homepage", async function(req, res) {
  let user = req.body.username;
  let email = req.body.email;
  let pass = req.body.password;
  let con_pass = req.body.confirmpassword;
  let regex = /^(?=.*\d)(?=.*[!@#$%^&*;,@])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  console.log(req.body);
  let SignUpJSONformat = await SignUpModel.findOne({Email: email,});

  if(SignUpJSONformat) {
    res.end(signup.replace('{{%%ERROR-DEF%%}}', 'An ID with the email already exists!'));
  } else if(!(/^[a-zA-Z ]+$/.test(user))) {
    res.end(signup.replace('{{%%ERROR-DEF%%}}', 'Only letters allowed in username'));
  } else if(!(pass === con_pass)) {
    res.end(signup.replace('{{%%ERROR-DEF%%}}', 'Passwords must be same'));
  } else if(!(regex.test(pass))) {
    res.end(signup.replace('{{%%ERROR-DEF%%}}', 'Passwords require 1 uppercase, <br>1 lowercase, 1 special character, 1 digit <br>& a minimum length of 8 characters'));
  } else {
    const SignUpstorage = new SignUpModel({
      Username: user,
      Email: email,
      Password: pass
    });
    SignUpstorage.save();
    res.end(main.replace("{{%%NAME%%}}", user));
    console.log(" " + user + " " + email + " " + pass + " " + con_pass);
  }
});

app.get("/login", function (req, res) {
  res.end(login.replace('{{%%ERROR-DEF%%}}', ''));
});

app.post("/home", async function(req, res) {
  let user = req.body.username;
  let email = req.body.email;
  let pass = req.body.password;
  console.log(req.body);
  let LoginJSONformat = await SignUpModel.findOne({Email: email,});
  console.log(LoginJSONformat);

  if(!(LoginJSONformat)) {
    res.end(login.replace('{{%%ERROR-DEF%%}}', 'Email ID not registered!'));
  } else if(!(LoginJSONformat.Password === pass)) {
    res.end(login.replace('{{%%ERROR-DEF%%}}', 'Wrong Password!'));
  } else {
    res.end(main.replace("{{%%NAME%%}}", LoginJSONformat.Username));
  }
  
});

app.get("/appointment", function(req, res) {
  res.end(appointment.replace("{{%%ERROR-DEF%%}}", ""));
});

app.post("/appointment", async function(req, res) {
  console.log(req.body);
  let user = req.body.username;
  let email = req.body.email;
  let phone = req.body.number;
  let subject = req.body.subject;
  let message = req.body.message;
  let date = req.body.date;
  let time = req.body.time;

  const [current_date, current_time] = returntime();

  if(!(/^[a-zA-Z ]+$/.test(user))) {
    res.end(appointment.replace('{{%%ERROR-DEF%%}}', 'Only letters allowed in username'));
  } else if(phone.length != 10) {
    res.end(appointment.replace('{{%%ERROR-DEF%%}}', 'Phone number must have 10 digits'));
  } else if(date < current_date) {
    res.end(appointment.replace("{{%%ERROR-DEF%%}}", "Input a future Date & Time"));
  } else if(date == current_date && time < current_time) {
    alert("Input a future Date & Time");
  } else {
    const output = `
    <h3>You have a new appointment request</h3>
    <h2>Subject: ${subject}</h2> <br>
    <h2>Contact Details</h2>
    <ul>
      <li>Name: ${user}</li>
      <li>Email: ${email}</li>
      <li>Phone: ${phone}</li>
    </ul>
    <h2>Preffered Timings: </h2>
    <ul>
      <li>Date: ${date} </li>
      <li>Time: ${time} </li>
    </ul>
    <h2>Message</h2>
    <p>${message}</p>
    `;

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
          user: 'carissa18@ethereal.email',
          pass: '1uvwZ1zKCYBY3vSEaf'
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    async function main() {
      const info = await transporter.sendMail({
        from: '"Appointment Request" <carissa18@ethereal.email>', // sender address
        to: "jeeval.shah158@nmims.edu.in", // list of receivers
        subject: "Appointment Request!", // Subject line
        text: "", // plain text body
        html: output, // html body
      });

      console.log("Message sent: %s", info.messageId);
    }
    main().catch(console.error);

    const Appointmentstorage = new AppointmentModel({
      Name: user,
      Email: email,
      Phone: phone,
      Date: date,
      Time: time,
      Subject: subject,
      Message: message
    });

    Appointmentstorage.save();
    console.log("Saved!");
    res.end(booked.replace("{{%%NAME%%}}", user));
  }
});

app.get("/:id", function (req, res) {
  // To create a Page Not Found Error
  const id = req.params.id;
  if (id != "appointment" || id != "login" || id != "") {
    res.end(error)
  }
});