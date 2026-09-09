const STORAGE_KEY = 'checkin_app_user';

export function getUser() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

export function setUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isLoggedIn() {
  return getUser() !== null;
}

export function isTeacher() {
  const user = getUser();
  return user && user.role === 'teacher';
}

export function isStudent() {
  const user = getUser();
  return user && user.role === 'student';
}

export function teacherLogin(name, password) {
  return new Promise(async (resolve, reject) => {
    try {
      const { getSupabase } = await import('./supabase.js');
      const supabase = getSupabase();

      const email = `teacher_${name}@checkin.local`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        reject(new Error('姓名或密码错误'));
        return;
      }

      setUser({
        role: 'teacher',
        name: name,
        auth_id: data.user.id
      });
      resolve(data);
    } catch (e) {
      reject(new Error('登录失败: ' + e.message));
    }
  });
}

export function teacherLogout() {
  return new Promise(async (resolve) => {
    try {
      const { getSupabase } = await import('./supabase.js');
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch (e) {}
    clearUser();
    resolve();
  });
}

export function studentLogin(studentId, name) {
  setUser({
    role: 'student',
    student_id: studentId,
    name: name
  });
}
