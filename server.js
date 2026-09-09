const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 80;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ========== 数据库初始化 ==========
const db = new Database(path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    location_lat REAL NOT NULL,
    location_lng REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    name TEXT NOT NULL,
    course_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(student_id, course_id)
  );

  CREATE TABLE IF NOT EXISTS check_ins (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    location_lat REAL NOT NULL,
    location_lng REAL NOT NULL,
    distance INTEGER NOT NULL,
    status TEXT DEFAULT '正常',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leave_requests (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    date TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT '待审批',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// 创建默认教师账号
const defaultTeacher = db.prepare('SELECT id FROM teachers WHERE name = ?').get('teacher');
if (!defaultTeacher) {
  db.prepare('INSERT INTO teachers (id, name, password) VALUES (?, ?, ?)').run(
    crypto.randomUUID(), 'teacher', '20061026'
  );
  console.log('已创建默认教师账号: teacher / 20061026');
}

// ========== 工具函数 ==========
function genId() { return crypto.randomUUID(); }
function genCode() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }

// ========== 教师 API ==========
app.post('/api/teacher/login', (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: '请填写完整信息' });

  const teacher = db.prepare('SELECT * FROM teachers WHERE name = ? AND password = ?').get(name, password);
  if (!teacher) return res.status(401).json({ error: '姓名或密码错误' });

  res.json({ id: teacher.id, name: teacher.name });
});

app.get('/api/teachers', (req, res) => {
  const teachers = db.prepare('SELECT id, name, created_at FROM teachers ORDER BY created_at DESC').all();
  res.json(teachers);
});

app.post('/api/teachers', (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: '请填写完整信息' });

  const exists = db.prepare('SELECT id FROM teachers WHERE name = ?').get(name);
  if (exists) return res.status(400).json({ error: '教师姓名已存在' });

  const id = genId();
  db.prepare('INSERT INTO teachers (id, name, password) VALUES (?, ?, ?)').run(id, name, password);
  res.json({ id, name });
});

app.delete('/api/teachers/:id', (req, res) => {
  db.prepare('DELETE FROM teachers WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ========== 课程 API ==========
app.get('/api/courses', (req, res) => {
  const { teacher_id } = req.query;
  let courses;
  if (teacher_id) {
    courses = db.prepare('SELECT * FROM courses WHERE teacher_id = ? ORDER BY created_at DESC').all(teacher_id);
  } else {
    courses = db.prepare('SELECT * FROM courses ORDER BY created_at DESC').all();
  }
  res.json(courses);
});

app.get('/api/courses/:code', (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE code = ?').get(req.params.code);
  if (!course) return res.status(404).json({ error: '课程码无效' });
  res.json(course);
});

app.post('/api/courses', (req, res) => {
  const { name, teacher_id, teacher_name, location_lat, location_lng } = req.body;
  if (!name || !teacher_id || !teacher_name) return res.status(400).json({ error: '信息不完整' });

  const id = genId();
  const code = genCode();
  db.prepare('INSERT INTO courses (id, name, code, teacher_id, teacher_name, location_lat, location_lng) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, code, teacher_id, teacher_name, location_lat || 31.2222, location_lng || 121.4581);

  res.json({ id, name, code, teacher_name });
});

app.delete('/api/courses/:id', (req, res) => {
  db.prepare('DELETE FROM check_ins WHERE course_id = ?').run(req.params.id);
  db.prepare('DELETE FROM leave_requests WHERE course_id = ?').run(req.params.id);
  db.prepare('DELETE FROM students WHERE course_id = ?').run(req.params.id);
  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ========== 学生 API ==========
app.get('/api/students', (req, res) => {
  const { course_id } = req.query;
  let students;
  if (course_id) {
    students = db.prepare('SELECT * FROM students WHERE course_id = ? ORDER BY created_at DESC').all(course_id);
  } else {
    students = db.prepare('SELECT * FROM students ORDER BY created_at DESC').all();
  }
  res.json(students);
});

app.post('/api/students/join', (req, res) => {
  const { course_code, student_id, name } = req.body;
  if (!course_code || !student_id || !name) return res.status(400).json({ error: '请填写完整信息' });

  const course = db.prepare('SELECT * FROM courses WHERE code = ?').get(course_code);
  if (!course) return res.status(404).json({ error: '课程码无效' });

  const existing = db.prepare('SELECT * FROM students WHERE student_id = ? AND course_id = ?').get(student_id, course.id);
  if (existing) return res.json({ course, student: existing });

  const id = genId();
  db.prepare('INSERT INTO students (id, student_id, name, course_id) VALUES (?, ?, ?, ?)').run(id, student_id, name, course.id);

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  res.json({ course, student });
});

app.delete('/api/students/:studentId/:courseId', (req, res) => {
  db.prepare('DELETE FROM students WHERE student_id = ? AND course_id = ?').run(req.params.studentId, req.params.courseId);
  res.json({ ok: true });
});

// ========== 签到 API ==========
app.post('/api/checkin', (req, res) => {
  const { student_id, course_id, location_lat, location_lng, distance } = req.body;
  if (!student_id || !course_id) return res.status(400).json({ error: '参数不完整' });

  const today = new Date().toISOString().split('T')[0];
  const existing = db.prepare('SELECT id FROM check_ins WHERE student_id = ? AND course_id = ? AND created_at >= ? AND created_at < ?')
    .get(student_id, course_id, today, today + 'T23:59:59');

  if (existing) return res.status(400).json({ error: '今日已签到' });

  const id = genId();
  db.prepare('INSERT INTO check_ins (id, student_id, course_id, location_lat, location_lng, distance, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, student_id, course_id, location_lat, location_lng, distance, '正常');

  const record = db.prepare('SELECT * FROM check_ins WHERE id = ?').get(id);
  res.json(record);
});

app.get('/api/checkins', (req, res) => {
  const { course_id, student_id } = req.query;
  let checkIns;

  if (course_id) {
    checkIns = db.prepare('SELECT * FROM check_ins WHERE course_id = ? ORDER BY created_at DESC').all(course_id);
    const studentIds = [...new Set(checkIns.map(c => c.student_id))];
    const students = studentIds.length > 0
      ? db.prepare('SELECT * FROM students WHERE course_id = ? AND student_id IN (' + studentIds.map(() => '?').join(',') + ')').all(course_id, ...studentIds)
      : [];
    const studentMap = {};
    students.forEach(s => { studentMap[s.student_id] = s; });
    checkIns = checkIns.map(c => ({ ...c, students: studentMap[c.student_id] || null }));
  } else if (student_id) {
    checkIns = db.prepare('SELECT * FROM check_ins WHERE student_id = ? ORDER BY created_at DESC').all(student_id);
  } else {
    checkIns = db.prepare('SELECT * FROM check_ins ORDER BY created_at DESC').all();
  }

  res.json(checkIns);
});

// ========== 请假 API ==========
app.post('/api/leave', (req, res) => {
  const { student_id, course_id, date, reason } = req.body;
  if (!student_id || !course_id || !date || !reason) return res.status(400).json({ error: '请填写完整信息' });

  const id = genId();
  db.prepare('INSERT INTO leave_requests (id, student_id, course_id, date, reason) VALUES (?, ?, ?, ?, ?)')
    .run(id, student_id, course_id, date, reason);

  const record = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(id);
  res.json(record);
});

app.get('/api/leave', (req, res) => {
  const { course_id, student_id } = req.query;
  let leaves;

  if (course_id) {
    leaves = db.prepare('SELECT * FROM leave_requests WHERE course_id = ? AND status = ? ORDER BY created_at DESC').all(course_id, '待审批');
    const studentIds = [...new Set(leaves.map(l => l.student_id))];
    const students = studentIds.length > 0
      ? db.prepare('SELECT * FROM students WHERE course_id = ? AND student_id IN (' + studentIds.map(() => '?').join(',') + ')').all(course_id, ...studentIds)
      : [];
    const studentMap = {};
    students.forEach(s => { studentMap[s.student_id] = s; });
    leaves = leaves.map(l => ({ ...l, students: studentMap[l.student_id] || null }));
  } else if (student_id) {
    leaves = db.prepare('SELECT * FROM leave_requests WHERE student_id = ? ORDER BY created_at DESC').all(student_id);
  } else {
    leaves = db.prepare('SELECT * FROM leave_requests ORDER BY created_at DESC').all();
  }

  res.json(leaves);
});

app.put('/api/leave/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE leave_requests SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

// ========== 导出 CSV ==========
app.get('/api/export/:courseId', (req, res) => {
  const checkIns = db.prepare('SELECT * FROM check_ins WHERE course_id = ? ORDER BY created_at DESC').all(req.params.courseId);
  const studentIds = [...new Set(checkIns.map(c => c.student_id))];
  const students = studentIds.length > 0
    ? db.prepare('SELECT * FROM students WHERE course_id = ? AND student_id IN (' + studentIds.map(() => '?').join(',') + ')').all(req.params.courseId, ...studentIds)
    : [];
  const studentMap = {};
  students.forEach(s => { studentMap[s.student_id] = s; });

  const header = '\uFEFF姓名,学号,签到时间,距离(米),状态\n';
  const rows = checkIns.map(c => {
    const s = studentMap[c.student_id] || {};
    return `${s.name || ''},${s.student_id || ''},${new Date(c.created_at).toLocaleString('zh-CN')},${c.distance},${c.status}`;
  }).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=checkin_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(header + rows);
});

// ========== 启动 ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`外网访问: http://110.64.73.117`);
  console.log(`默认教师账号: teacher / 20061026`);
});
