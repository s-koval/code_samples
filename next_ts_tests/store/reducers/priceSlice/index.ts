import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { URLS } from '@/constants';
import api from '@/services/api';
import { AppState } from '@/store/store';
import { StoreFetchStatus } from '@/store/types';

export enum PriceProductsKeys {
  inclusionMaturityIndex = 'inclusionMaturityIndex',
  clearAssured = 'clearAssured',
  clearLearning = 'clearLearning',
  flexPo = 'flexPo',
  coaching = 'coaching',
  clearTalents = 'clearTalents'
}

export interface IPriceProducts {
  inclusionMaturityIndex: number;
  clearAssured: number;
  clearLearning: number;
  flexPo: number;
  coaching: number;
  clearTalents: number;
}

export interface IPricePlan {
  name: string;
  products: IPriceProducts;
}

export interface IPriceData {
  id: string;
  paymentPeriodUnit: string;
  paymentPeriodValue: number;
  commitment: string;
  plan: IPricePlan;
  price: number;
}

export interface IPriceState {
  data: IPriceData[];
  status: StoreFetchStatus;
  error?: string;
}

const initialState: IPriceState = {
  data: [],
  status: StoreFetchStatus.IDLE,
  error: undefined
};

export const priceSlice = createSlice({
  name: 'price',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchBillingVariationPrices.pending, state => {
        state.status = StoreFetchStatus.LOADING;
      })
      .addCase(fetchBillingVariationPrices.fulfilled, (state, action) => {
        state.status = StoreFetchStatus.SUCCEEDED;
        state.data = action.payload;
      })
      .addCase(fetchBillingVariationPrices.rejected, (state, action) => {
        if (action.error.message !== 'Aborted') {
          state.status = StoreFetchStatus.FAILED;
          state.error = action.error.message;
        }
      })
      .addCase(fetchPrivateBillingVariationPrices.pending, state => {
        state.status = StoreFetchStatus.LOADING;
      })
      .addCase(fetchPrivateBillingVariationPrices.fulfilled, (state, action) => {
        state.status = StoreFetchStatus.SUCCEEDED;
        state.data = action.payload;
      })
      .addCase(fetchPrivateBillingVariationPrices.rejected, (state, action) => {
        if (action.error.message !== 'Aborted') {
          state.status = StoreFetchStatus.FAILED;
          state.error = action.error.message;
        }
      });
  }
});

export interface IVariationPricesFilters {
  paymentPeriodUnit: string;
  commitment: string;
  minSize: number;
  maxSize: number | null;
}

export const fetchBillingVariationPrices = createAsyncThunk(
  'price/fetchBillingVariationPrices',
  async (filters: IVariationPricesFilters, thunkAPI) => {
    const response = await api.get(URLS.billing.variationPrices, { params: { filters }, signal: thunkAPI.signal });

    return response.data;
  }
);

export interface IPrivateVariationPricesFilters {
  filters: {
    paymentPeriodUnit: string;
    commitment: string;
  };
  planType: string;
  voucherCode?: string;
}

export const fetchPrivateBillingVariationPrices = createAsyncThunk(
  'price/fetchPrivateBillingVariationPrices',
  async (params: IPrivateVariationPricesFilters, thunkAPI) => {
    const response = await api.get(URLS.billing.privateVariationPrices, {
      params,
      signal: thunkAPI.signal
    });

    return response.data;
  }
);

export const priceTableState = (state: AppState) => state?.price?.data;
export const priceStatusState = (state: AppState) => state?.price?.status;

export default priceSlice.reducer;
