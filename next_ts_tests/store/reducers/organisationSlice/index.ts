import { createAsyncThunk, createSlice, current } from '@reduxjs/toolkit';

import { URLS } from '@/constants';
import { useMockResponse } from '@/constants/api';
import api from '@/services/api';
import { AppState } from '@/store/store';
import { DefaultState, StoreFetchStatus } from '@/store/types';
import { ListComparisonOperator, OrderType } from '@/types/api';
import { OrgAssignmentQuestionnaireStatuses } from '@/types/org-assignment/questionnaireStatuses';

import { domainsMockData } from './mock/email-domains.data';
import mockOrganisationProfileResponse from './mock/organisation-profile-mock.json';

type ListTimestampComparisonFilter = { operator: ListComparisonOperator; value: number /*timestamp*/ };

type OrgQuestionnaireAssignmentListFilters = {
  questionnaireTitle?: string;
  startsOn?: ListTimestampComparisonFilter;
  endsOn?: ListTimestampComparisonFilter;
  startsOnSort?: OrderType;
  endsOnSort?: OrderType;
};

interface FetchOrgQuestionnaireAssignmentListProps {
  filters?: OrgQuestionnaireAssignmentListFilters;
  limit?: number;
  offset?: number;
}

export interface OrgAssignmentQuestionnaireTableItem {
  id: string;
  questionnaireTitle: string;
  startsOn: number;
  endsOn: number;
  status: OrgAssignmentQuestionnaireStatuses;
  remindersCount: number;
}

export interface OrgAssignmentQuestionnaireTableResponse {
  data: null | {
    items: OrgAssignmentQuestionnaireTableItem[];
    count: number;
  };
  status: StoreFetchStatus;
  error?: string;
}

export interface OrganisationProfileLocation {
  city: string;
  country: string;
  address: string;
}

export interface OrganisationProfileDepartments {
  id: string;
  name: string;
}

export interface OrganisationProfileDomain {
  domain: string;
  status: number;
}

export interface OrganisationProfile {
  id: string;
  name: string;
  industry: string;
  type: string;
  size: string;
  status: string;
  owner: string;
  billingData: {
    contactFirstName: string | null;
    contactLastName: string | null;
    contactPhoneNumber: string | null;
    contactEmailAddress: string | null;
    companyName: string | null;
    companyType: string | null;
    companyVat: string | null;
    companyAddressCountry: string | null;
    companyAddressState: string | null;
    companyAddressCity: string | null;
    companyAddressStreet: string | null;
    companyAddressPostalCode: string | null;
    stripeId: string | null;
    xeroContactId: string | null;
    commitmentExpiryOn: string | null;
    variationUpdatedOn: string | null;
    balance: string | null;
    paymentMethod: string | null;
    planVariation: string | null;
    planVoucher: string | null;
  };
  settings: {
    is_demo: number;
    disconnected_from_billing: number;
    is_temporary: number;
    activation_step: number;
  };
  logo: string | null;
  domains: OrganisationProfileDomain[];
  locations: OrganisationLocation[];
  departments: OrganisationProfileDepartments[];
  createdOn: number;
  modifiedOn: number;
  createdBy: string;
  modifiedBy: string;
}

export type OrganisationEmailDomain = {
  id: string;
  name: string;
};

export type OrganisationLocation = {
  id: string;
  country: string;
  city: string;
  address: string;
};

export type OrganisationOwner = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

export interface OrganisationLocationsState extends DefaultState {
  data: OrganisationLocation[] | null;
}

export interface OrganisationProfileState extends DefaultState {
  data: OrganisationProfile | null;
}

export interface OrganisationOwnerState extends DefaultState {
  data: OrganisationOwner | null;
}

export interface OrganisationEmailDomainsState extends DefaultState {
  data: OrganisationEmailDomain[] | null;
}

export type OrganisationDepartments = any;

export interface OrganisationSize {
  id: string;
  name: string;
  min: number;
  max: number;
  createdOn: string;
  modifiedOn: string;
  createdBy: string;
  modifiedBy: string;
}

export interface OrganisationSizeState {
  data: OrganisationSize | null;
  status: StoreFetchStatus;
  error?: string;
}

export interface OrganisationState {
  organisationQuestionnaires: OrgAssignmentQuestionnaireTableResponse;
  organisationProfile: OrganisationProfileState;
  organisationDepartments: OrganisationDepartments;
  organisationLocations: OrganisationLocationsState;
  organisationOwner: OrganisationOwnerState;
  organisationSize: OrganisationSizeState;
  organisationEmailDomains: OrganisationEmailDomainsState;
}

const initialState: OrganisationState = {
  organisationQuestionnaires: {
    data: null,
    status: StoreFetchStatus.IDLE,
    error: undefined
  },
  organisationProfile: {
    data: null,
    status: StoreFetchStatus.IDLE,
    error: undefined
  },
  organisationDepartments: {
    data: null,
    status: StoreFetchStatus.IDLE,
    error: undefined
  },
  organisationLocations: {
    data: null,
    status: StoreFetchStatus.IDLE,
    error: undefined
  },
  organisationOwner: {
    data: null,
    status: StoreFetchStatus.IDLE,
    error: undefined
  },
  organisationSize: {
    data: null,
    status: StoreFetchStatus.IDLE,
    error: undefined
  },
  organisationEmailDomains: {
    data: null,
    status: StoreFetchStatus.IDLE,
    error: undefined
  }
};

export const organisationSlice = createSlice({
  name: 'organisation',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchOrganisationProfile.pending, state => {
        state.organisationProfile.status = StoreFetchStatus.LOADING;
      })
      .addCase(fetchOrganisationProfile.fulfilled, (state, action) => {
        state.organisationProfile.status = StoreFetchStatus.SUCCEEDED;
        state.organisationProfile.data = action.payload;
      })
      .addCase(fetchOrganisationProfile.rejected, (state, action) => {
        state.organisationProfile.status = StoreFetchStatus.FAILED;
        state.organisationProfile.error = action.error.message;
      })
      .addCase(updateOrganisationProfile.pending, state => {
        state.organisationProfile.status = StoreFetchStatus.LOADING;
      })
      .addCase(updateOrganisationProfile.fulfilled, state => {
        state.organisationProfile.status = StoreFetchStatus.SUCCEEDED;
      })
      .addCase(updateOrganisationProfile.rejected, (state, action) => {
        state.organisationProfile.status = StoreFetchStatus.FAILED;
        state.organisationProfile.error = action.error.message;
      })
      .addCase(fetchOrganisationsQuestionnaires.pending, state => {
        state.organisationQuestionnaires.status = StoreFetchStatus.LOADING;
      })
      .addCase(fetchOrganisationsQuestionnaires.fulfilled, (state, action) => {
        state.organisationQuestionnaires.status = StoreFetchStatus.SUCCEEDED;
        state.organisationQuestionnaires.data = action.payload;
      })
      .addCase(fetchOrganisationsQuestionnaires.rejected, (state, action) => {
        state.organisationQuestionnaires.status = StoreFetchStatus.FAILED;
        state.organisationQuestionnaires.error = action.error.message;
      })
      .addCase(fetchMoreOrganisationsQuestionnaires.pending, state => {
        state.organisationQuestionnaires.status = StoreFetchStatus.LOADING;
      })
      .addCase(fetchMoreOrganisationsQuestionnaires.fulfilled, (state, action) => {
        const currentItems = current(state.organisationQuestionnaires?.data?.items) || [];
        state.organisationQuestionnaires.status = StoreFetchStatus.SUCCEEDED;
        state.organisationQuestionnaires.data = {
          ...action.payload,
          items: [...currentItems, ...action.payload.items]
        };
      })
      .addCase(fetchMoreOrganisationsQuestionnaires.rejected, (state, action) => {
        state.organisationQuestionnaires.status = StoreFetchStatus.FAILED;
        state.organisationQuestionnaires.error = action.error.message;
      })
      .addCase(fetchDepartments.pending, state => {
        state.organisationDepartments.status = StoreFetchStatus.LOADING;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.organisationDepartments.status = StoreFetchStatus.SUCCEEDED;
        state.organisationDepartments.data = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.organisationDepartments.status = StoreFetchStatus.FAILED;
        state.organisationDepartments.error = action.error.message;
      })
      .addCase(fetchOrganisationLocations.pending, state => {
        state.organisationLocations.status = StoreFetchStatus.LOADING;
      })
      .addCase(fetchOrganisationLocations.fulfilled, (state, action) => {
        state.organisationLocations.status = StoreFetchStatus.SUCCEEDED;
        state.organisationLocations.data = action.payload;
      })
      .addCase(fetchOrganisationLocations.rejected, (state, action) => {
        state.organisationLocations.status = StoreFetchStatus.FAILED;
        state.organisationLocations.error = action.error.message;
      })
      .addCase(fetchOrganisationSize.pending, state => {
        state.organisationSize.status = StoreFetchStatus.LOADING;
      })
      .addCase(fetchOrganisationSize.fulfilled, (state, action) => {
        state.organisationSize.status = StoreFetchStatus.SUCCEEDED;
        state.organisationSize.data = action.payload;
      })
      .addCase(fetchOrganisationSize.rejected, (state, action) => {
        state.organisationSize.status = StoreFetchStatus.FAILED;
        state.organisationSize.error = action.error.message;
      })
      .addCase(fetchOrganisationOwner.pending, state => {
        state.organisationOwner.status = StoreFetchStatus.LOADING;
      })
      .addCase(fetchOrganisationOwner.fulfilled, (state, action) => {
        state.organisationOwner.status = StoreFetchStatus.SUCCEEDED;
        state.organisationOwner.data = action.payload;
      })
      .addCase(fetchOrganisationOwner.rejected, (state, action) => {
        state.organisationOwner.status = StoreFetchStatus.FAILED;
        state.organisationOwner.error = action.error.message;
      })
      .addCase(fetchOrganisationEmailDomains.pending, state => {
        state.organisationEmailDomains.status = StoreFetchStatus.LOADING;
      })
      .addCase(fetchOrganisationEmailDomains.fulfilled, (state, action) => {
        state.organisationEmailDomains.status = StoreFetchStatus.SUCCEEDED;
        state.organisationEmailDomains.data = action.payload;
      })
      .addCase(fetchOrganisationEmailDomains.rejected, (state, action) => {
        state.organisationEmailDomains.status = StoreFetchStatus.FAILED;
        state.organisationEmailDomains.error = action.error.message;
      });
  }
});

export const fetchOrganisationProfile = createAsyncThunk(
  'organisations/fetchOrganisationProfile',
  async (id: string) => {
    const response = await api.get(`${URLS.organisation.main}/${id}`);

    return response.data;
  }
);

export const fetchOrganisationLocations = createAsyncThunk(
  'organisations/fetchOrganisationLocations',
  async (id: string) => {
    const response = await api.get(URLS.organisation.locationsList.replace('{organisationId}', id));

    return response.data;
  }
);

export const fetchOrganisationSize = createAsyncThunk('organisations/fetchOrganisationSize', async (id: string) => {
  const { data } = await api.get(`${URLS.organisation.main}/size/${id}`);

  return data;
});

export const fetchOrganisationOwner = createAsyncThunk('organisations/fetchOrganisationOwner', async (id: string) => {
  const response = await api.get(URLS.organisation.owner.replace('{organisationId}', id));
  return response.data;
});

export const fetchOrganisationEmailDomains = createAsyncThunk('organisations/fetchEmailDomains', async (id: string) => {
  return domainsMockData;

  // todo: connect api
  // const response = await api.get(URLS.organisation.owner.replace('{organisationId}', id));
  // return response.data;
});

export const updateOrganisationProfile = createAsyncThunk(
  'organisations/updateOrganisationProfile',
  async (id: string, body: { [key: string]: any }) => {
    //if (useMockResponse) { todo: finish after the API complete
    return mockOrganisationProfileResponse.data;
    //}

    const response = await api.put(`${URLS.organisation.main}/details/${id}`, body);
    return response.data;
  }
);

export const fetchOrganisationsQuestionnaires = createAsyncThunk(
  'organisations/fetchOrganisationsQuestionnaires',
  async (opts: FetchOrgQuestionnaireAssignmentListProps = {}) => {
    const { filters = {}, limit = 10, offset = 0 } = opts;
    const response = await api.get(`${URLS.assignments.organisationsQuestionnaire}`, {
      params: {
        limit,
        offset,
        filters: JSON.stringify(filters)
      }
    });
    return response.data;
  }
);

export const fetchMoreOrganisationsQuestionnaires = createAsyncThunk(
  'organisations/fetchMoreOrganisationsQuestionnaires',
  async (opts: FetchOrgQuestionnaireAssignmentListProps = {}) => {
    const { filters = {}, limit = 10, offset = 0 } = opts;
    const response = await api.get(`${URLS.assignments.organisationsQuestionnaire}`, {
      params: {
        limit,
        offset,
        filters: JSON.stringify(filters)
      }
    });
    return response.data;
  }
);

export const fetchDepartments = createAsyncThunk('organisations/fetchDepartments', async (id: string) => {
  const response = await api.get(`${URLS.organisation}/department/my-select/${id}`);
  return response.data;
});

export const organisationQuestionnairesState = (state: AppState) =>
  state?.organisation?.organisationQuestionnaires.data;
export const organisationQuestionnairesStatusState = (state: AppState) =>
  state?.organisation?.organisationQuestionnaires.status;
export const organisationProfileState = (state: AppState) => state?.organisation?.organisationProfile.data;
export const organisationDepartmentsState = (state: AppState) => state?.organisation?.organisationDepartments.data;
export const organisationLocationsState = (state: AppState) => state?.organisation?.organisationLocations.data;
export const organisationOwnerState = (state: AppState) => state?.organisation?.organisationOwner.data;
export const organisationEmailDomainsState = (state: AppState) => state?.organisation?.organisationEmailDomains.data;
export const organisationSizeState = (state: AppState) => state?.organisation?.organisationSize.data;

export default organisationSlice.reducer;
