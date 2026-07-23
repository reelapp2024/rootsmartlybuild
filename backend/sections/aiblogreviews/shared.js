/**
 * AI fake-review name uniqueness — first AND last names never repeat in a batch.
 * Reference names are style-only; we allocate concrete unique names before OpenAI runs.
 */

const FIRST_NAMES = [
  // Western / international
  "Ava", "Noah", "Mia", "Liam", "Emma", "Oliver", "Sophia", "Elijah",
  "Isabella", "Lucas", "Amelia", "Mason", "Harper", "Logan", "Evelyn", "James",
  "Abigail", "Benjamin", "Emily", "Henry", "Elizabeth", "Alexander", "Michael",
  "Chloe", "Daniel", "Grace", "Matthew", "Lily", "Samuel", "Zoe", "David",
  "Nora", "Joseph", "Scarlett", "Thomas", "Aria", "Charles", "Penelope", "Christopher",
  "Andrew", "Riley", "Joshua", "Ryan", "Hazel", "Nathan", "Violet", "Caleb",
  "Aurora", "Dylan", "Savannah", "Owen", "Audrey", "Luke", "Stella", "Jack",
  "Claire", "Leo", "Iris", "Ethan", "Freya", "Wyatt", "Maya", "Felix",
  "Ruby", "Oscar", "Ivy", "Miles", "Alice", "Theo", "Sadie", "Julian",
  // South Asian
  "Aarav", "Priya", "Arjun", "Ananya", "Vihaan", "Diya", "Kabir", "Isha",
  "Rohan", "Meera", "Dev", "Neha", "Aisha", "Samir", "Zara", "Aditya",
  "Kavya", "Rahul", "Saanvi", "Vikram", "Anika", "Nikhil", "Pooja", "Siddharth",
  "Tanvi", "Karan", "Riya", "Amit", "Shreya", "Raj", "Nisha", "Manish",
  "Ishaan", "Myra", "Reyansh", "Aarohi", "Vivaan", "Kiara", "Shaurya", "Anvi",
  // Middle Eastern / Arabic / Persian
  "Omar", "Fatima", "Hassan", "Layla", "Yusuf", "Amira", "Karim", "Noor",
  "Samira", "Idris", "Leila", "Farid", "Yasmin", "Tariq", "Hana", "Rami",
  "Zain", "Dalia", "Nabil", "Salma", "Imran", "Ranya", "Bilal", "Mira",
  // East / SE Asian
  "Kai", "Mei", "Hiro", "Yuki", "Jin", "Wei", "Sora", "Minh",
  "Linh", "Kenji", "Aiko", "Suki", "Ren", "Hanae", "Taro", "Nari",
  "Jun", "Asa", "Bo", "Keiko", "Dai", "Yuna", "Shin", "Mina",
  // Hispanic / Latino
  "Sofia", "Diego", "Camila", "Mateo", "Valentina", "Santiago", "Lucia", "Sebastian",
  "Elena", "Adrian", "Isabela", "Miguel", "Mariana", "Carlos", "Andrea", "Javier",
  "Paola", "Rafael", "Gabriela", "Andres", "Bianca", "Emilio", "Rosa", "Hector",
];

const LAST_NAMES = [
  "Brooks", "Nguyen", "Rivera", "Chen", "Murphy", "Thompson", "Wright", "Bennett",
  "Foster", "Coleman", "Hayes", "Reed", "Powell", "Sutton", "Parker", "Walsh",
  "Costa", "Hughes", "Perry", "Butler", "Jenkins", "Fisher", "Hunter", "Murray",
  "Palmer", "Ellis", "West", "Jordan", "Pierce", "Grant", "Bishop", "Hoffman",
  "Patel", "Singh", "Sharma", "Kapoor", "Iyer", "Nair", "Das", "Joshi",
  "Malik", "Qureshi", "Khan", "Ahmed", "Hassan", "Ali", "Rahman", "Chowdhury",
  "Garcia", "Rodriguez", "Martinez", "Lopez", "Hernandez", "Gonzalez", "Perez", "Sanchez",
  "Kim", "Park", "Tanaka", "Suzuki", "Nakamura", "Wang", "Zhang", "Liu",
  "Silva", "Oliveira", "Santos", "Fernandez", "Morales", "Castillo", "Romero", "Vargas",
  "Andersen", "Berg", "Lindqvist", "Kowalski", "Novak", "Horvat", "Popov", "Ivanov",
  "Callahan", "Davenport", "Everett", "Fletcher", "Garrison", "Harrington", "Ingram", "Jensen",
  "Kingsley", "Lawson", "Montgomery", "Nolan", "Osborne", "Prescott", "Quincy", "Ramirez",
  "Shepherd", "Tucker", "Underwood", "Vaughn", "Whitaker", "York", "Zimmerman", "Barnett",
  "Mehta", "Reddy", "Banerjee", "Chatterjee", "Desai", "Gupta", "Verma", "Pillai",
  "Abbas", "Farooq", "Haddad", "Jabari", "Kazemi", "Nasser", "Saleh", "Zahra",
];

function normalizePersonName(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function nameKey(value) {
  return normalizePersonName(value).toLowerCase();
}

function firstNameOf(fullName) {
  const parts = normalizePersonName(fullName).split(" ").filter(Boolean);
  return (parts[0] || "").toLowerCase();
}

function lastNameOf(fullName) {
  const parts = normalizePersonName(fullName).split(" ").filter(Boolean);
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}

function uniqList(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const k = nameKey(item);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(normalizePersonName(item));
  }
  return out;
}

/**
 * reservedNames = already on this blog (must never reuse first/last/full).
 * referenceNames = UI style tips only — exact full match blocked if 2+ parts,
 * but first/last stay available so tips don't burn the pool.
 */
function buildForbiddenSets(referenceNames = [], reservedNames = []) {
  const forbiddenExact = new Set();
  const forbiddenFirst = new Set();
  const forbiddenLast = new Set();

  for (const n of reservedNames || []) {
    const full = normalizePersonName(n);
    if (!full) continue;
    forbiddenExact.add(nameKey(full));
    const first = firstNameOf(full);
    const last = lastNameOf(full);
    if (first) forbiddenFirst.add(first);
    if (last) forbiddenLast.add(last);
  }

  for (const n of referenceNames || []) {
    const full = normalizePersonName(n);
    if (!full) continue;
    // Only block exact full names from tips (e.g. "Maya Brooks"), not first/last alone
    if (full.includes(" ")) forbiddenExact.add(nameKey(full));
  }
  return { forbiddenExact, forbiddenFirst, forbiddenLast };
}

/**
 * Invent one unique full name — first AND last must not collide with used/forbidden sets.
 */
function inventUniqueName({
  usedFull = new Set(),
  usedFirst = new Set(),
  usedLast = new Set(),
  forbiddenExact = new Set(),
  forbiddenFirst = new Set(),
  forbiddenLast = new Set(),
  salt = 0,
} = {}) {
  const firstPool = uniqList(FIRST_NAMES);
  const lastPool = uniqList(LAST_NAMES);
  const attempts = Math.max(firstPool.length * lastPool.length, 200);

  for (let i = 0; i < attempts; i++) {
    const fi = Math.abs((salt * 31 + i * 17 + i * i) % firstPool.length);
    const li = Math.abs((salt * 47 + i * 23 + i * 3) % lastPool.length);
    const first = firstPool[fi];
    const last = lastPool[li];
    const full = `${first} ${last}`;
    const key = nameKey(full);
    const fKey = first.toLowerCase();
    const lKey = last.toLowerCase();

    if (usedFull.has(key) || forbiddenExact.has(key)) continue;
    if (usedFirst.has(fKey) || forbiddenFirst.has(fKey)) continue;
    if (usedLast.has(lKey) || forbiddenLast.has(lKey)) continue;
    if (fKey === lKey) continue; // avoid "Hassan Hassan" style duplicates

    usedFull.add(key);
    usedFirst.add(fKey);
    usedLast.add(lKey);
    return full;
  }

  // Deterministic unique fallback (still unique full string)
  const fallback = `Reviewer ${Date.now().toString(36)}${salt}${usedFull.size}`;
  usedFull.add(nameKey(fallback));
  usedFirst.add(nameKey(fallback));
  return fallback;
}

/**
 * Allocate N unique reviewer names for a whole generation batch.
 * Guarantees: no repeated full name, first name, or surname across the list.
 *
 * @param {number} count
 * @param {{ referenceNames?: string[], reservedNames?: string[], salt?: number }} opts
 */
function allocateUniqueReviewerNames(count, opts = {}) {
  const needed = Math.max(0, Number(count) || 0);
  const referenceNames = Array.isArray(opts.referenceNames) ? opts.referenceNames : [];
  const reservedNames = Array.isArray(opts.reservedNames) ? opts.reservedNames : [];
  const { forbiddenExact, forbiddenFirst, forbiddenLast } = buildForbiddenSets(
    referenceNames,
    reservedNames
  );

  const usedFull = new Set(forbiddenExact);
  const usedFirst = new Set(forbiddenFirst);
  const usedLast = new Set(forbiddenLast);
  const names = [];
  const baseSalt = Number(opts.salt) || Date.now() % 100000;

  for (let i = 0; i < needed; i++) {
    names.push(
      inventUniqueName({
        usedFull,
        usedFirst,
        usedLast,
        forbiddenExact,
        forbiddenFirst,
        forbiddenLast,
        salt: baseSalt + i * 97 + 11,
      })
    );
  }
  return names;
}

/**
 * Force-assign unique names onto AI rows (overwrite AI names).
 * Length of assignedNames wins; rows are padded/truncated to match.
 */
function applyAssignedNames(rows, assignedNames = []) {
  const assigned = (assignedNames || []).map(normalizePersonName).filter(Boolean);
  const out = [];
  for (let i = 0; i < assigned.length; i++) {
    const src = rows[i] && typeof rows[i] === "object" ? rows[i] : {};
    const full = assigned[i];
    const local = full
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 36);
    out.push({
      ...src,
      fullName: full,
      email: `${local}.${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 7)}${i}@example.com`,
    });
  }
  return out;
}

/**
 * Legacy safety net: rewrite any colliding first/last within a chunk.
 */
function ensureUniqueReviewerNames(rows, referenceNames = [], salt = 0, reservedNames = []) {
  const allocated = allocateUniqueReviewerNames((rows || []).length, {
    referenceNames,
    reservedNames,
    salt,
  });
  return applyAssignedNames(rows, allocated);
}

module.exports = {
  normalizePersonName,
  nameKey,
  firstNameOf,
  lastNameOf,
  buildForbiddenSets,
  inventUniqueName,
  allocateUniqueReviewerNames,
  applyAssignedNames,
  ensureUniqueReviewerNames,
  FIRST_NAMES,
  LAST_NAMES,
};
