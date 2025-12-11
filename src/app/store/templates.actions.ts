import { createAction, props } from '@ngrx/store';

export const loadTemplates = createAction('[Templates] Load');
export const loadTemplatesSuccess = createAction('[Templates] Load Success', props<{ templates: any[] }>());
export const loadTemplatesFailure = createAction('[Templates] Load Failure', props<{ error: any }>());
