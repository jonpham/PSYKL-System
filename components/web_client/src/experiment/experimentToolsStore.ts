const KEY = 'psykl:experiment-tools';

const listeners = new Set<() => void>();

/** Whether the floating experiment tools follow the developer onto production
 * routes. Opening any `/exp` surface turns them on; Close turns them off. It is
 * a property of this device — never synced, and absent for anyone who has never
 * opened an experiment, so production ships no developer chrome by default. */
const experimentToolsStore = {
  read(): boolean {
    try {
      return window.localStorage.getItem(KEY) === 'on';
    } catch {
      return false;
    }
  },

  write(on: boolean): void {
    try {
      if (on) {
        window.localStorage.setItem(KEY, 'on');
      } else {
        window.localStorage.removeItem(KEY);
      }
    } catch {
      // A developer convenience is not worth failing the interaction for.
    }

    listeners.forEach((listener) => listener());
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export { KEY as EXPERIMENT_TOOLS_KEY, experimentToolsStore };
