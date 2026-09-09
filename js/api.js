import { getSupabase } from './supabase.js';
import { getUser } from './auth.js';

export async function joinCourse(courseCode, studentId, name) {
  const supabase = getSupabase();

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('code', courseCode)
    .single();

  if (courseError || !course) {
    throw new Error('课程码无效');
  }

  const { data: existing } = await supabase
    .from('students')
    .select('*')
    .eq('student_id', studentId)
    .eq('course_id', course.id)
    .single();

  if (existing) {
    return { course, student: existing };
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert({
      student_id: studentId,
      name: name,
      course_id: course.id
    })
    .select()
    .single();

  if (studentError) throw studentError;

  return { course, student };
}

export async function createCourse(name, teacherName, location) {
  const supabase = getSupabase();

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from('courses')
    .insert({
      name: name,
      teacher_name: teacherName,
      code: code,
      location_lat: location.lat,
      location_lng: location.lng
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTeacherCourses(teacherName) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('teacher_name', teacherName)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCourseStudents(courseId) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('course_id', courseId);

  if (error) throw error;
  return data || [];
}

export async function checkIn(studentId, courseId, location) {
  const supabase = getSupabase();

  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('check_ins')
    .select('*')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .gte('created_at', today)
    .lt('created_at', today + 'T23:59:59')
    .maybeSingle();

  if (existing) {
    throw new Error('今日已签到');
  }

  const { data, error } = await supabase
    .from('check_ins')
    .insert({
      student_id: studentId,
      course_id: courseId,
      location_lat: location.lat,
      location_lng: location.lng,
      distance: location.distance,
      status: '正常'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getStudentCheckIns(studentId, courseId) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCourseCheckIns(courseId) {
  const supabase = getSupabase();

  const { data: checkIns, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!checkIns || checkIns.length === 0) return [];

  const studentIds = [...new Set(checkIns.map(ci => ci.student_id))];
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('course_id', courseId)
    .in('student_id', studentIds);

  const studentMap = {};
  (students || []).forEach(s => { studentMap[s.student_id] = s; });

  return checkIns.map(ci => ({
    ...ci,
    students: studentMap[ci.student_id] || null
  }));
}

export async function submitLeaveRequest(studentId, courseId, date, reason) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      student_id: studentId,
      course_id: courseId,
      date: date,
      reason: reason,
      status: '待审批'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPendingLeaves(courseId) {
  const supabase = getSupabase();

  const { data: leaves, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('course_id', courseId)
    .eq('status', '待审批')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!leaves || leaves.length === 0) return [];

  const studentIds = [...new Set(leaves.map(l => l.student_id))];
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('course_id', courseId)
    .in('student_id', studentIds);

  const studentMap = {};
  (students || []).forEach(s => { studentMap[s.student_id] = s; });

  return leaves.map(l => ({
    ...l,
    students: studentMap[l.student_id] || null
  }));
}

export async function approveLeave(leaveId, status) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('leave_requests')
    .update({ status: status })
    .eq('id', leaveId);

  if (error) throw error;
}

export async function exportCheckInsCSV(courseId) {
  const checkIns = await getCourseCheckIns(courseId);

  const headers = ['姓名', '学号', '签到时间', '距离(米)', '状态'];
  const rows = checkIns.map(ci => [
    ci.students?.name || '',
    ci.students?.student_id || '',
    new Date(ci.created_at).toLocaleString('zh-CN'),
    ci.distance,
    ci.status
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `签到记录_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function subscribeToCheckIns(courseId, callback) {
  const supabase = getSupabase();

  return supabase
    .channel(`check_ins:${courseId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'check_ins',
      filter: `course_id=eq.${courseId}`
    }, callback)
    .subscribe();
}

// ========== 教师管理（通过 GoTrue Admin API）==========

const ADMIN_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbWVzeG5oYWVrZG9ub2lwbXh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODgzNzkyNCwiZXhwIjoyMTA0NDEzOTI0fQ.zVM6AUfGupR2HttauVjyvMXuGxSiq-iofrXHRThTS_o';
const SUPABASE_URL = 'https://samesxnhaekdonoipmxv.supabase.co';

export async function createTeacher(name, password) {
  const email = `teacher_${name}@checkin.local`;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': ADMIN_KEY,
      'Authorization': `Bearer ${ADMIN_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      password: password,
      app_metadata: { role: 'teacher' },
      user_metadata: { name: name }
    })
  });

  const data = await res.json();
  if (data.id) return { id: data.id, name };
  throw new Error(data.msg || data.message || '创建教师失败');
}

export async function listTeachers() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      'apikey': ADMIN_KEY,
      'Authorization': `Bearer ${ADMIN_KEY}`
    }
  });

  const data = await res.json();
  return (data.users || [])
    .filter(u => u.app_metadata?.role === 'teacher')
    .map(u => ({
      id: u.id,
      name: u.user_metadata?.name || u.email,
      email: u.email,
      created_at: u.created_at
    }));
}

export async function deleteTeacher(userId) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'apikey': ADMIN_KEY,
      'Authorization': `Bearer ${ADMIN_KEY}`
    }
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.msg || '删除失败');
  }
}

export async function getAllStudents() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteStudent(studentId, courseId) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('student_id', studentId)
    .eq('course_id', courseId);

  if (error) throw error;
}

export async function getAllCourses() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteCourse(courseId) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) throw error;
}
