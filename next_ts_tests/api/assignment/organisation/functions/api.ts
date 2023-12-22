import FormData from 'form-data';

import { URLS } from '@/constants';
import api from '@/services/api';
import { MutationResponse, UploadResponse } from '@/types';

import { OrgAssignmentApiGetResponse, OrgAssignmentApiUpdatePayload } from '../types/api';

export const get = (assignmentId: string) => {
  const url = URLS.organisationAssignment.single.replace('{assignmentId}', assignmentId);
  return api.get<OrgAssignmentApiGetResponse>(url);
};

export const put = (assignmentId: string, data: OrgAssignmentApiUpdatePayload) => {
  const url = URLS.organisationAssignment.single.replace('{assignmentId}', assignmentId);
  return api.put<MutationResponse>(url, data);
};

export const uploadImage = (file: File, organisationId: string) => {
  const url = URLS.organisationAssignment.uploadImage.replace('{organisationId}', organisationId);
  const formData = new FormData();
  formData.append('file', file);
  return api.postForm<UploadResponse>(url, formData);
};
