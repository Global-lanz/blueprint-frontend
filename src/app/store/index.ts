import { provideStore } from '@ngrx/store';
import { templatesReducer } from './templates.reducer';

export const storeProviders = [provideStore({ templates: templatesReducer })];
