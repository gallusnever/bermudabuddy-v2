import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth-context';
import { yardState, UnifiedYardState } from '../lib/unified-yard-state';

export function useYardState() {
  const { user } = useAuth();
  const [state, setState] = useState<UnifiedYardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      if (!initialized) {
        setLoading(true);
        try {
          // Initialize with user ID if logged in, or 'local' for anonymous
          await yardState.initialize(user?.id || 'local');
          const currentState = yardState.getState();
          setState(currentState);
          setInitialized(true);
        } catch (error) {
          console.error('Failed to initialize yard state:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    init();
  }, [user?.id, initialized]);

  const updateState = async (updates: Partial<UnifiedYardState>) => {
    const success = await yardState.update(updates);
    if (success) {
      setState(yardState.getState());
    }
    return success;
  };

  const reload = async () => {
    setLoading(true);
    try {
      await yardState.load();
      setState(yardState.getState());
    } catch (error) {
      console.error('Failed to reload yard state:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    state,
    loading,
    updateState,
    reload,
  };
}