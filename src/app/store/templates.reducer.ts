import { createReducer, on } from '@ngrx/store';
import * as TemplatesActions from './templates.actions';

export interface TemplatesState { templates: any[]; loading: boolean; error?: any }

export const initialState: TemplatesState = { templates: [], loading: false };

export const templatesReducer = createReducer(
  initialState,
  on(TemplatesActions.loadTemplates, state => ({ ...state, loading: true })),
  on(TemplatesActions.loadTemplatesSuccess, (state, { templates }) => ({ ...state, loading: false, templates })),
  on(TemplatesActions.loadTemplatesFailure, (state, { error }) => ({ ...state, loading: false, error }))
);
