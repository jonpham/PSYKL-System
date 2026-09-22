import { useCallback, useEffect, useRef, useState } from 'react';

import { type Appearance, readAppearance, writeAppearance } from '../preferences/appearance';
import { type Contrast, readContrast, writeContrast } from '../preferences/contrast';

interface UseAppearanceResult {
  appearance: Appearance;
  contrast: Contrast;
  setAppearance(choice: Appearance): void;
  setContrast(choice: Contrast): void;
}

/** Stamps the document root so the token sheet Spec 1 shipped can switch on it:
 * `system` stamps no theme at all and lets `prefers-color-scheme` decide, and
 * contrast composes with whichever appearance is in force. */
function applyToRoot(appearance: Appearance, contrast: Contrast): void {
  const root = document.documentElement;
  if (appearance === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', appearance);
  }
  if (contrast === 'increased') {
    root.setAttribute('data-contrast', 'increased');
  } else {
    root.removeAttribute('data-contrast');
  }
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
      applyToRoot(storedAppearance, storedContrast);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setAppearance = useCallback(
    (choice: Appearance) => {
      chosenRef.current = true;
      setAppearanceState(choice);
      applyToRoot(choice, contrast);
      void writeAppearance(choice);
    },
    [contrast],
  );

  const setContrast = useCallback(
    (choice: Contrast) => {
      chosenRef.current = true;
      setContrastState(choice);
      applyToRoot(appearance, choice);
      void writeContrast(choice);
    },
    [appearance],
  );

  return { appearance, contrast, setAppearance, setContrast };
}

export { useAppearance };
