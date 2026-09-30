const KEY = 'evidencija-namaza-v1';

export const grades = [1, 2, 3, 4];
export const prayers = [
  { id: 'sabah', label: 'Sabah' }, { id: 'podne', label: 'Podne' },
  { id: 'ikindija', label: 'Ikindija' }, { id: 'aksam', label: 'Akšam' }, { id: 'jacija', label: 'Jacija' }
];
export const statuses = [
  { id: 'P', label: 'Prisutan', className: 'present' }, { id: 'N', label: 'Nije prisutan', className: 'absent' },
  { id: 'B', label: 'Bolestan', className: 'sick' }, { id: 'K', label: 'Kući', className: 'home' }
];

const seed = () => ({
  activeYear: currentSchoolYear(),
  years: [currentSchoolYear()],
  students: [
    ['Ahmed Ahmedović', 1], ['Haris Karić', 1], ['Mustafa Alić', 1], ['Lejla Hadžić', 1],
    ['Fatima Smajić', 2], ['Omer Kovačević', 2], ['Emina Bašić', 2], ['Yusuf Mujić', 2],
    ['Amina Džafić', 3], ['Kerim Mehić', 3], ['Hana Šabić', 3], ['Tarik Imamović', 3],
    ['Merjem Halilović', 4], ['Amar Husić', 4], ['Ajša Jusić', 4], ['Hamza Selimović', 4]
  ].map(([name, grade], i) => ({ id: `seed-${i + 1}`, name, grade, year: currentSchoolYear(), active: true })),
  records: []
});

export function currentSchoolYear(date = new Date()) {
  const year = date.getFullYear();
  const start = date.getMonth() >= 8 ? year : year - 1;
  return `${start}/${String(start + 1).slice(-2)}`;
}
export function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { return seed(); }
}
export function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }
export function formatDate(date) { return new Intl.DateTimeFormat('bs-BA', { dateStyle: 'long' }).format(new Date(`${date}T12:00:00`)); }
export function today() { return new Date().toISOString().slice(0, 10); }
export function studentsFor(data, year, grade) { return data.students.filter(s => s.year === year && s.grade === grade && s.active).sort((a,b) => a.name.localeCompare(b.name, 'bs')); }
export function getRecord(data, date, studentId) { return data.records.find(r => r.date === date && r.studentId === studentId) || null; }
export function setStatus(data, date, studentId, prayer, status) {
  let record = getRecord(data, date, studentId);
  if (!record) { record = { date, studentId, statuses: {} }; data.records.push(record); }
  record.statuses[prayer] = status; save(data);
}
export function advanceYear(data) {
  const old = data.activeYear; const [start] = old.split('/').map(Number); const next = `${start + 1}/${String(start + 2).slice(-2)}`;
  data.students.forEach(s => { if (s.year === old && s.active) { s.active = false; if (s.grade < 4) data.students.push({ ...s, id: crypto.randomUUID(), grade: s.grade + 1, year: next, active: true }); } });
  data.activeYear = next; if (!data.years.includes(next)) data.years.push(next); save(data); return next;
}
