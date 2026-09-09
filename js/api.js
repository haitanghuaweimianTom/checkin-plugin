const API = '';

// ========== 教师 ==========
export async function teacherLogin(name, password) {
  const res = await fetch(`${API}/api/teacher/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function listTeachers() {
  const res = await fetch(`${API}/api/teachers`);
  return res.json();
}

export async function createTeacher(name, password) {
  const res = await fetch(`${API}/api/teachers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function deleteTeacher(id) {
  await fetch(`${API}/api/teachers/${id}`, { method: 'DELETE' });
}

// ========== 课程 ==========
export async function createCourse(name, teacherId, teacherName, lat, lng) {
  const res = await fetch(`${API}/api/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, teacher_id: teacherId, teacher_name: teacherName, location_lat: lat, location_lng: lng })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function getTeacherCourses(teacherId) {
  const res = await fetch(`${API}/api/courses?teacher_id=${teacherId}`);
  return res.json();
}

export async function getAllCourses() {
  const res = await fetch(`${API}/api/courses`);
  return res.json();
}

export async function getCourseByCode(code) {
  const res = await fetch(`${API}/api/courses/${code}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function deleteCourse(id) {
  await fetch(`${API}/api/courses/${id}`, { method: 'DELETE' });
}

// ========== 学生 ==========
export async function joinCourse(courseCode, studentId, name) {
  const res = await fetch(`${API}/api/students/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_code: courseCode, student_id: studentId, name })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function getCourseStudents(courseId) {
  const res = await fetch(`${API}/api/students?course_id=${courseId}`);
  return res.json();
}

export async function getAllStudents() {
  const res = await fetch(`${API}/api/students`);
  return res.json();
}

export async function deleteStudent(studentId, courseId) {
  await fetch(`${API}/api/students/${studentId}/${courseId}`, { method: 'DELETE' });
}

// ========== 签到 ==========
export async function checkIn(studentId, courseId, lat, lng, distance) {
  const res = await fetch(`${API}/api/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, course_id: courseId, location_lat: lat, location_lng: lng, distance })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function getCourseCheckIns(courseId) {
  const res = await fetch(`${API}/api/checkins?course_id=${courseId}`);
  return res.json();
}

export async function getStudentCheckIns(studentId, courseId) {
  const res = await fetch(`${API}/api/checkins?student_id=${studentId}`);
  const all = res.json();
  return courseId ? (await all).filter(c => c.course_id === courseId) : all;
}

// ========== 请假 ==========
export async function submitLeaveRequest(studentId, courseId, date, reason) {
  const res = await fetch(`${API}/api/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, course_id: courseId, date, reason })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function getPendingLeaves(courseId) {
  const res = await fetch(`${API}/api/leave?course_id=${courseId}`);
  return res.json();
}

export async function getStudentLeaves(studentId) {
  const res = await fetch(`${API}/api/leave?student_id=${studentId}`);
  return res.json();
}

export async function approveLeave(leaveId, status) {
  await fetch(`${API}/api/leave/${leaveId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
}

// ========== 导出 ==========
export function exportCSV(courseId) {
  window.location.href = `${API}/api/export/${courseId}`;
}
