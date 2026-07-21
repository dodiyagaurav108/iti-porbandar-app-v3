import { 
  User, 
  UserRole, 
  Trade, 
  Batch, 
  BatchStatus, 
  Student, 
  StudentStatus, 
  StudentStatusHistory, 
  AuditLog,
  BatchAssignmentHistory,
  MonthlyWorkingDays,
  StudentAttendance,
  PromotionRecord,
  GeneralLetterData,
  SIProfile,
  LeaveApplication
} from "../types";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

// In-Memory Database for Supabase mode (avoids localStorage and mock data)
export const MEMORY_DB: Record<string, any> = {};

// Helper to convert camelCase to snake_case for Supabase
export function camelToSnake(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  const n: any = {};
  Object.keys(obj).forEach(k => {
    const newKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    n[newKey] = typeof obj[k] === 'object' && k !== 'documents' ? camelToSnake(obj[k]) : obj[k];
  });
  return n;
}

// Helper to convert snake_case to camelCase for local React state
export function snakeToCamel(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  const n: any = {};
  Object.keys(obj).forEach(k => {
    const newKey = k.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    n[newKey] = typeof obj[k] === 'object' && k !== 'documents' ? snakeToCamel(obj[k]) : obj[k];
  });
  return n;
}

// Helper to generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Initial Seed Data
const DEFAULT_USERS: User[] = [
  {
    id: "user-admin",
    username: "admin",
    password: "password123",
    name: "Institute Administrator",
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: "2026-01-01"
  },
  {
    id: "user-si",
    username: "si",
    name: "Supervisor Instructor",
    role: UserRole.SUPERVISOR_INSTRUCTOR,
    isActive: true,
    createdAt: "2026-07-21",
    supervisorNameEnglish: "Supervisor Instructor",
    supervisorNameGujarati: "સુપરવાઇઝર ઇન્સ્ટ્રક્ટર"
  },
  {
    id: "user-si-ramesh",
    username: "ramesh_si",
    name: "Ramesh Patel (S.I. Welder)",
    role: UserRole.SUPERVISOR_INSTRUCTOR,
    isActive: true,
    createdAt: "2026-01-02",
    supervisorNameEnglish: "Ramesh Patel",
    supervisorNameGujarati: "રમેશ પટેલ"
  },
  {
    id: "user-si-sonal",
    username: "sonal_si",
    name: "Sonal Shah (S.I. COPA)",
    role: UserRole.SUPERVISOR_INSTRUCTOR,
    isActive: true,
    createdAt: "2026-01-03",
    supervisorNameEnglish: "Sonal Shah",
    supervisorNameGujarati: "સોનલ શાહ"
  },
  {
    id: "user-si-rahul",
    username: "rahul_si",
    name: "Rahul Mehta (S.I. Electrician)",
    role: UserRole.SUPERVISOR_INSTRUCTOR,
    isActive: false, // Inactive user for testing deactivation
    createdAt: "2026-01-04",
    supervisorNameEnglish: "Rahul Mehta",
    supervisorNameGujarati: "રાહુલ મહેતા"
  }
];

const DEFAULT_TRADES: Trade[] = [
  { id: "trade-1", name: "Welder", isActive: true, tradeNameEnglish: "Welder", tradeNameGujarati: "વેલ્ડર" },
  { id: "trade-2", name: "Electrician", isActive: true, tradeNameEnglish: "Electrician", tradeNameGujarati: "ઇલેક્ટ્રિશિયન" },
  { id: "trade-3", name: "COPA (Computer Operator & Programming Assistant)", isActive: true, tradeNameEnglish: "COPA (Computer Operator & Programming Assistant)", tradeNameGujarati: "કોપા" },
  { id: "trade-4", name: "Fitter", isActive: true, tradeNameEnglish: "Fitter", tradeNameGujarati: "ફિટર" },
  { id: "trade-5", name: "Draughtsman Civil", isActive: true, tradeNameEnglish: "Draughtsman Civil", tradeNameGujarati: "ડ્રાફ્ટસમેન સિવિલ" }
];

const DEFAULT_BATCHES: Batch[] = [
  {
    id: "batch-1",
    tradeName: "Welder",
    batchNumber: "84",
    batchSection: "A",
    displayName: "Welder 84-A",
    academicSession: "2025-2026",
    year: "Year 1",
    shift: "Shift 1",
    createdBy: "user-si-ramesh",
    createdByName: "Ramesh Patel (S.I. Welder)",
    status: BatchStatus.APPROVED,
    createdAt: "2026-01-10T10:00:00",
    assignedSIId: "user-si-ramesh",
    assignedSIName: "Ramesh Patel (S.I. Welder)"
  },
  {
    id: "batch-2",
    tradeName: "Welder",
    batchNumber: "84",
    batchSection: "B",
    displayName: "Welder 84-B",
    academicSession: "2025-2026",
    year: "Year 1",
    shift: "Shift 2",
    createdBy: "user-si-ramesh",
    createdByName: "Ramesh Patel (S.I. Welder)",
    status: BatchStatus.APPROVED,
    createdAt: "2026-01-11T11:30:00",
    assignedSIId: "user-si-ramesh",
    assignedSIName: "Ramesh Patel (S.I. Welder)"
  },
  {
    id: "batch-3",
    tradeName: "Welder",
    batchNumber: "84",
    batchSection: "C",
    displayName: "Welder 84-C",
    academicSession: "2025-2026",
    year: "Year 1",
    shift: "Shift 1",
    createdBy: "user-si-ramesh",
    createdByName: "Ramesh Patel (S.I. Welder)",
    status: BatchStatus.APPROVED,
    createdAt: "2026-07-13T15:20:00",
    assignedSIId: "user-si-ramesh",
    assignedSIName: "Ramesh Patel (S.I. Welder)"
  },
  {
    id: "batch-4",
    tradeName: "COPA",
    batchNumber: "86",
    batchSection: "A",
    displayName: "COPA 86-A",
    academicSession: "2025-2026",
    year: "Year 1",
    shift: "Shift 1",
    createdBy: "user-si-sonal",
    createdByName: "Sonal Shah (S.I. COPA)",
    status: BatchStatus.APPROVED,
    createdAt: "2026-01-12T09:00:00",
    assignedSIId: "user-si-sonal",
    assignedSIName: "Sonal Shah (S.I. COPA)"
  }
];

const DEFAULT_STUDENTS: Student[] = [
  {
    id: "stu-1",
    studentName: "Jayesh",
    fatherName: "Kantilal",
    surname: "Rathod",
    enrollmentNumber: "ENR202584001",
    dateOfBirth: "2006-04-12",
    gender: "Male",
    trade: "Welder",
    batchId: "batch-1",
    batchName: "Welder 84-A",
    academicSession: "2025-2026",
    year: "Year 1",
    shift: "Shift 1",
    studentMobileNumber: "9876543210",
    parentMobileNumber: "9876543211",
    address: "Plot 42, Sector 24, Gandhinagar, Gujarat",
    admissionDate: "2025-08-01",
    currentStatus: StudentStatus.ACTIVE,
    createdAt: "2026-01-15T12:00:00",
    updatedAt: "2026-01-15T12:00:00"
  },
  {
    id: "stu-2",
    studentName: "Ketan",
    fatherName: "Bhimjibhai",
    surname: "Chavda",
    enrollmentNumber: "ENR202584002",
    dateOfBirth: "2005-11-23",
    gender: "Male",
    trade: "Welder",
    batchId: "batch-1",
    batchName: "Welder 84-A",
    academicSession: "2025-2026",
    year: "Year 1",
    shift: "Shift 1",
    studentMobileNumber: "9898012345",
    parentMobileNumber: "9898012346",
    address: "Kalupur Circle, Ahmedabad, Gujarat",
    admissionDate: "2025-08-01",
    currentStatus: StudentStatus.EXIT_NAMKAMI,
    exitEffectiveDate: "2026-06-15",
    exitOutwardNumber: "OUT-2026-W01",
    exitOutwardDate: "2026-06-16",
    exitReason: "Absent for more than 15 consecutive days without leave application.",
    createdAt: "2026-01-15T12:10:00",
    updatedAt: "2026-06-16T10:00:00"
  },
  {
    id: "stu-3",
    studentName: "Pooja",
    fatherName: "Rajeshbhai",
    surname: "Solanki",
    enrollmentNumber: "ENR202584003",
    dateOfBirth: "2006-08-15",
    gender: "Female",
    trade: "Welder",
    batchId: "batch-1",
    batchName: "Welder 84-A",
    academicSession: "2025-2026",
    year: "Year 1",
    shift: "Shift 1",
    studentMobileNumber: "9909011223",
    parentMobileNumber: "9909011224",
    address: "Village Sargasan, Gandhinagar, Gujarat",
    admissionDate: "2025-08-01",
    currentStatus: StudentStatus.ACTIVE,
    createdAt: "2026-01-15T12:20:00",
    updatedAt: "2026-01-15T12:20:00"
  },
  {
    id: "stu-4",
    studentName: "Hardik",
    fatherName: "Mansukhbhai",
    surname: "Vaghela",
    enrollmentNumber: "ENR202584021",
    dateOfBirth: "2005-09-02",
    gender: "Male",
    trade: "Welder",
    batchId: "batch-2",
    batchName: "Welder 84-B",
    academicSession: "2025-2026",
    year: "Year 1",
    shift: "Shift 2",
    studentMobileNumber: "9426055443",
    parentMobileNumber: "9426055444",
    address: "Ranip, Ahmedabad, Gujarat",
    admissionDate: "2025-08-02",
    currentStatus: StudentStatus.ACTIVE,
    createdAt: "2026-01-16T14:00:00",
    updatedAt: "2026-01-16T14:00:00"
  },
  {
    id: "stu-5",
    studentName: "Bijal",
    fatherName: "Amratbhai",
    surname: "Patel",
    enrollmentNumber: "ENR202586001",
    dateOfBirth: "2006-01-30",
    gender: "Female",
    trade: "COPA",
    batchId: "batch-4",
    batchName: "COPA 86-A",
    academicSession: "2025-2026",
    year: "Year 1",
    shift: "Shift 1",
    studentMobileNumber: "9099077665",
    parentMobileNumber: "9099077666",
    address: "Koba Road, Gandhinagar, Gujarat",
    admissionDate: "2025-08-05",
    currentStatus: StudentStatus.ACTIVE,
    createdAt: "2026-01-18T10:00:00",
    updatedAt: "2026-01-18T10:00:00"
  },
  {
    id: "stu-6",
    studentName: "Alpesh",
    fatherName: "Arjanbhai",
    surname: "Rabari",
    enrollmentNumber: "ENR202586002",
    dateOfBirth: "2005-05-18",
    gender: "Male",
    trade: "COPA",
    batchId: "batch-4",
    batchName: "COPA 86-A",
    academicSession: "2025-2026",
    year: "Year 1",
    shift: "Shift 1",
    studentMobileNumber: "9712398765",
    parentMobileNumber: "9712398766",
    address: "Ghatlodia, Ahmedabad, Gujarat",
    admissionDate: "2025-08-05",
    currentStatus: StudentStatus.EXIT_RAJINAMU,
    exitEffectiveDate: "2026-05-10",
    exitOutwardNumber: "OUT-2026-C04",
    exitOutwardDate: "2026-05-11",
    exitReason: "Voluntarily resigned to assist in agricultural family work.",
    createdAt: "2026-01-18T10:15:00",
    updatedAt: "2026-05-11T16:00:00"
  }
];

const DEFAULT_HISTORY: StudentStatusHistory[] = [
  {
    id: "history-1",
    studentId: "stu-2",
    studentName: "Ketan Bhimjibhai Chavda",
    enrollmentNumber: "ENR202584002",
    previousStatus: StudentStatus.ACTIVE,
    newStatus: StudentStatus.EXIT_NAMKAMI,
    effectiveDate: "2026-06-15",
    outwardNumber: "OUT-2026-W01",
    outwardDate: "2026-06-16",
    reason: "Absent for more than 15 consecutive days without leave application.",
    changedBy: "S.I. Ramesh Patel (Supervisor Instructor)",
    changedDate: "2026-06-16",
    changedTime: "10:00:00"
  },
  {
    id: "history-2",
    studentId: "stu-6",
    studentName: "Alpesh Arjanbhai Rabari",
    enrollmentNumber: "ENR202586002",
    previousStatus: StudentStatus.ACTIVE,
    newStatus: StudentStatus.EXIT_RAJINAMU,
    effectiveDate: "2026-05-10",
    outwardNumber: "OUT-2026-C04",
    outwardDate: "2026-05-11",
    reason: "Voluntarily resigned to assist in agricultural family work.",
    changedBy: "S.I. Sonal Shah (Supervisor Instructor)",
    changedDate: "2026-05-11",
    changedTime: "16:00:00"
  }
];

const DEFAULT_LOGS: AuditLog[] = [
  { id: "log-1", user: "System", action: "System database initialized with default configurations", date: "2026-07-14", time: "08:00:00" },
  { id: "log-2", user: "Institute Administrator", action: "Admin dashboard accessed", date: "2026-07-14", time: "08:05:12" }
];

// LocalStorage Keys
const KEYS = {
  USERS: "iti_users",
  TRADES: "iti_trades",
  BATCHES: "iti_batches",
  STUDENTS: "iti_students",
  HISTORY: "iti_history",
  LOGS: "iti_logs",
  ASSIGNMENT_HISTORY: "iti_assignment_history",
  WORKING_DAYS: "iti_working_days",
  ATTENDANCE: "iti_attendance",
  PROMOTIONS: "iti_promotions",
  SI_PROFILES: "iti_si_profiles",
  LEAVE_APPLICATIONS: "iti_leave_applications"
};

// IndexedDB support for offline student records mapping
export function syncStudentsToIndexedDB(students: Student[]): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve();
      return;
    }
    const request = window.indexedDB.open("iti_db", 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("students")) {
        db.createObjectStore("students", { keyPath: "id" });
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("students")) {
        resolve();
        return;
      }
      try {
        const transaction = db.transaction("students", "readwrite");
        const store = transaction.objectStore("students");
        store.clear().onsuccess = () => {
          students.forEach(student => {
            if (student && student.id) {
              store.put(student);
            }
          });
        };
        transaction.oncomplete = () => {
          resolve();
        };
        transaction.onerror = () => {
          resolve();
        };
      } catch (err) {
        console.error("IndexedDB transaction error during sync", err);
        resolve();
      }
    };
    request.onerror = () => {
      resolve();
    };
  });
}

export function getStudentsFromIndexedDB(): Promise<Student[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(getStudents());
      return;
    }
    const request = window.indexedDB.open("iti_db", 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("students")) {
        db.createObjectStore("students", { keyPath: "id" });
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("students")) {
        resolve(getStudents());
        return;
      }
      try {
        const transaction = db.transaction("students", "readonly");
        const store = transaction.objectStore("students");
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          const result = getAllRequest.result || [];
          if (result.length > 0) {
            resolve(result);
          } else {
            resolve(getStudents());
          }
        };
        getAllRequest.onerror = () => {
          resolve(getStudents());
        };
      } catch (err) {
        console.error("IndexedDB error reading students", err);
        resolve(getStudents());
      }
    };
    request.onerror = () => {
      resolve(getStudents());
    };
  });
}

const COMMON_GUJARATI_WORDS: Record<string, string> = {
  jayesh: "જયેશ",
  kantilal: "કાંતિલાલ",
  rathod: "રાઠોડ",
  ketan: "કેતન",
  bhimjibhai: "ભીમજીભાઈ",
  chavda: "ચાવડા",
  pooja: "પૂજા",
  rajeshbhai: "રાજેશભાઈ",
  solanki: "સોલંકી",
  hardik: "હાર્દિક",
  mansukhbhai: "મનસુખભાઈ",
  vaghela: "વાઘેલા",
  bijal: "બીજલ",
  amratbhai: "અમરતભાઈ",
  patel: "પટેલ",
  ramesh: "રમેશ",
  sonal: "સોનલ",
  rahul: "રાહુલ",
  mehta: "મેહતા",
  shah: "શાહ",
  plot: "પ્લોટ",
  sector: "સેક્ટર",
  gandhinagar: "ગાંધીનગર",
  gujarat: "ગુજરાત",
  india: "ભારત",
  kalupur: "કાલુપુર",
  circle: "સર્કલ",
  ahmedabad: "અમદાવાદ",
  village: "ગામ",
  sargasan: "સરગાસણ",
  ranip: "રાણીપ",
  porbandar: "પોરબંદર",
  bhai: "ભાઈ",
  ben: "બેન"
};

function ruleBasedTransliterate(word: string): string {
  let result = "";
  let i = 0;
  const len = word.length;

  while (i < len) {
    const c3 = i + 3 <= len ? word.substring(i, i + 3) : "";
    const c2 = i + 2 <= len ? word.substring(i, i + 2) : "";
    const c1 = word.charAt(i);

    if (c3 === "bha") { result += "ભા"; i += 3; continue; }
    if (c3 === "cha") { result += "ચા"; i += 3; continue; }
    if (c3 === "dha") { result += "ધા"; i += 3; continue; }
    if (c3 === "gha") { result += "ઘા"; i += 3; continue; }
    if (c3 === "jha") { result += "ઝા"; i += 3; continue; }
    if (c3 === "kha") { result += "ખા"; i += 3; continue; }
    if (c3 === "pha") { result += "ફા"; i += 3; continue; }
    if (c3 === "sha") { result += "શા"; i += 3; continue; }
    if (c3 === "tha") { result += "થા"; i += 3; continue; }

    if (c2 === "bh") { result += "ભ"; i += 2; continue; }
    if (c2 === "ch") { result += "ચ"; i += 2; continue; }
    if (c2 === "dh") { result += "ધ"; i += 2; continue; }
    if (c2 === "gh") { result += "ઘ"; i += 2; continue; }
    if (c2 === "jh") { result += "ઝ"; i += 2; continue; }
    if (c2 === "kh") { result += "ખ"; i += 2; continue; }
    if (c2 === "ph") { result += "ફ"; i += 2; continue; }
    if (c2 === "sh") { result += "શ"; i += 2; continue; }
    if (c2 === "th") { result += "થ"; i += 2; continue; }
    if (c2 === "ee") { result += "ી"; i += 2; continue; }
    if (c2 === "oo") { result += "ૂ"; i += 2; continue; }
    if (c2 === "ai") { result += "ૈ"; i += 2; continue; }
    if (c2 === "au") { result += "ૌ"; i += 2; continue; }
    if (c2 === "aa") { result += "ા"; i += 2; continue; }

    if (c1 === "a") {
      if (i === 0) {
        result += "અ";
      } else if (i === len - 1) {
        result += "ા";
      } else {
        result += "ા";
      }
      i++;
      continue;
    }
    if (c1 === "i") { result += "િ"; i++; continue; }
    if (c1 === "u") { result += "ુ"; i++; continue; }
    if (c1 === "e") { result += "ે"; i++; continue; }
    if (c1 === "o") { result += "ો"; i++; continue; }

    if (c1 === "b") { result += "બ"; i++; continue; }
    if (c1 === "c") { result += "ક"; i++; continue; }
    if (c1 === "d") { result += "દ"; i++; continue; }
    if (c1 === "f") { result += "ફ"; i++; continue; }
    if (c1 === "g") { result += "ગ"; i++; continue; }
    if (c1 === "h") { result += "હ"; i++; continue; }
    if (c1 === "j") { result += "જ"; i++; continue; }
    if (c1 === "k") { result += "ક"; i++; continue; }
    if (c1 === "l") { result += "લ"; i++; continue; }
    if (c1 === "m") { result += "મ"; i++; continue; }
    if (c1 === "n") { result += "ન"; i++; continue; }
    if (c1 === "p") { result += "પ"; i++; continue; }
    if (c1 === "r") { result += "ર"; i++; continue; }
    if (c1 === "s") { result += "સ"; i++; continue; }
    if (c1 === "t") { result += "ત"; i++; continue; }
    if (c1 === "v") { result += "વ"; i++; continue; }
    if (c1 === "w") { result += "વ"; i++; continue; }
    if (c1 === "y") { result += "ય"; i++; continue; }
    if (c1 === "z") { result += "ઝ"; i++; continue; }

    result += c1;
    i++;
  }

  return result;
}

export function transliterateEnglishToGujarati(text: string): string {
  if (!text) return "";
  if (/[\u0a80-\u0aff]/.test(text)) {
    return text;
  }

  return text.split(/(\s+|,|\.|-)/).map(part => {
    const trimmed = part.trim().toLowerCase();
    if (!trimmed) return part;
    if (COMMON_GUJARATI_WORDS[trimmed]) {
      return COMMON_GUJARATI_WORDS[trimmed];
    }
    if (trimmed.endsWith("bhai") && trimmed.length > 4) {
      const base = trimmed.slice(0, -4);
      const baseTranslated = COMMON_GUJARATI_WORDS[base] || ruleBasedTransliterate(base);
      return baseTranslated + "ભાઈ";
    }
    if (trimmed.endsWith("ben") && trimmed.length > 3) {
      const base = trimmed.slice(0, -3);
      const baseTranslated = COMMON_GUJARATI_WORDS[base] || ruleBasedTransliterate(base);
      return baseTranslated + "બેન";
    }
    if (/^[a-zA-Z]+$/.test(part)) {
      return ruleBasedTransliterate(trimmed);
    }
    return part;
  }).join("");
}

// Low-level Get/Set helpers
export function getStoredData<T>(key: string): T[] {
  return (MEMORY_DB[key] as T[]) || [];
}

export function setStoredData<T>(key: string, data: T[]) {
  MEMORY_DB[key] = data;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save to localStorage", e);
  }
}

// 1. USER APIs
export function getUsers(): User[] {
  return getStoredData<User>(KEYS.USERS);
}

export function saveUser(user: User) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx > -1) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  setStoredData(KEYS.USERS, users);

  if (isSupabaseConfigured) {
    supabase.from("users").upsert(camelToSnake(user)).then(({ error }) => {
      if (error) console.error("Failed to save user to Supabase:", error);
    });
  }
}

export function deleteUser(userId: string) {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  setStoredData(KEYS.USERS, filtered);

  if (isSupabaseConfigured) {
    supabase.from("users").delete().eq("id", userId).then(({ error }) => {
      if (error) console.error("Failed to delete user from Supabase:", error);
    });
  }
}

// 2. TRADE APIs
export function getTrades(): Trade[] {
  return getStoredData<Trade>(KEYS.TRADES);
}

export function saveTrade(trade: Trade) {
  const trades = getTrades();
  const idx = trades.findIndex(t => t.id === trade.id);
  if (idx > -1) {
    trades[idx] = trade;
  } else {
    trades.push(trade);
  }
  setStoredData(KEYS.TRADES, trades);

  if (isSupabaseConfigured) {
    supabase.from("trades").upsert(camelToSnake(trade)).then(({ error }) => {
      if (error) console.error("Failed to save trade to Supabase:", error);
    });
  }
}

// 2b. BATCH ASSIGNMENT HISTORY APIs
export function getAssignmentHistory(): BatchAssignmentHistory[] {
  return getStoredData<BatchAssignmentHistory>(KEYS.ASSIGNMENT_HISTORY);
}

export function addAssignmentHistoryRecord(record: BatchAssignmentHistory) {
  const history = getAssignmentHistory();
  history.unshift(record);
  setStoredData(KEYS.ASSIGNMENT_HISTORY, history);

  if (isSupabaseConfigured) {
    supabase.from("assignment_history").upsert(camelToSnake(record)).then(({ error }) => {
      if (error) console.error("Failed to save assignment history to Supabase:", error);
    });
  }
}

// 3. BATCH APIs
export function getBatches(): Batch[] {
  const batches = getStoredData<Batch>(KEYS.BATCHES);
  let updated = false;
  const users = getStoredData<User>(KEYS.USERS);
  batches.forEach(b => {
    if (!b.assignedSIId && b.createdBy) {
      b.assignedSIId = b.createdBy;
      const supervisor = users.find(u => u.id === b.createdBy);
      b.assignedSIName = supervisor ? supervisor.name : b.createdByName;
      updated = true;
    }
  });
  if (updated) {
    setStoredData(KEYS.BATCHES, batches);
    if (isSupabaseConfigured) {
      supabase.from("batches").upsert(camelToSnake(batches)).then(({ error }) => {
        if (error) console.error("Failed to sync batches to Supabase:", error);
      });
    }
  }
  return batches;
}

export function saveBatch(batch: Batch) {
  const batches = getBatches();
  const idx = batches.findIndex(b => b.id === batch.id);
  if (idx > -1) {
    batches[idx] = batch;
  } else {
    batches.push(batch);
  }
  setStoredData(KEYS.BATCHES, batches);

  if (isSupabaseConfigured) {
    supabase.from("batches").upsert(camelToSnake(batch)).then(({ error }) => {
      if (error) console.error("Failed to save batch to Supabase:", error);
    });
  }
}

// 4. STUDENT APIs
export function getStudents(): Student[] {
  return getStoredData<Student>(KEYS.STUDENTS);
}

export function saveStudent(student: Student) {
  const students = getStudents();
  const idx = students.findIndex(s => s.id === student.id);
  const now = new Date().toISOString();
  let updated: Student;
  if (idx > -1) {
    updated = { ...student, updatedAt: now };
    students[idx] = updated;
  } else {
    updated = { ...student, createdAt: now, updatedAt: now };
    students.push(updated);
  }
  setStoredData(KEYS.STUDENTS, students);
  syncStudentsToIndexedDB(students);

  if (isSupabaseConfigured) {
    supabase.from("students").upsert(camelToSnake(updated)).then(({ error }) => {
      if (error) console.error("Failed to save student to Supabase:", error);
    });
  }
}

export function deleteStudent(id: string) {
  const students = getStudents();
  const updated = students.filter(s => s.id !== id);
  setStoredData(KEYS.STUDENTS, updated);
  syncStudentsToIndexedDB(updated);

  if (isSupabaseConfigured) {
    supabase.from("students").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("Failed to delete student from Supabase:", error);
    });
  }
}

export function saveStudentsBatch(newStudents: Student[]) {
  const students = getStudents();
  const now = new Date().toISOString();
  const updatedRecords: Student[] = [];

  newStudents.forEach(newStu => {
    const idx = students.findIndex(s => s.enrollmentNumber === newStu.enrollmentNumber);
    let updated: Student;
    if (idx > -1) {
      updated = { ...students[idx], ...newStu, updatedAt: now };
      students[idx] = updated;
    } else {
      updated = { ...newStu, createdAt: now, updatedAt: now };
      students.push(updated);
    }
    updatedRecords.push(updated);
  });

  setStoredData(KEYS.STUDENTS, students);
  syncStudentsToIndexedDB(students);

  if (isSupabaseConfigured && updatedRecords.length > 0) {
    supabase.from("students").upsert(camelToSnake(updatedRecords)).then(({ error }) => {
      if (error) console.error("Failed to save students batch to Supabase:", error);
    });
  }
}

// 5. STATUS HISTORY APIs
export function getHistory(): StudentStatusHistory[] {
  return getStoredData<StudentStatusHistory>(KEYS.HISTORY);
}

export function addHistoryRecord(record: StudentStatusHistory) {
  const history = getHistory();
  history.unshift(record);
  setStoredData(KEYS.HISTORY, history);

  if (isSupabaseConfigured) {
    supabase.from("student_status_history").upsert(camelToSnake(record)).then(({ error }) => {
      if (error) console.error("Failed to save student status history to Supabase:", error);
    });
  }
}

// 6. AUDIT LOG APIs
export function getLogs(): AuditLog[] {
  return getStoredData<AuditLog>(KEYS.LOGS);
}

export function addAuditLog(user: string, action: string) {
  const logs = getLogs();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];
  const log: AuditLog = {
    id: generateId(),
    user,
    action,
    date: dateStr,
    time: timeStr
  };
  logs.unshift(log);
  setStoredData(KEYS.LOGS, logs);

  if (isSupabaseConfigured) {
    supabase.from("audit_logs").upsert({
      id: log.id,
      user_name: log.user,
      action: log.action,
      date: log.date,
      time: log.time
    }).then(({ error }) => {
      if (error) console.error("Failed to save audit log to Supabase:", error);
    });
  }
}

// 7. WORKING DAYS APIs
export function getWorkingDays(): MonthlyWorkingDays[] {
  return getStoredData<MonthlyWorkingDays>(KEYS.WORKING_DAYS);
}

export function saveWorkingDays(wd: MonthlyWorkingDays) {
  const list = getWorkingDays();
  const idx = list.findIndex(item => item.id === wd.id);
  if (idx > -1) {
    list[idx] = wd;
  } else {
    list.push(wd);
  }
  setStoredData(KEYS.WORKING_DAYS, list);

  if (isSupabaseConfigured) {
    supabase.from("working_days").upsert(camelToSnake(wd)).then(({ error }) => {
      if (error) console.error("Failed to save working days to Supabase:", error);
    });
  }
}

export function deleteWorkingDays(id: string) {
  const list = getWorkingDays();
  const filtered = list.filter(item => item.id !== id);
  setStoredData(KEYS.WORKING_DAYS, filtered);

  if (isSupabaseConfigured) {
    supabase.from("working_days").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("Failed to delete working days from Supabase:", error);
    });
  }
}

// 8. ATTENDANCE APIs
export function getAttendance(): StudentAttendance[] {
  return getStoredData<StudentAttendance>(KEYS.ATTENDANCE);
}

export function saveAttendance(att: StudentAttendance) {
  const list = getAttendance();
  const idx = list.findIndex(item => item.id === att.id);
  if (idx > -1) {
    list[idx] = att;
  } else {
    list.push(att);
  }
  setStoredData(KEYS.ATTENDANCE, list);

  if (isSupabaseConfigured) {
    supabase.from("attendance").upsert(camelToSnake(att)).then(({ error }) => {
      if (error) console.error("Failed to save attendance to Supabase:", error);
    });
  }
}

export function saveAttendanceBatch(attRecords: StudentAttendance[]) {
  const list = getAttendance();
  const updatedList: StudentAttendance[] = [];

  attRecords.forEach(rec => {
    const idx = list.findIndex(item => item.studentId === rec.studentId && item.month === rec.month);
    let updated: StudentAttendance;
    if (idx > -1) {
      updated = { ...list[idx], ...rec };
      list[idx] = updated;
    } else {
      updated = rec;
      list.push(updated);
    }
    updatedList.push(updated);
  });

  setStoredData(KEYS.ATTENDANCE, list);

  if (isSupabaseConfigured && updatedList.length > 0) {
    supabase.from("attendance").upsert(camelToSnake(updatedList)).then(({ error }) => {
      if (error) console.error("Failed to save attendance batch to Supabase:", error);
    });
  }
}

// 9. PROMOTION APIs
export function getPromotions(): PromotionRecord[] {
  return getStoredData<PromotionRecord>(KEYS.PROMOTIONS);
}

export function savePromotion(rec: PromotionRecord) {
  const list = getPromotions();
  const idx = list.findIndex(item => item.id === rec.id);
  if (idx > -1) {
    list[idx] = rec;
  } else {
    list.unshift(rec);
  }
  setStoredData(KEYS.PROMOTIONS, list);

  if (isSupabaseConfigured) {
    supabase.from("promotions").upsert(camelToSnake(rec)).then(({ error }) => {
      if (error) console.error("Failed to save promotion to Supabase:", error);
    });
  }
}

export function promoteStudents(records: PromotionRecord[]) {
  const students = getStudents();
  const promotions = getPromotions();
  
  records.forEach(rec => {
    const sIdx = students.findIndex(s => s.id === rec.studentId);
    if (sIdx > -1) {
      const student = students[sIdx];
      student.trade = rec.newTrade;
      student.batchId = rec.newBatchId;
      student.batchName = rec.newBatchName;
      student.year = rec.newYear;
      student.shift = rec.newShift;
      student.currentStatus = StudentStatus.ACTIVE;
      student.updatedAt = new Date().toISOString();
      students[sIdx] = student;
    }
    promotions.unshift(rec);
  });

  setStoredData(KEYS.STUDENTS, students);
  setStoredData(KEYS.PROMOTIONS, promotions);
  syncStudentsToIndexedDB(students);

  if (isSupabaseConfigured) {
    const studentUpdates = records.map(rec => {
      const s = students.find(x => x.id === rec.studentId);
      return s ? camelToSnake(s) : null;
    }).filter(Boolean);

    Promise.all([
      supabase.from("students").upsert(studentUpdates),
      supabase.from("promotions").upsert(camelToSnake(records))
    ]).catch(err => {
      console.error("Failed to promote students on Supabase:", err);
    });
  }
}

export function reversePromotion(promotionId: string, reversedBy: string): boolean {
  const promotions = getPromotions();
  const students = getStudents();
  
  const pIdx = promotions.findIndex(p => p.id === promotionId);
  if (pIdx === -1) return false;
  if (promotions[pIdx].isReversed) return false;

  const rec = promotions[pIdx];
  
  const sIdx = students.findIndex(s => s.id === rec.studentId);
  if (sIdx > -1) {
    const student = students[sIdx];
    student.trade = rec.oldTrade;
    student.batchId = rec.oldBatchId;
    student.batchName = rec.oldBatchName;
    student.year = rec.oldYear;
    student.shift = rec.oldShift;
    student.updatedAt = new Date().toISOString();
    students[sIdx] = student;
  }

  rec.isReversed = true;
  rec.reversedDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
  rec.reversedBy = reversedBy;
  promotions[pIdx] = rec;

  setStoredData(KEYS.STUDENTS, students);
  setStoredData(KEYS.PROMOTIONS, promotions);
  syncStudentsToIndexedDB(students);

  if (isSupabaseConfigured) {
    const studentObj = students.find(x => x.id === rec.studentId);
    if (studentObj) {
      Promise.all([
        supabase.from("students").upsert(camelToSnake(studentObj)),
        supabase.from("promotions").upsert(camelToSnake(rec))
      ]).catch(err => {
        console.error("Failed to reverse promotion on Supabase:", err);
      });
    }
  }
  return true;
}

// 10. LETTERS & GENERAL LETTERS helper APIs
export function getGeneralLetter(templateId: string): GeneralLetterData | null {
  return (MEMORY_DB[`general_letter_${templateId}`] as GeneralLetterData) || null;
}

export function saveGeneralLetter(templateId: string, data: GeneralLetterData) {
  MEMORY_DB[`general_letter_${templateId}`] = data;

  if (isSupabaseConfigured) {
    supabase.from("general_letters").upsert(camelToSnake(data)).then(({ error }) => {
      if (error) console.error("Failed to save general letter to Supabase:", error);
    });
  }
}

export function getLetterTemplate(batchId: string): string | null {
  return (MEMORY_DB[`letter_template_${batchId}`] as string) || null;
}

export function saveLetterTemplate(batchId: string, template: string) {
  MEMORY_DB[`letter_template_${batchId}`] = template;

  if (isSupabaseConfigured) {
    supabase.from("letters").upsert({ id: batchId, template_text: template }).then(({ error }) => {
      if (error) console.error("Failed to save letter template to Supabase:", error);
    });
  }
}

// Initializer & Sync down
export function initializeStorage() {
  // Populate MEMORY_DB with defaults or saved localStorage data
  try {
    const storedUsers = localStorage.getItem(KEYS.USERS);
    MEMORY_DB[KEYS.USERS] = storedUsers ? JSON.parse(storedUsers) : [...DEFAULT_USERS];

    const storedTrades = localStorage.getItem(KEYS.TRADES);
    MEMORY_DB[KEYS.TRADES] = storedTrades ? JSON.parse(storedTrades) : [...DEFAULT_TRADES];

    const storedBatches = localStorage.getItem(KEYS.BATCHES);
    MEMORY_DB[KEYS.BATCHES] = storedBatches ? JSON.parse(storedBatches) : [...DEFAULT_BATCHES];

    const storedStudents = localStorage.getItem(KEYS.STUDENTS);
    MEMORY_DB[KEYS.STUDENTS] = storedStudents ? JSON.parse(storedStudents) : [...DEFAULT_STUDENTS];

    const storedHistory = localStorage.getItem(KEYS.HISTORY);
    MEMORY_DB[KEYS.HISTORY] = storedHistory ? JSON.parse(storedHistory) : [...DEFAULT_HISTORY];

    const storedLogs = localStorage.getItem(KEYS.LOGS);
    MEMORY_DB[KEYS.LOGS] = storedLogs ? JSON.parse(storedLogs) : [...DEFAULT_LOGS];

    const storedAssignment = localStorage.getItem(KEYS.ASSIGNMENT_HISTORY);
    MEMORY_DB[KEYS.ASSIGNMENT_HISTORY] = storedAssignment ? JSON.parse(storedAssignment) : [];

    const storedWD = localStorage.getItem(KEYS.WORKING_DAYS);
    MEMORY_DB[KEYS.WORKING_DAYS] = storedWD ? JSON.parse(storedWD) : [];

    const storedAttendance = localStorage.getItem(KEYS.ATTENDANCE);
    MEMORY_DB[KEYS.ATTENDANCE] = storedAttendance ? JSON.parse(storedAttendance) : [];

    const storedPromotions = localStorage.getItem(KEYS.PROMOTIONS);
    MEMORY_DB[KEYS.PROMOTIONS] = storedPromotions ? JSON.parse(storedPromotions) : [];

    const storedSIProfiles = localStorage.getItem(KEYS.SI_PROFILES);
    MEMORY_DB[KEYS.SI_PROFILES] = storedSIProfiles ? JSON.parse(storedSIProfiles) : [
      {
        id: "sip-si",
        userId: "user-si",
        nameEnglish: "Supervisor Instructor",
        nameGujarati: "સુપરવાઇઝર ઇન્સ્ટ્રક્ટર",
        designationEnglish: "Supervisor Instructor",
        designationGujarati: "સુપરવાઇઝર ઇન્સ્ટ્રક્ટર",
        officeEnglish: "ITI Porbandar",
        officeGujarati: "આઈ.ટી.આઈ. પોરબંદર",
        departmentEnglish: "ITI Porbandar",
        departmentGujarati: "રોજગાર અને તાલીમ વિભાગ",
        employeeId: "EMP-SI",
        mobile: "+91 9876543210",
        addressEnglish: "ITI Porbandar Campus",
        addressGujarati: "આઈ.ટી.આઈ. પોરબંદર કેમ્પસ",
        salary: "53100",
        createdAt: "2026-07-21T00:00:00Z",
        updatedAt: "2026-07-21T00:00:00Z"
      }
    ];

    const storedLeave = localStorage.getItem(KEYS.LEAVE_APPLICATIONS);
    MEMORY_DB[KEYS.LEAVE_APPLICATIONS] = storedLeave ? JSON.parse(storedLeave) : [];
  } catch (err) {
    console.error("Failed to read from localStorage during initializeStorage", err);
    MEMORY_DB[KEYS.USERS] = [...DEFAULT_USERS];
    MEMORY_DB[KEYS.TRADES] = [...DEFAULT_TRADES];
    MEMORY_DB[KEYS.BATCHES] = [...DEFAULT_BATCHES];
    MEMORY_DB[KEYS.STUDENTS] = [...DEFAULT_STUDENTS];
    MEMORY_DB[KEYS.HISTORY] = [...DEFAULT_HISTORY];
    MEMORY_DB[KEYS.LOGS] = [...DEFAULT_LOGS];
    MEMORY_DB[KEYS.ASSIGNMENT_HISTORY] = [];
    MEMORY_DB[KEYS.WORKING_DAYS] = [];
    MEMORY_DB[KEYS.ATTENDANCE] = [];
    MEMORY_DB[KEYS.PROMOTIONS] = [];
    MEMORY_DB[KEYS.SI_PROFILES] = [
      {
        id: "sip-si",
        userId: "user-si",
        nameEnglish: "Supervisor Instructor",
        nameGujarati: "સુપરવાઇઝર ઇન્સ્ટ્રક્ટર",
        designationEnglish: "Supervisor Instructor",
        designationGujarati: "સુપરવાઇઝર ઇન્સ્ટ્રક્ટર",
        officeEnglish: "ITI Porbandar",
        officeGujarati: "આઈ.ટી.આઈ. પોરબંદર",
        departmentEnglish: "ITI Porbandar",
        departmentGujarati: "રોજગાર અને તાલીમ વિભાગ",
        employeeId: "EMP-SI",
        mobile: "+91 9876543210",
        addressEnglish: "ITI Porbandar Campus",
        addressGujarati: "આઈ.ટી.આઈ. પોરબંદર કેમ્પસ",
        salary: "53100",
        createdAt: "2026-07-21T00:00:00Z",
        updatedAt: "2026-07-21T00:00:00Z"
      }
    ];
    MEMORY_DB[KEYS.LEAVE_APPLICATIONS] = [];
  }
}

// 10. SI PROFILE APIs
export function getSIProfiles(): SIProfile[] {
  return getStoredData<SIProfile>(KEYS.SI_PROFILES);
}

export function getSIProfileByUserId(userId: string): SIProfile | null {
  const profiles = getSIProfiles();
  return profiles.find(p => p.userId === userId) || null;
}

export function saveSIProfile(profile: SIProfile) {
  const profiles = getSIProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id || p.userId === profile.userId);
  if (idx > -1) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  setStoredData(KEYS.SI_PROFILES, profiles);

  if (isSupabaseConfigured) {
    supabase.from("si_profiles").upsert(camelToSnake(profile)).then(({ error }) => {
      if (error) console.error("Failed to save S.I. Profile to Supabase:", error);
    });
  }
}

export function deleteSIProfile(profileId: string, userId?: string) {
  const profiles = getSIProfiles();
  const filtered = profiles.filter(p => p.id !== profileId && p.userId !== userId);
  setStoredData(KEYS.SI_PROFILES, filtered);

  if (isSupabaseConfigured) {
    if (profileId) {
      supabase.from("si_profiles").delete().eq("id", profileId).then(({ error }) => {
        if (error) console.error("Failed to delete S.I. Profile from Supabase by id:", error);
      });
    } else if (userId) {
      supabase.from("si_profiles").delete().eq("user_id", userId).then(({ error }) => {
        if (error) console.error("Failed to delete S.I. Profile from Supabase by user_id:", error);
      });
    }
  }
}

// 11. LEAVE APPLICATION APIs
export function getLeaveApplications(): LeaveApplication[] {
  return getStoredData<LeaveApplication>(KEYS.LEAVE_APPLICATIONS);
}

export function getLeaveApplicationsByUserId(userId: string): LeaveApplication[] {
  const apps = getLeaveApplications();
  return apps.filter(a => a.userId === userId);
}

export function saveLeaveApplication(app: LeaveApplication) {
  const apps = getLeaveApplications();
  const idx = apps.findIndex(a => a.id === app.id);
  const now = new Date().toISOString();
  let updated: LeaveApplication;
  if (idx > -1) {
    updated = { ...app, updatedAt: now };
    apps[idx] = updated;
  } else {
    updated = { ...app, createdAt: now, updatedAt: now };
    apps.push(updated);
  }
  setStoredData(KEYS.LEAVE_APPLICATIONS, apps);

  if (isSupabaseConfigured) {
    supabase.from("leave_applications").upsert(camelToSnake(updated)).then(({ error }) => {
      if (error) console.error("Failed to save leave application to Supabase:", error);
    });
  }
}

export function deleteLeaveApplication(id: string) {
  const apps = getLeaveApplications();
  const filtered = apps.filter(a => a.id !== id);
  setStoredData(KEYS.LEAVE_APPLICATIONS, filtered);

  if (isSupabaseConfigured) {
    supabase.from("leave_applications").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("Failed to delete leave application from Supabase:", error);
    });
  }
}

/**
 * Sync from Supabase down to local state.
 */
export async function syncFromSupabase() {
  if (!isSupabaseConfigured) {
    console.log("Supabase is not configured yet. Running in offline/local storage mode.");
    return;
  }
  try {
    // Ensure default ADMIN and SI accounts exist with correct passwords and roles on Supabase
    const defaultAdmin: User = {
      id: "user-admin",
      username: "admin",
      password: "password123",
      name: "Institute Administrator",
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: "2026-01-01"
    };

    const defaultSI: User = {
      id: "user-si",
      username: "si",
      name: "Supervisor Instructor",
      role: UserRole.SUPERVISOR_INSTRUCTOR,
      isActive: true,
      createdAt: "2026-07-21",
      supervisorNameEnglish: "Supervisor Instructor",
      supervisorNameGujarati: "સુપરવાઇઝર ઇન્સ્ટ્રક્ટર"
    };

    const defaultSIProfile: SIProfile = {
      id: "sip-si",
      userId: "user-si",
      nameEnglish: "Supervisor Instructor",
      nameGujarati: "સુપરવાઇઝર ઇન્સ્ટ્રક્ટર",
      designationEnglish: "Supervisor Instructor",
      designationGujarati: "સુપરવાઇઝર ઇન્સ્ટ્રક્ટર",
      officeEnglish: "ITI Porbandar",
      officeGujarati: "આઈ.ટી.આઈ. પોરબંદર",
      departmentEnglish: "ITI Porbandar",
      departmentGujarati: "રોજગાર અને તાલીમ વિભાગ",
      employeeId: "EMP-SI",
      mobile: "+91 9876543210",
      addressEnglish: "ITI Porbandar Campus",
      addressGujarati: "આઈ.ટી.આઈ. પોરબંદર કેમ્પસ",
      salary: "53100",
      createdAt: "2026-07-21T00:00:00Z",
      updatedAt: "2026-07-21T00:00:00Z"
    };

    try {
      await Promise.all([
        supabase.from("users").upsert(camelToSnake(defaultAdmin)),
        supabase.from("users").upsert(camelToSnake(defaultSI)),
        supabase.from("si_profiles").upsert(camelToSnake(defaultSIProfile))
      ]);
      console.log("Default accounts and profile verified/upserted to Supabase successfully.");
    } catch (e) {
      console.warn("Could not auto-upsert default accounts to Supabase:", e);
    }

    const [
      { data: dbUsers, error: errUsers },
      { data: dbTrades, error: errTrades },
      { data: dbBatches, error: errBatches },
      { data: dbStudents, error: errStudents },
      { data: dbHistory, error: errHistory },
      { data: dbLogs, error: errLogs },
      { data: dbWorkingDays, error: errWorkingDays },
      { data: dbAttendance, error: errAttendance },
      { data: dbPromotions, error: errPromotions },
      { data: dbAssignmentHistory, error: errAssignmentHistory },
      { data: dbLetters, error: errLetters },
      { data: dbGeneralLetters, error: errGeneralLetters }
    ] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("trades").select("*"),
      supabase.from("batches").select("*"),
      supabase.from("students").select("*"),
      supabase.from("student_status_history").select("*"),
      supabase.from("audit_logs").select("*"),
      supabase.from("working_days").select("*"),
      supabase.from("attendance").select("*"),
      supabase.from("promotions").select("*"),
      supabase.from("assignment_history").select("*"),
      supabase.from("letters").select("*"),
      supabase.from("general_letters").select("*")
    ]);

    if (errUsers || errStudents) {
      console.warn("Could not query Supabase database. Schema may need initialization.", { errUsers, errStudents });
      return;
    }

    const hasData = (dbUsers && dbUsers.length > 0) || (dbStudents && dbStudents.length > 0);

    if (!hasData) {
      console.log("Supabase users table is empty. Seeding initial admin/supervisor accounts...");
      await supabase.from("users").insert(camelToSnake(DEFAULT_USERS));
      await supabase.from("trades").insert(camelToSnake(DEFAULT_TRADES));
      await supabase.from("batches").insert(camelToSnake(DEFAULT_BATCHES));
      await supabase.from("students").insert(camelToSnake(DEFAULT_STUDENTS));
      await supabase.from("student_status_history").insert(camelToSnake(DEFAULT_HISTORY));
      await supabase.from("audit_logs").insert(DEFAULT_LOGS.map(l => ({
        id: l.id,
        user_name: l.user,
        action: l.action,
        date: l.date,
        time: l.time
      })));

      // Re-fetch users and data
      const { data: seededUsers } = await supabase.from("users").select("*");
      const { data: seededTrades } = await supabase.from("trades").select("*");
      const { data: seededBatches } = await supabase.from("batches").select("*");
      const { data: seededStudents } = await supabase.from("students").select("*");
      const { data: seededHistory } = await supabase.from("student_status_history").select("*");
      const { data: seededLogs } = await supabase.from("audit_logs").select("*");

      MEMORY_DB[KEYS.USERS] = seededUsers ? snakeToCamel(seededUsers) : [];
      MEMORY_DB[KEYS.TRADES] = seededTrades ? snakeToCamel(seededTrades) : [];
      MEMORY_DB[KEYS.BATCHES] = seededBatches ? snakeToCamel(seededBatches) : [];
      MEMORY_DB[KEYS.STUDENTS] = seededStudents ? snakeToCamel(seededStudents) : [];
      MEMORY_DB[KEYS.HISTORY] = seededHistory ? snakeToCamel(seededHistory) : [];
      MEMORY_DB[KEYS.LOGS] = seededLogs ? snakeToCamel(seededLogs) : [];
      MEMORY_DB[KEYS.WORKING_DAYS] = [];
      MEMORY_DB[KEYS.ATTENDANCE] = [];
      MEMORY_DB[KEYS.PROMOTIONS] = [];
      MEMORY_DB[KEYS.ASSIGNMENT_HISTORY] = [];
      return;
    }

    MEMORY_DB[KEYS.USERS] = dbUsers ? snakeToCamel(dbUsers) : [];
    MEMORY_DB[KEYS.TRADES] = dbTrades ? snakeToCamel(dbTrades) : [];
    MEMORY_DB[KEYS.BATCHES] = dbBatches ? snakeToCamel(dbBatches) : [];
    MEMORY_DB[KEYS.STUDENTS] = dbStudents ? snakeToCamel(dbStudents) : [];
    MEMORY_DB[KEYS.HISTORY] = dbHistory ? snakeToCamel(dbHistory) : [];
    MEMORY_DB[KEYS.LOGS] = dbLogs ? snakeToCamel(dbLogs) : [];
    MEMORY_DB[KEYS.WORKING_DAYS] = dbWorkingDays ? snakeToCamel(dbWorkingDays) : [];
    MEMORY_DB[KEYS.ATTENDANCE] = dbAttendance ? snakeToCamel(dbAttendance) : [];
    MEMORY_DB[KEYS.PROMOTIONS] = dbPromotions ? snakeToCamel(dbPromotions) : [];
    MEMORY_DB[KEYS.ASSIGNMENT_HISTORY] = dbAssignmentHistory ? snakeToCamel(dbAssignmentHistory) : [];

    if (dbLetters) {
      dbLetters.forEach(l => {
        MEMORY_DB[`letter_template_${l.id}`] = l.template_text;
      });
    }
    if (dbGeneralLetters) {
      dbGeneralLetters.forEach(gl => {
        MEMORY_DB[`general_letter_${gl.id}`] = snakeToCamel(gl);
      });
    }

    // Sync S.I. Profiles and Leave Applications gracefully
    try {
      const { data: dbSIProfiles, error: errSIProfiles } = await supabase.from("si_profiles").select("*");
      if (!errSIProfiles && dbSIProfiles) {
        MEMORY_DB[KEYS.SI_PROFILES] = snakeToCamel(dbSIProfiles);
      }
    } catch (e) {
      console.warn("Could not sync si_profiles table from Supabase", e);
    }

    try {
      const { data: dbLeaveApps, error: errLeaveApps } = await supabase.from("leave_applications").select("*");
      if (!errLeaveApps && dbLeaveApps) {
        MEMORY_DB[KEYS.LEAVE_APPLICATIONS] = snakeToCamel(dbLeaveApps);
      }
    } catch (e) {
      console.warn("Could not sync leave_applications table from Supabase", e);
    }

    console.log("Supabase data successfully synced to MEMORY_DB.");
  } catch (err) {
    console.error("Exception during Supabase data sync:", err);
  }
}
