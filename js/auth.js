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
