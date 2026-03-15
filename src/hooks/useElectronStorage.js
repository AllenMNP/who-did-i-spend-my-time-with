import { useState, useEffect, useCallback } from 'react';

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

export function useElectronStorage(initialData = null) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [dataPath, setDataPath] = useState('');

  // Load data on mount
  useEffect(() => {
    async function loadInitialData() {
      if (isElectron) {
        try {
          const loaded = await window.electronAPI.loadData();
          if (loaded) {
            setData(loaded);
          }
          const path = await window.electronAPI.getDataPath();
          setDataPath(path);
        } catch (err) {
          console.error('Failed to load data from Electron:', err);
        }
      }
      setIsLoading(false);
    }
    loadInitialData();
  }, []);

  // Save data function
  const saveData = useCallback(async (newData) => {
    setData(newData);
    if (isElectron) {
      try {
        const result = await window.electronAPI.saveData(newData);
        if (!result.success) {
          console.error('Failed to save data:', result.error);
        }
        return result;
      } catch (err) {
        console.error('Failed to save data to Electron:', err);
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  }, []);

  return { data, saveData, isLoading, isElectron, dataPath };
}

export default useElectronStorage;
