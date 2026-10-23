// Spark Panic - Safe LocalStorage Manager for State & Progress

const STORAGE_KEY = 'spark_panic_save_v1';

const DEFAULT_DATA = {
  unlockedLevel: 1,
  levelStars: {}, // { 1: 3, 2: 2 }
  levelHighScores: {}, // { 1: 12500 }
  endlessHighScore: 0,
  endlessMaxWave: 0,
  totalSparksPopped: 0,
  maxCombo: 0,
  soundMuted: false,
  hapticsEnabled: true
};

class StorageManager {
  constructor() {
    this.memoryData = { ...DEFAULT_DATA };
    this.isStorageAvailable = this.checkStorage();
    this.load();
  }

  checkStorage() {
    try {
      const testKey = '__sp_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  load() {
    if (!this.isStorageAvailable) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.memoryData = { ...DEFAULT_DATA, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load save data from localStorage, using memory data', e);
    }
  }

  save() {
    if (!this.isStorageAvailable) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryData));
    } catch (e) {
      console.warn('Could not save data to localStorage', e);
    }
  }

  getUnlockedLevel() {
    return this.memoryData.unlockedLevel || 1;
  }

  unlockNextLevel(currentLevel) {
    if (currentLevel >= this.memoryData.unlockedLevel) {
      this.memoryData.unlockedLevel = Math.min(20, currentLevel + 1);
      this.save();
    }
  }

  recordLevelCompletion(level, score, stars) {
    const existingStars = this.memoryData.levelStars[level] || 0;
    if (stars > existingStars) {
      this.memoryData.levelStars[level] = stars;
    }

    const existingScore = this.memoryData.levelHighScores[level] || 0;
    if (score > existingScore) {
      this.memoryData.levelHighScores[level] = score;
    }

    this.unlockNextLevel(level);
    this.save();
  }

  recordEndlessScore(score, wave) {
    let newHigh = false;
    if (score > (this.memoryData.endlessHighScore || 0)) {
      this.memoryData.endlessHighScore = score;
      newHigh = true;
    }
    if (wave > (this.memoryData.endlessMaxWave || 0)) {
      this.memoryData.endlessMaxWave = wave;
    }
    this.save();
    return newHigh;
  }

  addSparksPopped(count) {
    this.memoryData.totalSparksPopped = (this.memoryData.totalSparksPopped || 0) + count;
    this.save();
  }

  recordCombo(combo) {
    if (combo > (this.memoryData.maxCombo || 0)) {
      this.memoryData.maxCombo = combo;
      this.save();
    }
  }

  getLevelStars(level) {
    return this.memoryData.levelStars[level] || 0;
  }

  getTotalStars() {
    return Object.values(this.memoryData.levelStars).reduce((sum, s) => sum + s, 0);
  }

  isSoundMuted() {
    return !!this.memoryData.soundMuted;
  }

  setSoundMuted(muted) {
    this.memoryData.soundMuted = !!muted;
    this.save();
  }

  getData() {
    return { ...this.memoryData };
  }

  resetAll() {
    this.memoryData = { ...DEFAULT_DATA };
    this.save();
  }
}

export const storage = new StorageManager();
