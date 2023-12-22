import { AxiosError } from 'axios';
import { useCallback, useMemo } from 'react';
import { useAlert } from 'react-alert';

import { makeApiGetAssignmentUsersList } from '@/api/assignment/individual/functions/makeApi';
import { UserSelectItem } from '@/api/assignment/individual/types/select';
import { getApiMessage } from '@/helpers/common';
import { useApi } from '@/hooks/api';
import { useFrontTranslation } from '@/hooks/useFrontTranslation';

interface GetAssignmentUsersListProps {
  onResponse?: (response: UserSelectItem[]) => void;
  onError?: (message: string, errorCode?: number) => void;
}

export const useApiGetAssignmentUsersList = ({ onResponse, onError }: GetAssignmentUsersListProps = {}) => {
  const alert = useAlert();
  const { t } = useFrontTranslation();

  return useApi({
    doRequest: useMemo(() => makeApiGetAssignmentUsersList({ alert, t }), [alert, t]),
    onError: useCallback(
      ({ response }: AxiosError) => onError && onError(getApiMessage(response) || 'Error', response?.status),
      [onError]
    ),
    onResponse
  });
};
