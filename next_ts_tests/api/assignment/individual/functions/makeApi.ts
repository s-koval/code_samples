import { from } from 'rxjs';

import { tapAlertApiError } from '@/helpers/rx';
import { MakeApiCommonDependencies } from '@/types';

import * as api from './api';

export const makeApiGetAssignmentUsersList =
  ({ alert, t }: MakeApiCommonDependencies) =>
  (id: string) =>
    from(api.getAssignmentUsersList(id)).pipe(tapAlertApiError({ t, alert }));
