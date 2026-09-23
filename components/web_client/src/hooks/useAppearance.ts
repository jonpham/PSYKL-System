import { useCallback, useEffect, useRef, useState } from 'react';

import { type Appearance, readAppearance, writeAppearance } from '../preferences/appearance';
import { applyPreferences } from '../preferences/apply';
import { type Contrast, readContrast, writeContrast } from '../preferences/contrast';

interface UseAppearanceResult {
  appearance: Appearance;
  contrast: Contrast;
  setAppearance(choice: Appearance): void;
  setContrast(choice: Contrast): void;
}

function useAppearance(): UseAppearanceResult {
  const [appearance, setAppearanceState] = useState<Appearance>('system');
  const [contrast, setContrastState] = useState<Contrast>('standard');
  // A choice made while the stored values are still being read must win: the
  // read would otherwise land afterwards and undo it.
  const chosenRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([readAppearance(), readContrast()]).then(([storedAppearance, storedContrast]) => {
      if (cancelled || chosenRef.current) return;
      setAppearanceState(storedAppearance);
      setContrastState(storedContrast);
      applyPreferences(storedAppearance, storedContrast);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setAppearance = useCallback(
    (choice: Appearance) => {
      chosenRef.current = true;
      setAppearanceState(choice);
      applyPreferences(choice, contrast);
      void writeAppearance(choice);
    },
    [contrast],
  );

  const setContrast = useCallback(
    (choice: Contrast) => {
      chosenRef.current = true;
      setContrastState(choice);
      applyPreferences(appearance, choice);
      void writeContrast(choice);
    },
    [appearance],
  );

  return { appearance, contrast, setAppearance, setContrast };
}

export { useAppearance };
