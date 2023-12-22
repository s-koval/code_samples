import { from } from 'rxjs';

import { OrgAssignmentApiUpdatePayload } from '@/api/assignment/organisation/types/api';
import { tapAlertApiError } from '@/helpers/rx';
import { MakeApiCommonDependencies } from '@/types';

import * as api from './api';

export const makeApiGet =
  ({ t, alert }: MakeApiCommonDependencies) =>
  ({ assignmentId }: { assignmentId: string }) =>
    from(api.get(assignmentId)).pipe(tapAlertApiError({ t, alert }));

export const makeApiPut =
  ({ t, alert }: MakeApiCommonDependencies) =>
  ({ assignmentId, data }: { assignmentId: string; data: OrgAssignmentApiUpdatePayload }) =>
    from(api.put(assignmentId, data)).pipe(tapAlertApiError({ t, alert }));

export const makeApiUploadImage =
  ({ t, alert }: MakeApiCommonDependencies) =>
  ({ file, organisationId }: { file: File; organisationId: string }) =>
    from(api.uploadImage(file, organisationId)).pipe(tapAlertApiError({ t, alert }));
