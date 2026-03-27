import { openDB, IDBPDatabase } from 'idb';
import { UserProgress, ExerciseResult } from '@drums/types/curriculum';

const DB_NAME = 'drum-tutor-db';
const DB_VERSION = 1;

const STORES = {
  USER_PROGRESS: 'userProgress',
  EXERCISE_RESULTS: 'exerciseResults',
  SETTINGS: 'settings',
} as const;

const DEFAULT_PROGRESS: UserProgress = {
  currentModule: 'module-0',
  completedLessons: [],
  exerciseResults: [],
  skillProfile: {
    timing: 50,
    dynamics: 50,
    independence: 50,
    speed: 50,
    musicality: 50,
  },
};

let dbInstance: IDBPDatabase | null = null;

/**
 * Initialize (or upgrade) the IndexedDB database.
 * Returns the database instance.
 */
async function initDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // User progress store — single record keyed by 'current'
      if (!db.objectStoreNames.contains(STORES.USER_PROGRESS)) {
        db.createObjectStore(STORES.USER_PROGRESS);
      }

      // Exercise results store — auto-incrementing, indexed by exerciseId
      if (!db.objectStoreNames.contains(STORES.EXERCISE_RESULTS)) {
        const resultStore = db.createObjectStore(STORES.EXERCISE_RESULTS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        resultStore.createIndex('exerciseId', 'exerciseId', { unique: false });
        resultStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Settings store — key-value pairs
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS);
      }
    },
  });

  return dbInstance;
}

/**
 * Save user progress to IndexedDB.
 */
async function saveProgress(progress: UserProgress): Promise<void> {
  const db = await initDB();
  await db.put(STORES.USER_PROGRESS, progress, 'current');
}

/**
 * Load user progress from IndexedDB.
 * Returns null if no saved progress exists.
 */
async function loadProgress(): Promise<UserProgress | null> {
  const db = await initDB();
  const progress = await db.get(STORES.USER_PROGRESS, 'current');
  return (progress as UserProgress) ?? null;
}

/**
 * Get the default user progress (for first-time users).
 */
function getDefaultProgress(): UserProgress {
  return structuredClone(DEFAULT_PROGRESS);
}

/**
 * Save an exercise result to IndexedDB.
 */
async function saveExerciseResult(result: ExerciseResult): Promise<void> {
  const db = await initDB();
  await db.add(STORES.EXERCISE_RESULTS, result);
}

/**
 * Get exercise results, optionally filtered by exercise ID.
 * Sorted by timestamp descending (newest first).
 */
async function getExerciseResults(exerciseId?: string): Promise<ExerciseResult[]> {
  const db = await initDB();

  let results: ExerciseResult[];

  if (exerciseId) {
    results = await db.getAllFromIndex(
      STORES.EXERCISE_RESULTS,
      'exerciseId',
      exerciseId
    );
  } else {
    results = await db.getAll(STORES.EXERCISE_RESULTS);
  }

  // Sort newest first
  results.sort((a, b) => b.timestamp - a.timestamp);
  return results;
}

/**
 * Save a setting to IndexedDB.
 */
async function saveSetting(key: string, value: unknown): Promise<void> {
  const db = await initDB();
  await db.put(STORES.SETTINGS, value, key);
}

/**
 * Get a setting from IndexedDB.
 */
async function getSetting<T = unknown>(key: string): Promise<T | undefined> {
  const db = await initDB();
  return db.get(STORES.SETTINGS, key) as Promise<T | undefined>;
}

export const storageService = {
  initDB,
  saveProgress,
  loadProgress,
  getDefaultProgress,
  saveExerciseResult,
  getExerciseResults,
  saveSetting,
  getSetting,
};
