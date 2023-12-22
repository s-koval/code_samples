import { UserSelectItem } from '@/api/assignment/individual/types/select';
import { URLS } from '@/constants';
import api from '@/services/api';

export const getAssignmentUsersList = (id: string) => {
  const url = URLS.assignments.individualListUsers.replace('{subjectId}', id);
  return api.get<UserSelectItem[]>(url);
};
