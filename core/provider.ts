import { mockProvider } from '../providers/mockProvider';
import { gasProvider } from '../providers/gasProvider';
import { DataProvider } from './dataProvider';

// Switch to gasProvider for Google Apps Script Backend
export const provider: DataProvider = gasProvider;
// export const provider: DataProvider = mockProvider; // Uncomment to use local mock data