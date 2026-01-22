import { useState, useEffect } from 'react';

// Secure storage implementation using memory instead of localStorage
class SecureStorage {
  constructor() {
    this.storage = new Map();
    this.encryptionKey = this.generateKey();
  }

  generateKey() {
    // Generate a session-specific key
    return btoa(Math.random().toString(36) + Date.now().toString());
  }

  // Simple obfuscation (not true encryption but better than plain text)
  obfuscate(data) {
    try {
      const jsonStr = JSON.stringify(data);
      return btoa(jsonStr);
    } catch (error) {
      console.error('Failed to obfuscate data:', error);
      return null;
    }
  }

  deobfuscate(obfuscatedData) {
    try {
      const jsonStr = atob(obfuscatedData);
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to deobfuscate data:', error);
      return null;
    }
  }

  setItem(key, value) {
    if (this.isSensitiveKey(key)) {
      console.warn(`Attempted to store sensitive key: ${key}`);
      return false;
    }

    try {
      const obfuscatedValue = this.obfuscate(value);
      if (obfuscatedValue) {
        this.storage.set(key, obfuscatedValue);
        return true;
      }
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
    }
    return false;
  }

  getItem(key) {
    try {
      const obfuscatedValue = this.storage.get(key);
      if (obfuscatedValue) {
        return this.deobfuscate(obfuscatedValue);
      }
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
    }
    return null;
  }

  removeItem(key) {
    return this.storage.delete(key);
  }

  clear() {
    this.storage.clear();
  }

  getAllKeys() {
    return Array.from(this.storage.keys());
  }

  // Check if key contains sensitive information
  isSensitiveKey(key) {
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /auth/i,
      /credential/i,
      /hash/i,
      /session/i,
    ];

    return sensitivePatterns.some(pattern => pattern.test(key));
  }

  // Migrate from localStorage to secure storage
  migrateFromLocalStorage() {
    try {
      const keysToMigrate = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !this.isSensitiveKey(key)) {
          keysToMigrate.push(key);
        }
      }

      keysToMigrate.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          this.setItem(key, value);
          localStorage.removeItem(key);
        }
      });

      // Clear sensitive data from localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && this.isSensitiveKey(key)) {
          console.warn(`Removing sensitive data from localStorage: ${key}`);
          localStorage.removeItem(key);
        }
      }

      console.log(`Migrated ${keysToMigrate.length} items to secure storage`);
    } catch (error) {
      console.error('Failed to migrate from localStorage:', error);
    }
  }
}

// Create a singleton instance
const secureStorage = new SecureStorage();

// React hook for using secure storage
export const useSecureStorage = () => {
  const [storage, setStorage] = useState(secureStorage);

  useEffect(() => {
    // Migrate data from localStorage on first load
    storage.migrateFromLocalStorage();
  }, [storage]);

  return {
    setItem: storage.setItem.bind(storage),
    getItem: storage.getItem.bind(storage),
    removeItem: storage.removeItem.bind(storage),
    clear: storage.clear.bind(storage),
    getAllKeys: storage.getAllKeys.bind(storage),
  };
};

// Utility functions for common storage operations
export const storageUtils = {
  // User preferences (safe to store)
  setUserPreference: (key, value) => {
    return secureStorage.setItem(`pref_${key}`, value);
  },

  getUserPreference: (key, defaultValue = null) => {
    return secureStorage.getItem(`pref_${key}`) || defaultValue;
  },

  // UI state (safe to store)
  setUIState: (key, value) => {
    return secureStorage.setItem(`ui_${key}`, value);
  },

  getUIState: (key, defaultValue = null) => {
    return secureStorage.getItem(`ui_${key}`) || defaultValue;
  },

  // Clear all user data
  clearUserData: () => {
    const keys = secureStorage.getAllKeys();
    keys.forEach(key => {
      if (key.startsWith('pref_') || key.startsWith('ui_')) {
        secureStorage.removeItem(key);
      }
    });
  },
};

export default secureStorage;
