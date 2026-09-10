const fs = require("fs");
const path = require("path");

const databaseFile = path.join(__dirname, "iqra.db.json");

function createDatabase() {
  if (!fs.existsSync(databaseFile)) {
    const initialDatabase = {
      students: [],
      messages: [],
      teachers: []
    };

    fs.writeFileSync(
      databaseFile,
      JSON.stringify(initialDatabase, null, 2),
      "utf8"
    );
  }
}

function readDatabase() {
  createDatabase();

  try {
    const data = fs.readFileSync(databaseFile, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Database read error:", error);

    return {
      students: [],
      messages: [],
      teachers: []
    };
  }
}

function writeDatabase(data) {
  fs.writeFileSync(
    databaseFile,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

function addStudent(student) {
  const database = readDatabase();

  database.students.push(student);

  writeDatabase(database);

  return student;
}

function getStudents() {
  const database = readDatabase();
  return database.students;
}

function getStudentsByTeacher(teacherName) {
  const database = readDatabase();

  return database.students.filter(
    student => student.teacher === teacherName
  );
}

function getStudentById(studentId) {
  const database = readDatabase();

  return database.students.find(
    student => String(student.id) === String(studentId)
  );
}

function addMessage(message) {
  const database = readDatabase();

  database.messages.push(message);

  writeDatabase(database);

  return message;
}

function getMessages(studentId, teacherName) {
  const database = readDatabase();

  return database.messages.filter(
    message =>
      String(message.studentId) === String(studentId) &&
      message.teacher === teacherName
  );
}

module.exports = {
  createDatabase,
  readDatabase,
  writeDatabase,
  addStudent,
  getStudents,
  getStudentsByTeacher,
  getStudentById,
  addMessage,
  getMessages
};
