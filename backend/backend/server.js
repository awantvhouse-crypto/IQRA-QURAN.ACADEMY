require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  createDatabase,
  addStudent,
  getStudentsByTeacher,
  getStudentById,
  addMessage,
  getMessages
} = require("./database");

const app = express();

const PORT = process.env.PORT || 5000;
const JWT_SECRET =
  process.env.JWT_SECRET || "change-this-secret";

/* =========================================
   MIDDLEWARE
========================================= */

app.use(cors());
app.use(express.json());

/* =========================================
   CREATE DATABASE
========================================= */

createDatabase();

/* =========================================
   TEACHERS
========================================= */

const teachers = {
  "Abdullah Shahzad": {
    displayName: "Hafiz Abdullah Shahzad",
    information: "Quran Teacher | Hifz, Nazra & Tajweed",
    password: "qwerty12345"
  },

  "Zain Ilyas": {
    displayName: "Hafiz Zain Ilyas",
    information: "Quran Teacher | Hifz, Nazra & Tajweed",
    password: "ssd42"
  },

  "Hafiz Musa": {
    displayName: "Hafiz Musa",
    information: "Quran Teacher | Quran Learning Programs",
    password: "musa123"
  }
};

/* =========================================
   AUTH MIDDLEWARE
========================================= */

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization token required."
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Invalid authorization token."
    });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);

    req.user = user;

    next();

  } catch (error) {

    return res.status(403).json({
      success: false,
      message: "Session expired or invalid."
    });

  }
}

/* =========================================
   HOME / TEST API
========================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Iqra Quran Academy Backend is running."
  });
});

/* =========================================
   TEACHER LOGIN
========================================= */

app.post("/api/login", async (req, res) => {
  try {

    const { teacher, password } = req.body;

    if (!teacher || !password) {
      return res.status(400).json({
        success: false,
        message: "Teacher and password are required."
      });
    }

    const teacherData = teachers[teacher];

    if (!teacherData) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized teacher."
      });
    }

    const passwordMatch =
      password === teacherData.password;

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password."
      });
    }

    const token = jwt.sign(
      {
        teacher: teacher
      },
      JWT_SECRET,
      {
        expiresIn: "30m"
      }
    );

    res.json({
      success: true,
      message: "Login successful.",
      token: token,
      teacher: {
        name: teacher,
        displayName: teacherData.displayName,
        information: teacherData.information
      }
    });

  } catch (error) {

    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error."
    });

  }
});

/* =========================================
   REGISTER STUDENT
========================================= */

app.post("/api/students", (req, res) => {
  try {

    const {
      name,
      father,
      age,
      school,
      country,
      address,
      phone,
      course,
      price,
      teacher
    } = req.body;

    if (
      !name ||
      !father ||
      !age ||
      !phone ||
      !course ||
      !teacher
    ) {
      return res.status(400).json({
        success: false,
        message: "Required student information is missing."
      });
    }

    if (!teachers[teacher]) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher selected."
      });
    }

    const student = {
      id:
        Date.now().toString() +
        Math.random().toString(36).slice(2, 8),

      name,
      father,
      age,
      school: school || "",
      country: country || "",
      address: address || "",
      phone,
      course,
      price: price || "",
      teacher,

      createdAt: new Date().toISOString()
    };

    addStudent(student);

    res.status(201).json({
      success: true,
      message: "Student registered successfully.",
      student
    });

  } catch (error) {

    console.error("Student registration error:", error);

    res.status(500).json({
      success: false,
      message: "Could not register student."
    });

  }
});

/* =========================================
   GET TEACHER STUDENTS
========================================= */

app.get(
  "/api/teacher/students",
  authenticateToken,
  (req, res) => {

    try {

      const teacherName =
        req.user.teacher;

      const students =
        getStudentsByTeacher(teacherName);

      res.json({
        success: true,
        teacher: teacherName,
        students
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Could not load students."
      });

    }

  }
);

/* =========================================
   GET SINGLE STUDENT
========================================= */

app.get(
  "/api/students/:id",
  authenticateToken,
  (req, res) => {

    try {

      const student =
        getStudentById(req.params.id);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found."
        });
      }

      if (
        student.teacher !==
        req.user.teacher
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to view this student."
        });
      }

      res.json({
        success: true,
        student
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: "Could not load student."
      });

    }

  }
);

/* =========================================
   SEND MESSAGE
========================================= */

app.post(
  "/api/messages",
  authenticateToken,
  (req, res) => {

    try {

      const {
        studentId,
        text
      } = req.body;

      if (!studentId || !text) {
        return res.status(400).json({
          success: false,
          message:
            "Student ID and message are required."
        });
      }

      const student =
        getStudentById(studentId);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found."
        });
      }

      if (
        student.teacher !==
        req.user.teacher
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot message this student."
        });
      }

      const message = {
        id:
          Date.now().toString() +
          Math.random().toString(36).slice(2, 8),

        studentId,
        teacher: req.user.teacher,
        sender: req.user.teacher,
        text: String(text).trim(),

        createdAt:
          new Date().toISOString()
      };

      addMessage(message);

      res.status(201).json({
        success: true,
        message
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Could not send message."
      });

    }

  }
);

/* =========================================
   GET MESSAGES
========================================= */

app.get(
  "/api/messages/:studentId",
  authenticateToken,
  (req, res) => {

    try {

      const student =
        getStudentById(req.params.studentId);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found."
        });
      }

      if (
        student.teacher !==
        req.user.teacher
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot view these messages."
        });
      }

      const messages =
        getMessages(
          req.params.studentId,
          req.user.teacher
        );

      res.json({
        success: true,
        messages
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: "Could not load messages."
      });

    }

  }
);

/* =========================================
   START SERVER
========================================= */

app.listen(PORT, () => {

  console.log(
    `Iqra Quran Academy backend running on port ${PORT}`
  );

});
