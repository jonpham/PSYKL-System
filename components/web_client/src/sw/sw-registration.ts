type RegisterPsyklSyncInput = {
  logger?: Pick<Console, 'warn'>;
  serviceWorkerReady?: Promise<ServiceWorkerRegistrationWithSync | Record<string, never>>;
};

type ServiceWorkerRegistrationWithSync = {
  sync: {
    register: (tag: string) => Promise<void>;
  };
};

const psyklSyncTag = 'psykl-sync';

async function registerPsyklSync(input: RegisterPsyklSyncInput = {}): Promise<void> {
  const logger = input.logger ?? console;
  const serviceWorkerReady = input.serviceWorkerReady ?? navigator.serviceWorker?.ready;
  if (!serviceWorkerReady) {
    return;
  }

  const registration = await serviceWorkerReady;
  if (!hasBackgroundSync(registration)) {
    return;
  }

  try {
    await registration.sync.register(psyklSyncTag);
  } catch (error) {
    logger.warn('Background Sync registration failed', error);
  }
}

function hasBackgroundSync(registration: unknown): registration is ServiceWorkerRegistrationWithSync {
  return (
    typeof registration === 'object' &&
    registration !== null &&
    'sync' in registration &&
    typeof registration.sync === 'object' &&
    registration.sync !== null &&
    'register' in registration.sync &&
    typeof registration.sync.register === 'function'
  );
}

export { registerPsyklSync };
export type { RegisterPsyklSyncInput };
