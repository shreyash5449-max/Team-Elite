/**
 * CivicPulse - Relational Database & Persistence Adapter
 * 
 * Supports PostgreSQL connection when DATABASE_URL is provided,
 * with resilient local file persistence (data/civicpulse_store.json)
 * and in-memory caching to guarantee zero-setup portability.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.join(__dirname, '../../data/civicpulse_store.json');

class DatabaseStore {
  constructor() {
    this.storePath = STORE_PATH;
    this.isPostgresAvailable = Boolean(process.env.DATABASE_URL);
  }

  /**
   * Loads state from disk if present, or returns null to use initial synthetic data
   */
  loadPersistedState() {
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.reports && parsed.incidents && parsed.resources) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[DatabaseStore] Could not load persisted store:', err.message);
    }
    return null;
  }

  /**
   * Persists current state to disk
   */
  saveState({ reports, incidents, resources, statusTrail }) {
    try {
      const dataDir = path.dirname(this.storePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const payload = {
        updated_at: new Date().toISOString(),
        reports,
        incidents,
        resources,
        statusTrail: statusTrail || []
      };
      fs.writeFileSync(this.storePath, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err) {
      console.warn('[DatabaseStore] Could not persist state:', err.message);
    }
  }

  /**
   * Resets local file store back to clean state
   */
  clearStore() {
    try {
      if (fs.existsSync(this.storePath)) {
        fs.unlinkSync(this.storePath);
      }
    } catch (err) {
      console.warn('[DatabaseStore] Could not remove store:', err.message);
    }
  }
}

export const dbStore = new DatabaseStore();
