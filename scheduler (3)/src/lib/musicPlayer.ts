import { MusicPlaybackMode, MusicTrack } from '../types';

const DB_NAME = 'scheduly-music-db';
const STORE_NAME = 'tracks';
const PLAYER_STATE_KEY = 'scheduly_music_player_state';
const CUSTOM_TRACKS_KEY = 'scheduly_custom_music_tracks';

export interface MusicPlayerState {
  currentTrackId: string | null;
  playbackMode: MusicPlaybackMode;
  volume: number;
  isPlaying: boolean;
}

const createDbRequest = (name: string): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = window.indexedDB.open(name, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open music database'));
  });
};

const readPersistedCustomTracks = (): Array<MusicTrack & { source: 'custom' | 'url'; fileName?: string }> => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_TRACKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<MusicTrack & { source?: 'custom' | 'url'; fileName?: string }>;
    return Array.isArray(parsed) ? parsed.filter((track) => Boolean(track?.id)) : [];
  } catch (error) {
    console.error('Failed to load persisted custom track metadata', error);
    return [];
  }
};

const writePersistedCustomTracks = (tracks: Array<MusicTrack & { source: 'custom' | 'url'; fileName?: string }>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CUSTOM_TRACKS_KEY, JSON.stringify(tracks));
};

const readAllTracks = async (): Promise<MusicTrack[]> => {
  const db = await createDbRequest(DB_NAME);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const records = (request.result ?? []) as Array<MusicTrack & { blob?: Blob; fileName?: string }>;
      const tracks = records
        .filter((record) => Boolean(record))
        .map((record) => {
          if (record.blob) {
            const objectUrl = URL.createObjectURL(record.blob);
            return {
              id: record.id,
              name: record.name || record.fileName || 'Custom track',
              url: objectUrl,
              isCustom: true,
              source: 'custom' as const,
              fileName: record.fileName,
            } satisfies MusicTrack;
          }

          return {
            id: record.id,
            name: record.name || 'Custom track',
            url: record.url,
            isCustom: true,
            source: 'custom' as const,
            fileName: record.fileName,
          } satisfies MusicTrack;
        });
      resolve(tracks);
    };
    request.onerror = () => reject(request.error ?? new Error('Could not list custom tracks'));
  });
};

export const listCustomTracks = async (): Promise<MusicTrack[]> => {
  try {
    const persistedTracks = readPersistedCustomTracks();
    const dbTracks = await readAllTracks();
    const dbById = new Map(dbTracks.map((track) => [track.id, track]));

    return persistedTracks.map((track) => {
      const dbTrack = dbById.get(track.id);
      if (dbTrack) {
        return dbTrack;
      }
      return {
        id: track.id,
        name: track.name || 'Custom track',
        url: track.url || '',
        isCustom: true,
        source: track.source === 'custom' ? 'custom' : 'url',
        fileName: track.fileName,
      } satisfies MusicTrack;
    });
  } catch (error) {
    console.error('Failed to load custom tracks', error);
    return [];
  }
};

export const saveCustomTrack = async (track: MusicTrack, file?: File | Blob): Promise<MusicTrack> => {
  const db = await createDbRequest(DB_NAME);
  const id = track.id || `custom-${Date.now()}`;
  const record = {
    id,
    name: track.name,
    url: track.url,
    fileName: track.fileName,
    blob: file,
    isCustom: true,
    source: 'custom' as const,
  };
  const persistedTracks = readPersistedCustomTracks().filter((item) => item.id !== id);
  persistedTracks.push({
    id,
    name: track.name,
    url: track.url,
    isCustom: true,
    source: file ? 'custom' : 'url',
    fileName: track.fileName,
  });
  writePersistedCustomTracks(persistedTracks);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);
    request.onsuccess = () => resolve({
      id,
      name: track.name,
      url: file ? URL.createObjectURL(file) : track.url,
      isCustom: true,
      source: 'custom' as const,
      fileName: track.fileName,
    });
    request.onerror = () => reject(request.error ?? new Error('Could not save custom track'));
  });
};

export const removeCustomTrack = async (trackId: string): Promise<void> => {
  const persistedTracks = readPersistedCustomTracks().filter((item) => item.id !== trackId);
  writePersistedCustomTracks(persistedTracks);
  const db = await createDbRequest(DB_NAME);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(trackId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Could not remove custom track'));
  });
};

export const loadMusicPlayerState = (): MusicPlayerState => {
  if (typeof window === 'undefined') {
    return {
      currentTrackId: null,
      playbackMode: 'loop_all',
      volume: 0.3,
      isPlaying: false,
    };
  }

  try {
    const raw = window.localStorage.getItem(PLAYER_STATE_KEY);
    if (!raw) {
      return {
        currentTrackId: null,
        playbackMode: 'loop_all',
        volume: 0.3,
        isPlaying: false,
      };
    }
    const parsed = JSON.parse(raw) as Partial<MusicPlayerState>;
    return {
      currentTrackId: typeof parsed.currentTrackId === 'string' ? parsed.currentTrackId : null,
      playbackMode: parsed.playbackMode === 'play_once' || parsed.playbackMode === 'loop_one' || parsed.playbackMode === 'loop_all' || parsed.playbackMode === 'shuffle'
        ? parsed.playbackMode
        : 'loop_all',
      volume: typeof parsed.volume === 'number' && !Number.isNaN(parsed.volume) ? parsed.volume : 0.3,
      isPlaying: typeof parsed.isPlaying === 'boolean' ? parsed.isPlaying : false,
    };
  } catch (error) {
    console.error('Failed to load music player state', error);
    return {
      currentTrackId: null,
      playbackMode: 'loop_all',
      volume: 0.3,
      isPlaying: false,
    };
  }
};

export const saveMusicPlayerState = (state: MusicPlayerState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(state));
};

export const resetMusicPlayerState = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PLAYER_STATE_KEY);
};

export const getNextTrackId = ({
  tracks,
  currentTrackId,
  playbackMode,
  currentIndex,
  random = Math.random,
}: {
  tracks: MusicTrack[];
  currentTrackId: string | null;
  playbackMode: MusicPlaybackMode;
  currentIndex: number;
  random?: () => number;
}) => {
  if (!tracks.length) return null;

  if (playbackMode === 'loop_one') {
    return currentTrackId ?? tracks[0].id;
  }

  if (playbackMode === 'shuffle') {
    const available = tracks.filter((track) => track.id !== currentTrackId);
    if (!available.length) return currentTrackId ?? tracks[0].id;
    const index = Math.floor(random() * available.length);
    return available[index].id;
  }

  if (playbackMode === 'play_once') {
    return tracks[currentIndex + 1]?.id ?? null;
  }

  const nextIndex = currentIndex + 1;
  return tracks[nextIndex] ? tracks[nextIndex].id : tracks[0].id;
};
