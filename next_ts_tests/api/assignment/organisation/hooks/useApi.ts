import { useMemo } from 'react';
import { useAlert } from 'react-alert';

import { useApi } from '@/hooks/api';
import { useFrontTranslation } from '@/hooks/useFrontTranslation';
import { UploadResponse } from '@/types';

import { makeApiGet, makeApiPut, makeApiUploadImage } from '../functions/makeApi';
import { OrgAssignmentApiGetResponse } from '../types/api';

export const useApiGet = ({ onResponse }: { onResponse: (response: OrgAssignmentApiGetResponse) => void }) => {
  const alert = useAlert();
  const { t } = useFrontTranslation();

  return useApi({
    doRequest: useMemo(() => makeApiGet({ t, alert }), [t, alert]),
    onResponse
  });
};

export const useApiPut = ({ onResponse }: { onResponse: () => void }) => {
  const alert = useAlert();
  const { t } = useFrontTranslation();

  return useApi({
    doRequest: useMemo(() => makeApiPut({ t, alert }), [t, alert]),
    onResponse
  });
};

export const useApiUploadImage = ({
  onResponse,
  onError
}: {
  onResponse: (response: UploadResponse) => void;
  onError?: () => void;
}) => {
  const alert = useAlert();
  const { t } = useFrontTranslation();

  return useApi({
    doRequest: useMemo(() => makeApiUploadImage({ t, alert }), [t, alert]),
    onResponse,
    onError
  });
};
