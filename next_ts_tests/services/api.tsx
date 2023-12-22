import axios from 'axios';
import { IncomingMessage } from 'http';
import jwt from 'jwt-decode';
import moment from 'moment';

import uuid from '@/services/uuid';
import { userAuthSlice } from '@/store/reducers/userAuthSlice';
import store from '@/store/store';

const instance = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

instance.interceptors.request.use(config => {
  const accessToken = store.getState().userAuth.data.accessToken;

  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      ...(accessToken ? { ['Authorization']: `Bearer ${accessToken}` } : {})
    }
  };
});

instance.interceptors.response.use(
  config => config,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && originalRequest.url !== '/auth/refreshAccessToken') {
      const { accessToken, refreshToken } = store.getState().userAuth.data;

      if (accessToken) {
        const accessTokenInfo = jwt<{ exp: number; tokenId: string }>(accessToken);
        const { exp, tokenId } = accessTokenInfo;
        const id = uuid.uuid;
        const diff = moment().diff(moment.unix(exp), 'minutes');

        if (diff < 0) return Promise.reject(error);

        try {
          const { data } = await instance.post('/auth/refreshAccessToken', {
            id,
            tokenId,
            refreshToken
          });

          store.dispatch(userAuthSlice.actions.updateAccessToken(data));

          return instance.request(originalRequest);
        } catch (e) {
          store.dispatch(userAuthSlice.actions.logoutUser());

          return Promise.reject(e);
        }
      }
    }

    return Promise.reject(error);
  }
);

const serverSidePropsBaseURL = (req: IncomingMessage, endpoint: string) => {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  return req ? `${protocol}://${req.headers.host}/api/v1${endpoint}` : '';
};

export { serverSidePropsBaseURL };

export default instance;
