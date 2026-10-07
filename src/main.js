import { grades, prayers, statuses, load, save, today, formatDate, studentsFor, getRecord, setStatus, advanceYear } from './store.js';
const data = load();

let route = {
  page: 'home'
};

/* =========================================================
   POČETNO PODEŠAVANJE
   ========================================================= */

const BACKGROUND_IMAGE = './medresa.jpg';

function applyBackground() {
  document.body.style.backgroundImage =
  'url("/src/medresa.jpg?v=2")';

  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center center';
  document.body.style.backgroundAttachment = 'fixed';
  document.body.style.backgroundRepeat = 'no-repeat';
  document.body.style.minHeight = '100vh';
}

/* =========================================================
   POMOĆNE FUNKCIJE
   ========================================================= */

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getPrayer(id) {
  return prayers.find(p => p.id === id);
}

function getStudent(id) {
  return data.students.find(s => s.id === id);
}

function getActiveStudents(year = data.activeYear, grade = null) {
  let list = data.students.filter(
    s => s.year === year && s.active
  );

  if (grade !== null) {
    list = list.filter(
      s => Number(s.grade) === Number(grade)
    );
  }

  return list.sort((a, b) =>
    a.name.localeCompare(b.name, 'bs')
  );
}

function setRoute(page, params = {}) {
  route = {
    page,
    ...params
  };

  render();
}

/* =========================================================
   DATUM
   ========================================================= */

function formatToday() {
  const d = new Date();

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}.${month}.${year}.`;
}

function formatInputDate(date) {
  if (!date) return '';

  const parts = date.split('-');

  if (parts.length !== 3) return date;

  return `${parts[2]}.${parts[1]}.${parts[0]}.`;
}

/* =========================================================
   GLAVNI LAYOUT
   ========================================================= */

function layout(content) {
  return `
    <div class="app-shell">

      <header class="topbar">

        <div class="brand">

          <div class="brand-title">
            EVIDENCIJA ZA PRISUSTVO NA NAMAZIMA
          </div>

          <div class="school-year-title">
            ŠKOLSKA GODINA ${data.activeYear}
          </div>

        </div>

        <nav class="main-nav">

          <button
            data-page="home"
            class="${route.page === 'home' ? 'active' : ''}">
            POČETNA
          </button>

          <button
            data-page="records"
            class="${[
              'records',
              'monthly',
              'studentSearch',
              'daily',
              'studentDay'
            ].includes(route.page) ? 'active' : ''}">
            EVIDENCIJA
          </button>

          <button
            data-page="students"
            class="${[
              'students',
              'studentList',
              'history'
            ].includes(route.page) ? 'active' : ''}">
            UČENICI
          </button>

          <button
            data-page="settings"
            class="${route.page === 'settings' ? 'active' : ''}">
            POSTAVKE
          </button>

        </nav>

      </header>

      <main class="app-main">
        ${content}
      </main>

          <div class="medresa-caption">
        Karađoz-begova medresa Mostar
      </div>

<img
  src="/src/grb.png"
  alt="Grb Karađoz-begove medrese"
  style="display:block; width:80px; height:80px; object-fit:contain; margin:6px auto 0;"
>    </div>
  `;
}

/* =========================================================
   RENDER
   ========================================================= */

function render() {

  let content = '';

  try {

    switch (route.page) {

      case 'home':
        content = home();
        break;

      case 'prayerGrades':
        content = prayerGrades();
        break;

      case 'rollcall':
        content = rollcall();
        break;

      case 'summary':
        content = summary();
        break;

      case 'records':
        content = records();
        break;

      case 'monthly':
        content = monthly();
        break;

      case 'studentSearch':
        content = studentSearch();
        break;

      case 'daily':
        content = daily();
        break;

      case 'studentDay':
        content = studentDay();
        break;

      case 'students':
        content = students();
        break;

      case 'studentList':
        content = studentList();
        break;

      case 'history':
        content = history();
        break;

      case 'settings':
        content = settings();
        break;

      default:
        content = home();
    }

  } catch (error) {

    console.error(error);

    content = `
      <div class="empty-state">
        <h2>Došlo je do greške</h2>
        <p>${esc(error.message)}</p>

        <button
          class="secondary-button"
          data-action="home">
          POČETNA
        </button>
      </div>
    `;
  }

  document.getElementById('app').innerHTML =
    layout(content);

  bindEvents();

  applyBackground();
}

/* =========================================================
   POČETNA
   ========================================================= */

function home() {
  return `
    <section class="welcome">

      <div class="welcome-date">
        <strong>${formatToday()}</strong>
      </div>

      <div class="section-intro">
        Odaberite namaz za koji želite evidentirati prisustvo.
      </div>

      <div class="prayer-home-grid">

        ${prayers.map(prayer => `
          <button
            class="prayer-home-button"
            data-prayer="${prayer.id}">
            ${esc(prayer.label).toUpperCase()}
          </button>
        `).join('')}

      </div>

    </section>
  `;
}

/* =========================================================
   IZBOR RAZREDA
   ========================================================= */

function prayerGrades() {

  const prayer = getPrayer(route.prayer);

  if (!prayer) {
    setRoute('home');
    return '';
  }

  return `
    <section class="page-head">

      <button
        class="back-button"
        data-action="home">
        ← POČETNA
      </button>

      <h1>${esc(prayer.label)}</h1>

      <div class="today-line">
        ${formatInputDate(route.date || today())}
      </div>

    </section>

    <section class="grade-section">

      <h2>Odaberite razred</h2>

      <div class="grade-grid">

        ${grades.map(grade => {

          const count =
            studentsFor(
              data,
              data.activeYear,
              grade
            ).length;

          return `
            <button
              class="grade-button"
              data-grade="${grade}">

              <strong>${grade}. RAZRED</strong>

              <span>
                ${count} učenika
              </span>

            </button>
          `;

        }).join('')}

      </div>

    </section>
  `;
}

/* =========================================================
   EVIDENCIJA UČENIKA
   ========================================================= */

function rollcall() {

  const prayer = getPrayer(route.prayer);

  const students = getActiveStudents(
    data.activeYear,
    route.grade
  );

  if (!prayer || !students.length) {

    return `
      <section class="empty-state">

        <h2>Nema učenika</h2>

        <p>
          U ovom razredu trenutno nema aktivnih učenika.
        </p>

        <button
          class="secondary-button"
          data-action="backPrayerGrades">
          ← NAZAD
        </button>

      </section>
    `;
  }

  const index = Math.min(
    Number(route.index || 0),
    students.length - 1
  );

  const student = students[index];

  const record = getRecord(
    data,
    route.date || today(),
    student.id
  );

  const currentStatus =
    record?.statuses?.[route.prayer] || '';

  const progress =
    `${index + 1}/${students.length}`;

  const percent =
    ((index + 1) / students.length) * 100;

  return `
    <section class="rollcall-page">

      <div class="rollcall-head">

        <button
          class="back-button"
          data-action="backPrayerGrades">
          ← RAZREDI
        </button>

        <div>

          <div class="rollcall-prayer">
            ${esc(prayer.label)}
          </div>

          <h1>
            ${route.grade}. RAZRED
          </h1>

          <div class="today-line">
            ${formatInputDate(route.date || today())}
          </div>

        </div>

        <div class="progress-box">
          ${progress}
        </div>

      </div>

      <div class="progress-bar">
        <div style="width:${percent}%"></div>
      </div>

      <section class="student-card">

        <div class="student-number">
          UČENIK ${index + 1}
        </div>

        <h2>
          ${esc(student.name)}
        </h2>

        <div class="save-info">
          ${
            currentStatus
              ? 'Sačuvano ✓'
              : 'Odaberite status'
          }
        </div>

        <div class="status-grid">

          ${statuses.map(status => `

            <button
              class="status-button ${status.className}
                ${currentStatus === status.id ? 'selected' : ''}"
              data-status="${status.id}">

              <strong>${status.id}</strong>

              <span>
                ${esc(status.label)}
              </span>

            </button>

          `).join('')}

        </div>

      </section>

      <div class="rollcall-nav">

        <button
          class="secondary-button"
          data-action="previousStudent"
          ${index === 0 ? 'disabled' : ''}>
          ← PRETHODNI
        </button>

        <button
          class="secondary-button"
          data-action="nextStudent"
          ${index === students.length - 1 ? 'disabled' : ''}>
          SLJEDEĆI →
        </button>

      </div>

      <div class="rollcall-summary">

        ${students.map((s, i) => {

          const r = getRecord(
            data,
            route.date || today(),
            s.id
          );

          const st =
            r?.statuses?.[route.prayer] || '';

          return `
            <button
              class="mini-student
                ${i === index ? 'current' : ''}"
              data-student-index="${i}">

              <span>${i + 1}</span>

              <strong>
                ${esc(s.name)}
              </strong>

              <b>${st || '—'}</b>

            </button>
          `;

        }).join('')}

      </div>

    </section>
  `;
}

/* =========================================================
   SAŽETAK RAZREDA
   ========================================================= */

function summary() {

  const prayer = getPrayer(route.prayer);

  const students = getActiveStudents(
    data.activeYear,
    route.grade
  );

  const date =
    route.date || today();

  const counts = {
    P: 0,
    N: 0,
    B: 0,
    K: 0
  };

  students.forEach(student => {

    const record = getRecord(
      data,
      date,
      student.id
    );

    const status =
      record?.statuses?.[route.prayer];

    if (
      status &&
      counts[status] !== undefined
    ) {
      counts[status]++;
    }

  });

  return `
    <section class="page-head">

      <button
        class="back-button"
        data-action="backPrayerGrades">
        ← RAZREDI
      </button>

      <h1>
        SAŽETAK · ${esc(prayer?.label || '')}
      </h1>

      <div class="today-line">
        ${route.grade}. razred ·
        ${formatInputDate(date)}
      </div>

    </section>

    <section class="summary-card">

      <div class="summary-counts">

        <div class="summary-item present">
          <strong>${counts.P}</strong>
          <span>Prisutan</span>
        </div>

        <div class="summary-item absent">
          <strong>${counts.N}</strong>
          <span>Nije prisutan</span>
        </div>

        <div class="summary-item sick">
          <strong>${counts.B}</strong>
          <span>Bolestan</span>
        </div>

        <div class="summary-item home">
          <strong>${counts.K}</strong>
          <span>Kući</span>
        </div>

      </div>

      <div class="summary-actions">

        <button
          class="primary-button"
          data-action="nextGrade">
          SLJEDEĆI RAZRED →
        </button>

        <button
          class="secondary-button"
          data-action="home">
          POČETNA
        </button>

      </div>

    </section>
  `;
}

/* =========================================================
   UČENICI – IZBOR RAZREDA
   ========================================================= */

function students() {

  return `
    <section class="page-head">

      <h1>UČENICI</h1>

      <div class="today-line">
        Školska godina ${esc(data.activeYear)}
      </div>

    </section>

    <section class="grade-section">

      <div class="grade-grid">

        ${grades.map(grade => {

          const count =
            getActiveStudents(
              data.activeYear,
              grade
            ).length;

          return `
            <button
              class="grade-button"
              data-students-grade="${grade}">

              <strong>
                ${grade}. RAZRED
              </strong>

              <span>
                ${count} učenika
              </span>

            </button>
          `;

        }).join('')}

      </div>

    </section>
  `;
}

/* =========================================================
   LISTA UČENIKA
   ========================================================= */

function studentList() {

  const grade =
    Number(route.grade);

  const students =
    getActiveStudents(
      data.activeYear,
      grade
    );
      return `
    <section class="page-head">

      <button
        class="back-button"
        data-action="students">
        ← UČENICI
      </button>

      <h1>
        ${grade}. RAZRED
      </h1>

      <div class="today-line">
        ${students.length} učenika
      </div>

    </section>

    <section class="section-toolbar">

      <button
        class="primary-button"
        data-action="addStudent">
        + DODAJ UČENIKA
      </button>

    </section>

    <section class="student-list">

      ${
        students.length
          ? students.map((student, index) => `

            <div class="student-row">

              <div class="student-number">
                ${index + 1}.
              </div>

              <button
                class="table-student-button"
                data-history="${student.id}">
                ${esc(student.name)}
              </button>

              <div class="student-actions">

                <button
                  class="small-button"
                  data-edit-student="${student.id}">
                  UREDI
                </button>

                <button
                  class="small-button danger"
                  data-remove-student="${student.id}">
                  OBRIŠI
                </button>

              </div>

            </div>

          `).join('')

          : `
            <div class="empty-state">
              Nema učenika u ovom razredu.
            </div>
          `
      }

    </section>
  `;
}

/* =========================================================
   DODAVANJE UČENIKA
   ========================================================= */

function addStudent() {

  const name =
    prompt(
      'Unesite ime i prezime učenika:'
    );

  if (!name || !name.trim()) return;

  data.students.push({
    id: crypto.randomUUID(),
    name: name.trim(),
    grade: Number(route.grade),
    year: data.activeYear,
    active: true
  });

  save(data);

  render();
}

/* =========================================================
   UREĐIVANJE UČENIKA
   ========================================================= */

function editStudent(studentId) {

  const student =
    getStudent(studentId);

  if (!student) return;

  const name =
    prompt(
      'Ime i prezime učenika:',
      student.name
    );

  if (!name || !name.trim()) return;

  student.name =
    name.trim();

  save(data);

  render();
}

/* =========================================================
   BRISANJE UČENIKA
   ========================================================= */

function removeStudent(studentId) {

  const student =
    getStudent(studentId);

  if (!student) return;

  const confirmed =
    confirm(
      `Da li želite obrisati učenika "${student.name}" iz aktivne liste?`
    );

  if (!confirmed) return;

  student.active = false;

  save(data);

  render();
}

/* =========================================================
   HISTORIJA UČENIKA
   ========================================================= */

function history() {

  const student =
    getStudent(route.studentId);

  if (!student) {
    setRoute('students');
    return '';
  }

  const records =
    data.records
      .filter(
        r => r.studentId === student.id
      )
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date)
      );

  const totals = {
    P: 0,
    N: 0,
    B: 0,
    K: 0
  };

  records.forEach(record => {

    Object.values(
      record.statuses || {}
    ).forEach(status => {

      if (totals[status] !== undefined) {
        totals[status]++;
      }

    });

  });

  return `
    <section class="page-head">

      <button
        class="back-button"
        data-action="backStudentList">
        ← UČENICI
      </button>

      <h1>
        ${esc(student.name)}
      </h1>

      <div class="today-line">
        ${student.grade}. razred ·
        ${esc(student.year)}
      </div>

    </section>

    <section class="summary-card">

      <div class="summary-counts">

        <div class="summary-item present">
          <strong>${totals.P}</strong>
          <span>Prisutan</span>
        </div>

        <div class="summary-item absent">
          <strong>${totals.N}</strong>
          <span>Nije prisutan</span>
        </div>

        <div class="summary-item sick">
          <strong>${totals.B}</strong>
          <span>Bolestan</span>
        </div>

        <div class="summary-item home">
          <strong>${totals.K}</strong>
          <span>Kući</span>
        </div>

      </div>

    </section>

    <section class="history-section">

      <h2>Historija</h2>

      ${
        records.length
          ? `
            <div class="history-table-wrapper">

              <table class="history-table">

                <thead>
                  <tr>
                    <th>Datum</th>

                    ${prayers.map(p =>
                      `<th>${esc(p.label)}</th>`
                    ).join('')}

                  </tr>
                </thead>

                <tbody>

                  ${records.map(record => `

                    <tr>

                      <td>
                        ${formatInputDate(record.date)}
                      </td>

                      ${prayers.map(prayer => {

                        const status =
                          record.statuses?.[prayer.id] || '—';

                        return `
                          <td>
                            <strong>${status}</strong>
                          </td>
                        `;

                      }).join('')}

                    </tr>

                  `).join('')}

                </tbody>

              </table>

            </div>
          `
          : `
            <div class="empty-state">
              Za ovog učenika još nema evidentiranih podataka.
            </div>
          `
      }

    </section>
  `;
}

/* =========================================================
   EVIDENCIJA – GLAVNI MENI
   ========================================================= */

function records() {

  return `
    <section class="page-head">

      <h1>EVIDENCIJA</h1>

      <div class="today-line">
        Pregled i pretraga prisustva učenika
      </div>

    </section>

    <section class="records-menu">

      <button
        class="records-menu-button"
        data-action="monthly">

        <strong>
          MJESEČNA EVIDENCIJA
        </strong>

        <span>
          Pregled cijelog razreda po datumima i namazima
        </span>

      </button>

      <button
        class="records-menu-button"
        data-action="studentSearch">

        <strong>
          PRETRAGA UČENIKA
        </strong>

        <span>
          Pronađite jednog učenika i pregledajte njegovu evidenciju
        </span>

      </button>

      <button
        class="records-menu-button"
        data-action="daily">

        <strong>
          DNEVNA EVIDENCIJA
        </strong>

        <span>
          Pregled svih učenika za određeni dan
        </span>

      </button>

    </section>
  `;
}

/* =========================================================
   MJESEČNA EVIDENCIJA
   ========================================================= */

function monthly() {

  const month =
    route.month ||
    String(new Date().getMonth() + 1).padStart(2, '0');

  const year =
    route.year ||
    new Date().getFullYear();

  const grade =
    Number(route.grade || 1);

  const selectedPrayers =
    route.selectedPrayers ||
    prayers.map(p => p.id);

  const problematicOnly =
    route.problematicOnly || false;

  const students =
    getActiveStudents(
      data.activeYear,
      grade
    );

  const dates =
    getMonthDates(
      Number(year),
      Number(month)
    );

  const visibleStudents =
    problematicOnly
      ? students.filter(student =>
          studentHasProblem(
            student,
            dates,
            selectedPrayers
          )
        )
      : students;

  return `
    <section class="page-head">

      <button
        class="back-button"
        data-action="records">
        ← EVIDENCIJA
      </button>

      <h1>
        MJESEČNA EVIDENCIJA
      </h1>

      <div class="today-line">
        ${grade}. razred ·
        ${String(month).padStart(2, '0')}.${year}.
      </div>

    </section>

    <section class="monthly-controls">

      <div class="filter-row">

        <label>
          Mjesec

          <input
            id="monthly-month"
            type="month"
            value="${year}-${String(month).padStart(2, '0')}">
        </label>

        <div class="custom-dropdown">

          <div class="custom-dropdown-label">
            Razred
          </div>

          <button
            type="button"
            class="custom-dropdown-button"
            data-dropdown="monthly-grade">

            ${grade}. razred

            <span class="dropdown-arrow">
              ▼
            </span>

          </button>

          <div
            class="custom-dropdown-menu"
            data-menu="monthly-grade">

            ${[1, 2, 3, 4].map(g => `
              <button
                type="button"
                class="${g === grade ? 'selected' : ''}"
                data-monthly-grade-choice="${g}">

                ${g}. razred

              </button>
            `).join('')}

          </div>

        </div>

      </div>

      <div class="prayer-selector">

        <div class="filter-title">
          Namazi
        </div>

        <div class="prayer-checkboxes">

          ${prayers.map(prayer => `

            <label class="prayer-check">

              <input
                type="checkbox"
                value="${prayer.id}"
                ${selectedPrayers.includes(prayer.id)
                  ? 'checked'
                  : ''}>

              <span>
                ${esc(prayer.label)}
              </span>

            </label>

          `).join('')}

        </div>

        <label class="problem-filter">

          <input
            id="problematic-only"
            type="checkbox"
            ${problematicOnly ? 'checked' : ''}>

          Samo učenici sa problemima / izostancima

        </label>

        <div class="evidence-actions">

  <button
    class="primary-button"
    data-action="applyMonthly">
    PRIKAŽI EVIDENCIJU
  </button>

  <button
    class="secondary-button"
    data-action="exportExcel">
    IZVEZI U EXCEL
  </button>

  <button
    class="secondary-button"
    data-action="print">
    ŠTAMPAJ
  </button>

</div>

      </div>

    </section>

    <section class="monthly-summary">

      <strong>
        ${visibleStudents.length}
      </strong>

      učenika ·

      <strong>
        ${selectedPrayers.length}
      </strong>

      odabranih namaza

    </section>

    <section class="monthly-table-wrapper">

      <table class="monthly-table">

        <thead>

          <tr>

            <th class="student-column">
              UČENIK
            </th>

            ${dates.map(date => `

              <th>

                ${getDayNumber(date)}

                <small>
                  ${getWeekday(date)}
                </small>

              </th>

            `).join('')}

          </tr>

        </thead>

        <tbody>

          ${
            visibleStudents.length

              ? visibleStudents.map(student => `

                <tr>

                  <td class="student-column">

                    <button
                      class="table-student-button"
                      data-history="${student.id}">

                      ${esc(student.name)}

                    </button>

                  </td>

                  ${dates.map(date =>
                    renderMonthlyCell(
                      student,
                      date,
                      selectedPrayers
                    )
                  ).join('')}

                </tr>

              `).join('')

              : `

                <tr>

                  <td
                    colspan="${dates.length + 1}"
                    class="empty-table">

                    Nema podataka za prikaz.

                  </td>

                </tr>

              `
          }

        </tbody>

      </table>

    </section>
  `;
}
/* =========================================================
   EXCEL IZVOZ - MJESEČNA EVIDENCIJA
   ========================================================= */

function excelColumnName(number) {
  let result = '';

  while (number > 0) {
    const remainder = (number - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    number = Math.floor((number - 1) / 26);
  }

  return result;
}

function xmlEscape(value) {
  return String(value ?? '')
    // XML 1.0 ne dozvoljava ove kontrolne znakove.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function crc32(bytes) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;

    for (let i = 0; i < 8; i++) {
      crc =
        (crc >>> 1) ^
        ((crc & 1) ? 0xedb88320 : 0);
    }
  }

  return (~crc) >>> 0;
}

function createXlsxZip(files) {

  const encoder = new TextEncoder();

  const parts = [];
  const centralDirectory = [];

  let offset = 0;

  function u16(value) {
    return [
      value & 0xff,
      (value >>> 8) & 0xff
    ];
  }

  function u32(value) {
    return [
      value & 0xff,
      (value >>> 8) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 24) & 0xff
    ];
  }

  for (const [fileName, content] of files) {

    const nameBytes =
      encoder.encode(fileName);

    const contentBytes =
      encoder.encode(content);

    const crc =
      crc32(contentBytes);

    /*
     * LOCAL FILE HEADER
     */

    const localHeader = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04,

      // version needed
      20, 0,

      // general purpose flags
      0, 0,

      // compression method = STORE
      0, 0,

      // modification time
      0, 0,

      // modification date
      0, 0,

      // CRC32
      ...u32(crc),

      // compressed size
      ...u32(contentBytes.length),

      // uncompressed size
      ...u32(contentBytes.length),

      // file name length
      ...u16(nameBytes.length),

      // extra field length
      0, 0,

      // file name
      ...nameBytes,

      // file content
      ...contentBytes
    ]);

    parts.push(localHeader);

    /*
     * CENTRAL DIRECTORY HEADER
     */

    const centralHeader = new Uint8Array([
      0x50, 0x4b, 0x01, 0x02,

      // version made by
      20, 0,

      // version needed
      20, 0,

      // flags
      0, 0,

      // compression = STORE
      0, 0,

      // modification time
      0, 0,

      // modification date
      0, 0,

      // CRC32
      ...u32(crc),

      // compressed size
      ...u32(contentBytes.length),

      // uncompressed size
      ...u32(contentBytes.length),

      // file name length
      ...u16(nameBytes.length),

      // extra field length
      0, 0,

      // comment length
      0, 0,

      // disk number
      0, 0,

      // internal attributes
      0, 0,

      // external attributes
      0, 0, 0, 0,

      // local header offset
      ...u32(offset),

      // file name
      ...nameBytes
    ]);

    centralDirectory.push(
      centralHeader
    );

    offset +=
      localHeader.length;
  }

  const centralSize =
    centralDirectory.reduce(
      (total, item) =>
        total + item.length,
      0
    );

  /*
   * END OF CENTRAL DIRECTORY
   */

  const endRecord = new Uint8Array([
    0x50, 0x4b, 0x05, 0x06,

    // number of this disk
    0, 0,

    // disk where central directory starts
    0, 0,

    // number of entries on this disk
    ...u16(files.length),

    // total number of entries
    ...u16(files.length),

    // size of central directory
    ...u32(centralSize),

    // offset of central directory
    ...u32(offset),

    // comment length
    0, 0
  ]);

  return new Blob(
    [
      ...parts,
      ...centralDirectory,
      endRecord
    ],
    {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  );
}
function exportMonthlyExcel() {

  const month =
    route.month ||
    String(new Date().getMonth() + 1).padStart(2, '0');

  const year =
    route.year ||
    new Date().getFullYear();

  const grade =
    Number(route.grade || 1);

  const selectedPrayers =
    route.selectedPrayers ||
    prayers.map(p => p.id);

  const problematicOnly =
    route.problematicOnly || false;

  const students =
    getActiveStudents(
      data.activeYear,
      grade
    );

  const dates =
    getMonthDates(
      Number(year),
      Number(month)
    );

  const visibleStudents =
    problematicOnly
      ? students.filter(student =>
          studentHasProblem(
            student,
            dates,
            selectedPrayers
          )
        )
      : students;

  const prayerNames =
    selectedPrayers.map(id =>
      prayers.find(p => p.id === id)?.label || id
    );

  const rows = [];

  // Zaglavlje
  rows.push([
    'UČENIK',
    ...dates.map(date => {
      const day = getDayNumber(date);

      return prayerNames.length === 1
        ? `${day}`
        : `${day}`;
    })
  ]);

  // Učenici
  for (const student of visibleStudents) {

    const row = [student.name];

    for (const date of dates) {

      const record =
        getRecord(
          data,
          date,
          student.id
        );

      const values =
        selectedPrayers.map(
          prayerId =>
            record?.statuses?.[prayerId] || '—'
        );

      row.push(
        values.join(' / ')
      );
    }

    rows.push(row);
  }

  const worksheetRows =
    rows.map((row, rowIndex) => {

      const cells =
        row.map((value, columnIndex) => {

          const cell =
            `${excelColumnName(columnIndex + 1)}${rowIndex + 1}`;

          return `
            <c
              r="${cell}"
              t="inlineStr">
              <is>
                <t>${xmlEscape(value)}</t>
              </is>
            </c>
          `;
        }).join('');

      return `
        <row r="${rowIndex + 1}">
          ${cells}
        </row>
      `;
    }).join('');

  const sheetXml = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet
  xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${worksheetRows}
  </sheetData>
</worksheet>
`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8"?>
<workbook
  xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet
      name="Evidencija"
      sheetId="1"
      r:id="rId1"/>
  </sheets>
</workbook>
`;
const relationshipsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships
  xmlns="http://schemas.openxmlformats.org/package/2006/relationships">

  <Relationship
    Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
    Target="worksheets/sheet1.xml"/>

</Relationships>
`;

const rootRelationshipsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships
  xmlns="http://schemas.openxmlformats.org/package/2006/relationships">

  <Relationship
    Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="xl/workbook.xml"/>

</Relationships>
`;

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?><Types
  xmlns="http://schemas.openxmlformats.org/package/2006/content-types">

  <Default
    Extension="rels"
    ContentType="application/vnd.openxmlformats-package.relationships+xml"/>

  <Default
    Extension="xml"
    ContentType="application/xml"/>

  <Override
    PartName="/xl/workbook.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>

  <Override
    PartName="/xl/worksheets/sheet1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>

</Types>
`;

  const files = [
    [
      '[Content_Types].xml',
      contentTypesXml
    ],
    [
      '_rels/.rels',
      rootRelationshipsXml
    ],
    [
      'xl/workbook.xml',
      workbookXml
    ],
    [
      'xl/_rels/workbook.xml.rels',
      relationshipsXml
    ],
    [
      'xl/worksheets/sheet1.xml',
      sheetXml
    ]
  ];

  const blob =
    createXlsxZip(files);

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement('a');

  link.href = url;

  link.download =
    `evidencija-${year}-${String(month).padStart(2, '0')}-${grade}-razred.xlsx`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
/* =========================================================
   DATUMI MJESECA
   ========================================================= */

function getMonthDates(year, month) {

  const dates = [];

  const lastDay =
    new Date(year, month, 0).getDate();

  for (
    let day = 1;
    day <= lastDay;
    day++
  ) {

    dates.push(
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    );

  }

  return dates;
}

function getDayNumber(date) {

  return Number(
    date.split('-')[2]
  );
}

function getWeekday(date) {

  const d =
    new Date(`${date}T12:00:00`);

  return new Intl.DateTimeFormat(
    'bs-BA',
    { weekday: 'short' }
  ).format(d);
}

/* =========================================================
   ĆELIJA MJESEČNE EVIDENCIJE
   ========================================================= */

function renderMonthlyCell(
  student,
  date,
  selectedPrayers
) {

  const record =
    getRecord(
      data,
      date,
      student.id
    );

  const values =
    selectedPrayers.map(
      prayerId =>
        record?.statuses?.[prayerId] || ''
    );

  const hasAny =
    values.some(Boolean);

  const problem =
    values.some(v =>
      ['N', 'B', 'K'].includes(v)
    );

  const text =
    values.length === 1
      ? (values[0] || '—')
      : values.map(
          v => v || '·'
        ).join(' ');

  return `
    <td
      class="
        monthly-cell
        ${hasAny ? 'filled' : ''}
        ${problem ? 'problem' : ''}
      "
      data-student-day="${student.id}|${date}">

      <button
        class="monthly-cell-button"
        data-student-day="${student.id}|${date}">

        ${esc(text)}

      </button>

    </td>
  `;
}

/* =========================================================
   PROBLEM UČENIK
   ========================================================= */

function studentHasProblem(
  student,
  dates,
  selectedPrayers
) {

  return dates.some(date => {

    const record =
      getRecord(
        data,
        date,
        student.id
      );

    if (!record) return false;

    return selectedPrayers.some(
      prayer =>
        ['N', 'B', 'K'].includes(
          record.statuses?.[prayer]
        )
    );

  });
}

/* =========================================================
   PRETRAGA UČENIKA
   ========================================================= */

function studentSearch() {

  const query =
    route.query || '';

  const students =
    getActiveStudents(
      data.activeYear
    );

  const filtered =
    students.filter(student =>
      student.name
        .toLocaleLowerCase('bs')
        .includes(
          query.toLocaleLowerCase('bs')
        )
    );

  return `
    <section class="page-head">

      <button
        class="back-button"
        data-action="records">
        ← EVIDENCIJA
      </button>

      <h1>
        PRETRAGA UČENIKA
      </h1>

      <div class="today-line">
        Pronađite učenika
      </div>

    </section>

    <section class="student-search-box">

      <input
        id="student-search-input"
        type="search"
        placeholder="Unesite ime ili prezime..."
        value="${esc(query)}"
        autocomplete="off">

      <div class="search-results">

        ${
          query && filtered.length

            ? filtered.map(student => `

              <button
                class="search-student"
                data-history="${student.id}">

                <strong>
                  ${esc(student.name)}
                </strong>

                <span>
                  ${student.grade}. razred
                </span>

              </button>

            `).join('')

            : query

              ? `
                <div class="empty-state">
                  Nema pronađenih učenika.
                </div>
              `

              : `
                <div class="empty-state">
                  Unesite ime učenika za pretragu.
                </div>
              `
        }

      </div>

    </section>
  `;
}
/* =========================================================
   DNEVNA EVIDENCIJA
   ========================================================= */

function daily() {

  const date =
    route.date || today();

  const grade =
    Number(route.grade || 1);

  const prayer =
    route.prayer || prayers[0].id;

  const students =
    getActiveStudents(
      data.activeYear,
      grade
    );

  return `
    <section class="page-head">

      <button
        class="back-button"
        data-action="records">
        ← EVIDENCIJA
      </button>

      <h1>
        DNEVNA EVIDENCIJA
      </h1>

      <div class="today-line">
        Pregled za ${formatInputDate(date)}
      </div>

    </section>

    <section class="daily-controls">

      <div class="daily-filter-row">

        <label class="daily-filter">

          <span>
            Datum
          </span>

          <input
            id="daily-date"
            type="date"
            value="${date}">

        </label>

        <div class="daily-dropdown">

          <div class="daily-dropdown-label">
            Razred
          </div>

          <button
            type="button"
            class="daily-dropdown-button"
            data-dropdown="daily-grade">

            ${grade}. razred

            <span class="dropdown-arrow">
              ▼
            </span>

          </button>

          <div
            class="daily-dropdown-menu"
            data-menu="daily-grade">

            ${[1, 2, 3, 4].map(g => `

              <button
                type="button"
                class="${grade === g ? 'selected' : ''}"
                data-daily-grade-choice="${g}">

                ${g}. razred

              </button>

            `).join('')}

          </div>

        </div>

        <div class="daily-dropdown">

          <div class="daily-dropdown-label">
            Namaz
          </div>

          <button
            type="button"
            class="daily-dropdown-button"
            data-dropdown="daily-prayer">

            ${esc(
              prayers.find(
                p => p.id === prayer
              )?.label || 'Sabah'
            )}

            <span class="dropdown-arrow">
              ▼
            </span>

          </button>

          <div
            class="daily-dropdown-menu"
            data-menu="daily-prayer">

            ${prayers.map(p => `

              <button
                type="button"
                class="${prayer === p.id ? 'selected' : ''}"
                data-daily-prayer-choice="${p.id}">

                ${esc(p.label)}

              </button>

            `).join('')}

          </div>

        </div>

      </div>

    </section>

    <section class="daily-table-wrapper">

      <table class="daily-table">

        <thead>

          <tr>
            <th>#</th>
            <th>UČENIK</th>
            <th>STATUS</th>
            <th>IZMJENA</th>
          </tr>

        </thead>

        <tbody>

          ${
            students.length

              ? students.map((student, index) => {

                  const record =
                    getRecord(
                      data,
                      date,
                      student.id
                    );

                  const status =
                    record?.statuses?.[prayer] || '—';

                  return `
                    <tr>

                      <td>
                        ${index + 1}
                      </td>

                      <td>
                        <strong>
                          ${esc(student.name)}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          ${status}
                        </strong>
                      </td>

                      <td>

                        <button
                          class="small-button"
                          data-student-day="${student.id}|${date}">

                          OTVORI

                        </button>

                      </td>

                    </tr>
                  `;

                }).join('')

              : `

                <tr>

                  <td
                    colspan="4"
                    class="empty-table">

                    Nema učenika u ovom razredu.

                  </td>

                </tr>

              `
          }

        </tbody>

      </table>

    </section>
  `;
}

/* =========================================================
   POJEDINAČNI DAN UČENIKA
   ========================================================= */

function studentDay() {

  const student =
    getStudent(route.studentId);

  const date =
    route.date || today();

  if (!student) {

    setRoute('studentSearch');

    return '';

  }

  return `
    <section class="page-head">

      <button
        class="back-button"
        data-action="backEvidence">
        ← NAZAD
      </button>

      <h1>
        ${esc(student.name)}
      </h1>

      <div class="today-line">
        ${student.grade}. razred ·
        ${formatInputDate(date)}
      </div>

    </section>

    <section class="student-day-card">

      <h2>
        Prisustvo po namazima
      </h2>

      <div class="student-day-prayers">

        ${prayers.map(prayer => {

          const record =
            getRecord(
              data,
              date,
              student.id
            );

          const current =
            record?.statuses?.[prayer.id] || '';

          return `

            <div class="student-day-prayer">

              <div class="prayer-name">
                ${esc(prayer.label)}
              </div>

              <div class="day-status-buttons">

                ${statuses.map(status => `

                  <button
                    class="
                      day-status-button
                      ${status.className}
                      ${current === status.id
                        ? 'selected'
                        : ''}
                    "
                    data-day-status="${prayer.id}|${status.id}">

                    ${status.id}

                  </button>

                `).join('')}

              </div>

              <div class="day-current-status">

                ${
                  current
                    ? statuses.find(
                        s => s.id === current
                      )?.label
                    : 'Nije uneseno'
                }

              </div>

            </div>

          `;

        }).join('')}

      </div>

    </section>
  `;
}

/* =========================================================
   POSTAVKE
   ========================================================= */

function settings() {

  return `
    <section class="page-head">

      <h1>POSTAVKE</h1>

      <div class="today-line">
        Školska godina i sigurnosne kopije
      </div>

    </section>

    <section class="settings-page">

          <div class="settings-card">

        <h2>Sigurnosna kopija</h2>

        <p>
          Sačuvajte kompletnu evidenciju kako biste je mogli vratiti na ovom ili drugom uređaju.
        </p>

        <div class="settings-actions">

          <button class="secondary-button" data-action="exportJson">
  SAČUVAJ SIGURNOSNU KOPIJU
</button>

<button class="secondary-button" data-action="importJson">
  VRATI SIGURNOSNU KOPIJU
</button>

          <input
            id="backup-file-input"
            type="file"
            accept="application/json,.json"
            style="display:none;">

        </div>

      </div>
      <div class="settings-card">

        <h2>Školska godina</h2>

        <div class="setting-row">

          <div>

            <strong>
              Trenutna školska godina
            </strong>

            <span>
              ${esc(data.activeYear)}
            </span>

          </div>

          <button
            class="primary-button"
            data-action="advanceYear">

            PREĐI U NOVU ŠKOLSKU GODINU

          </button>

        </div>

      </div>

      <div class="settings-card">

        <h2>Podaci aplikacije</h2>

        <div class="setting-info">

          <div>
            Učenika:
            <strong>
              ${data.students.length}
            </strong>
          </div>

          <div>
            Evidencija:
            <strong>
              ${data.records.length}
            </strong>
          </div>

          <div>
            Školskih godina:
            <strong>
              ${data.years.length}
            </strong>
          </div>

        </div>

      </div>

    </section>
  `;
}

/* =========================================================
   NORMALIZACIJA DATUMA
   ========================================================= */

function normalizeDate(date) {

  if (!date) {
    return today();
  }

  return date;
}

/* =========================================================
   DOGAĐAJI
   ========================================================= */

function bindEvents() {

  /* ---------------------------------------------------------
     GLAVNI MENI
     --------------------------------------------------------- */

  document
    .querySelectorAll('[data-page]')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const page =
            button.dataset.page;

          setRoute(page);

        }
      );

    });

  /* ---------------------------------------------------------
     NAMAZI NA POČETNOJ
     --------------------------------------------------------- */

  document
    .querySelectorAll('[data-prayer]')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          setRoute(
            'prayerGrades',
            {
              prayer: button.dataset.prayer,
              date: today()
            }
          );

        }
      );

    });

  /* ---------------------------------------------------------
     IZBOR RAZREDA ZA NAMAZ
     --------------------------------------------------------- */

  document
    .querySelectorAll('[data-grade]')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          setRoute(
            'rollcall',
            {
              prayer: route.prayer,
              grade: Number(
                button.dataset.grade
              ),
              date:
                route.date || today(),
              index: 0
            }
          );

        }
      );

    });

  /* ---------------------------------------------------------
     STATUS UČENIKA
     --------------------------------------------------------- */

  document
    .querySelectorAll('[data-status]')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const students =
            getActiveStudents(
              data.activeYear,
              route.grade
            );

          const index =
            Number(route.index || 0);

          const student =
            students[index];

          if (!student) return;

          setStatus(
            data,
            route.date || today(),
            student.id,
            route.prayer,
            button.dataset.status
          );

          if (
            index <
            students.length - 1
          ) {

            setRoute(
              'rollcall',
              {
                prayer: route.prayer,
                grade: route.grade,
                date:
                  route.date || today(),
                index: index + 1
              }
            );

          } else {

            setRoute(
              'summary',
              {
                prayer: route.prayer,
                grade: route.grade,
                date:
                  route.date || today()
              }
            );

          }

        }
      );

    });

  /* ---------------------------------------------------------
     PRETHODNI UČENIK
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-action="previousStudent"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const index =
            Math.max(
              0,
              Number(route.index || 0) - 1
            );

          setRoute(
            'rollcall',
            {
              ...route,
              index
            }
          );

        }
      );

    });

  /* ---------------------------------------------------------
     SLJEDEĆI UČENIK
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-action="nextStudent"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const students =
            getActiveStudents(
              data.activeYear,
              route.grade
            );

          const index =
            Math.min(
              students.length - 1,
              Number(route.index || 0) + 1
            );

          setRoute(
            'rollcall',
            {
              ...route,
              index
            }
          );

        }
      );

    });

  /* ---------------------------------------------------------
     DIREKTAN ODABIR UČENIKA
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-student-index]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          setRoute(
            'rollcall',
            {
              ...route,
              index:
                Number(
                  button.dataset.studentIndex
                )
            }
          );

        }
      );

    });

  /* ---------------------------------------------------------
     POVRATAK NA POČETNU
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-action="home"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => setRoute('home')
      );

    });

  document
    .querySelectorAll(
      '[data-action="students"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => setRoute('students')
      );

    });

  document
    .querySelectorAll(
      '[data-action="records"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => setRoute('records')
      );

    });

  /* ---------------------------------------------------------
     POVRATAK NA IZBOR RAZREDA
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-action="backPrayerGrades"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          setRoute(
            'prayerGrades',
            {
              prayer: route.prayer,
              date:
                route.date || today()
            }
          );

        }
      );

    });

  /* ---------------------------------------------------------
     POVRATAK NA LISTU UČENIKA
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-action="backStudentList"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          setRoute(
            'studentList',
            {
              grade:
                getStudent(
                  route.studentId
                )?.grade
            }
          );

        }
      );

    });

  /* ---------------------------------------------------------
     POVRATAK NA EVIDENCIJU
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-action="backEvidence"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () =>
          setRoute('studentSearch')
      );

    });

  /* ---------------------------------------------------------
     SLJEDEĆI RAZRED
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-action="nextGrade"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const next =
            Number(route.grade) + 1;

          if (next <= 4) {

            setRoute(
              'rollcall',
              {
                prayer: route.prayer,
                grade: next,
                date:
                  route.date || today(),
                index: 0
              }
            );

          } else {

            setRoute('home');

          }

        }
      );

    });

  /* ---------------------------------------------------------
     UČENICI – RAZRED
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-students-grade]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          setRoute(
            'studentList',
            {
              grade:
                Number(
                  button.dataset.studentsGrade
                )
            }
          );

        }
      );

    });

  /* ---------------------------------------------------------
     DODAJ UČENIKA
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-action="addStudent"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => addStudent()
      );

    });

  /* ---------------------------------------------------------
     UREDI UČENIKA
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-edit-student]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () =>
          editStudent(
            button.dataset.editStudent
          )
      );

    });

  /* ---------------------------------------------------------
     OBRIŠI UČENIKA
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-remove-student]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () =>
          removeStudent(
            button.dataset.removeStudent
          )
      );

    });

  /* ---------------------------------------------------------
     HISTORIJA UČENIKA
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-history]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          setRoute(
            'history',
            {
              studentId:
                button.dataset.history
            }
          );

        }
      );

    });
      /* ---------------------------------------------------------
     EVIDENCIJA – MJESEČNA
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-action="monthly"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          setRoute(
            'monthly',
            {
              month:
                String(
                  new Date().getMonth() + 1
                ).padStart(2, '0'),

              year:
                new Date().getFullYear(),

              grade: 1,

              selectedPrayers:
                prayers.map(
                  p => p.id
                ),

              problematicOnly: false
            }
          );

        }
      );

    });

  /* ---------------------------------------------------------
     EVIDENCIJA – PRETRAGA
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-action="studentSearch"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () =>
          setRoute(
            'studentSearch',
            {
              query: ''
            }
          )
      );

    });

  /* ---------------------------------------------------------
     EVIDENCIJA – DNEVNA
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-action="daily"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () =>
          setRoute(
            'daily',
            {
              date: today(),
              grade: 1,
              prayer: prayers[0].id
            }
          )
      );

    });

  /* ---------------------------------------------------------
     PRETRAGA UČENIKA
     --------------------------------------------------------- */

  const searchInput =
    document.getElementById(
      'student-search-input'
    );

  if (searchInput) {

    searchInput.addEventListener(
      'input',
      () => {

        route.query =
          searchInput.value;

        render();

        const inputAgain =
          document.getElementById(
            'student-search-input'
          );

        if (inputAgain) {

          inputAgain.focus();

          inputAgain.setSelectionRange(
            inputAgain.value.length,
            inputAgain.value.length
          );

        }

      }
    );

  }

  /* ---------------------------------------------------------
     MJESEČNI FILTERI
     --------------------------------------------------------- */

  const monthlyMonth =
    document.getElementById(
      'monthly-month'
    );

  const problematicOnly =
    document.getElementById(
      'problematic-only'
    );

  const applyMonthly =
    document.querySelector(
      '[data-action="applyMonthly"]'
    );

  if (applyMonthly) {

    applyMonthly.addEventListener(
      'click',
      () => {

        const selectedPrayers =
          Array.from(
            document.querySelectorAll(
              '.prayer-checkboxes input[type="checkbox"]:checked'
            )
          ).map(
            input => input.value
          );

        const monthValue =
          monthlyMonth?.value || '';

        const [
          selectedYear,
          selectedMonth
        ] =
          monthValue.split('-');

        setRoute(
          'monthly',
          {
            month:
              selectedMonth ||
              String(
                new Date().getMonth() + 1
              ).padStart(2, '0'),

            year:
              Number(
                selectedYear ||
                new Date().getFullYear()
              ),

            grade:
              Number(
                route.grade || 1
              ),

            selectedPrayers:
              selectedPrayers.length
                ? selectedPrayers
                : prayers.map(
                    p => p.id
                  ),

            problematicOnly:
              problematicOnly?.checked ||
              false
          }
        );

      }
    );

  }

  document
  .querySelectorAll('[data-action="exportExcel"]')
  .forEach(button => {
    button.addEventListener(
      'click',
      () => {
        exportMonthlyExcel();
      }
    );
  });

  /* ---------------------------------------------------------
     MJESEČNI — RAZRED DROPDOWN
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-monthly-grade-choice]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          setRoute(
            'monthly',
            {
              ...route,

              grade:
                Number(
                  button.dataset.monthlyGradeChoice
                )
            }
          );

        }
      );

    });

  /* ---------------------------------------------------------
     MJESEČNI — OTVARANJE DROPDOWNA
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '.custom-dropdown-button'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        event => {

          event.stopPropagation();

          const dropdown =
            button.closest(
              '.custom-dropdown'
            );

          const menu =
            dropdown?.querySelector(
              '.custom-dropdown-menu'
            );

          if (!menu) return;

          document
            .querySelectorAll(
              '.custom-dropdown-menu.open'
            )
            .forEach(other => {

              if (other !== menu) {
                other.classList.remove(
                  'open'
                );
              }

            });

          menu.classList.toggle(
            'open'
          );

        }
      );

    });

  /* ---------------------------------------------------------
     DNEVNI FILTERI
     --------------------------------------------------------- */

  const dailyDate =
    document.getElementById(
      'daily-date'
    );

  if (dailyDate) {

    dailyDate.addEventListener(
      'change',
      () => {

        setRoute(
          'daily',
          {
            date:
              dailyDate.value ||
              today(),

            grade:
              Number(
                route.grade || 1
              ),

            prayer:
              route.prayer ||
              prayers[0].id
          }
        );

      }
    );

  }

  /* ---------------------------------------------------------
     DNEVNI — OTVARANJE DROPDOWNA
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '.daily-dropdown-button'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        event => {

          event.stopPropagation();

          const dropdown =
            button.closest(
              '.daily-dropdown'
            );

          const menu =
            dropdown?.querySelector(
              '.daily-dropdown-menu'
            );

          if (!menu) return;

          document
            .querySelectorAll(
              '.daily-dropdown-menu.open'
            )
            .forEach(other => {

              if (other !== menu) {
                other.classList.remove(
                  'open'
                );
              }

            });

          menu.classList.toggle(
            'open'
          );

        }
      );

    });

  /* ---------------------------------------------------------
     DNEVNI — RAZRED
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-daily-grade-choice]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          setRoute(
            'daily',
            {
              date:
                route.date ||
                today(),

              grade:
                Number(
                  button.dataset
                    .dailyGradeChoice
                ),

              prayer:
                route.prayer ||
                prayers[0].id
            }
          );

        }
      );

    });

  /* ---------------------------------------------------------
     DNEVNI — NAMAZ
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-daily-prayer-choice]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          setRoute(
            'daily',
            {
              date:
                route.date ||
                today(),

              grade:
                Number(
                  route.grade || 1
                ),

              prayer:
                button.dataset
                  .dailyPrayerChoice
            }
          );

        }
      );

    });

  /* ---------------------------------------------------------
     ZATVARANJE DROPDOWNA
     --------------------------------------------------------- */

  document.addEventListener(
    'click',
    () => {

      document
        .querySelectorAll(
          '.daily-dropdown-menu.open, .custom-dropdown-menu.open'
        )
        .forEach(menu => {

          menu.classList.remove(
            'open'
          );

        });

    }
  );

  /* ---------------------------------------------------------
     POJEDINAČNI DAN – PROMJENA STATUSA
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-day-status]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const parts =
            button.dataset.dayStatus
              .split('|');

          const prayerId =
            parts[0];

          const statusId =
            parts[1];

          const student =
            getStudent(
              route.studentId
            );

          if (!student) return;

          setStatus(
            data,
            route.date || today(),
            student.id,
            prayerId,
            statusId
          );

          render();

        }
      );

    });

  /* ---------------------------------------------------------
     OTVARANJE STUDENTA / DANA
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-student-day]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const parts =
            button.dataset.studentDay
              .split('|');

          const studentId =
            parts[0];

          const date =
            parts[1];

          setRoute(
            'studentDay',
            {
              studentId,
              date
            }
          );

        }
      );

    });

  /* ---------------------------------------------------------
     PRELAZAK U NOVU ŠKOLSKU GODINU
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-action="advanceYear"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const confirmed =
            confirm(
              `Da li želite preći u novu školsku godinu?\n\nTrenutna godina: ${data.activeYear}`
            );

          if (!confirmed) return;

          advanceYear(data);

          alert(
            `Nova školska godina je ${data.activeYear}.`
          );

          render();

        }
      );

    });

  /* ---------------------------------------------------------
     SIGURNOSNA KOPIJA – IZVOZ
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-action="exportJson"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const json =
            JSON.stringify(
              data,
              null,
              2
            );

          const blob =
            new Blob(
              [json],
              {
                type:
                  'application/json'
              }
            );

          const url =
            URL.createObjectURL(
              blob
            );

          const link =
            document.createElement(
              'a'
            );

          link.href = url;

          link.download =
            `evidencija-backup-${data.activeYear.replace('/', '-')}.json`;

          document.body.appendChild(
            link
          );

          link.click();

          link.remove();

          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1000);

        }
      );

    });

  /* ---------------------------------------------------------
     SIGURNOSNA KOPIJA – UVOZ
     --------------------------------------------------------- */

  document
    .querySelectorAll(
      '[data-action="importJson"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const input =
            document.getElementById(
              'backup-file-input'
            );

          if (input) {
            input.click();
          }

        }
      );

    });

  const backupInput =
    document.getElementById(
      'backup-file-input'
    );

  if (backupInput) {

    backupInput.addEventListener(
      'change',
      async () => {

        const file =
          backupInput.files?.[0];

        if (!file) return;

        try {

          const text =
            await file.text();

          const imported =
            JSON.parse(text);

          const valid =
            imported &&
            Array.isArray(imported.students) &&
            Array.isArray(imported.records) &&
            Array.isArray(imported.years) &&
            typeof imported.activeYear === 'string';

          if (!valid) {
            alert(
              'Ova datoteka nije važeća sigurnosna kopija aplikacije.'
            );
            backupInput.value = '';
            return;
          }

          const confirmed =
            confirm(
              'Uvesti ovu sigurnosnu kopiju?\n\n' +
              'Trenutni podaci na ovom uređaju bit će zamijenjeni podacima iz kopije.'
            );

          if (!confirmed) {
            backupInput.value = '';
            return;
          }

          Object.keys(data).forEach(key => {
            delete data[key];
          });

          Object.assign(
            data,
            imported
          );

          save(data);

          alert(
            'Sigurnosna kopija je uspješno uvezena.'
          );

          backupInput.value = '';
          render();

        } catch (error) {

          console.error(error);

          alert(
            'Nije moguće učitati sigurnosnu kopiju. Provjerite da je odabran ispravan JSON fajl.'
          );

          backupInput.value = '';

        }

      }
    );

  }

}

/* =========================================================
   POKRETANJE APLIKACIJE
   ========================================================= */

applyBackground();
render();