import type { NotchPrompterAPI } from '@shared/types';

declare global {
  interface Window {
    notchPrompter?: NotchPrompterAPI;
  }
}

export {};
