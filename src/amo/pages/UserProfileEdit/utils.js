import { MZA_LAUNCH_DATETIME } from 'amo/constants';

export const isMzaBranding = (): boolean => new Date() > MZA_LAUNCH_DATETIME;
