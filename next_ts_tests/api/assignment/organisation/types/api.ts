import { OrgAssignment } from '@/api/assignment/organisation/types/assignment';

export type OrgAssignmentApiGetResponse = {
  assignment: OrgAssignment;
  maxResponseLimit: number;
  title: string;
};

export type OrgAssignmentApiUpdatePayload = Pick<
  OrgAssignment,
  | 'type'
  | 'restrictionType'
  | 'inviteType'
  | 'customLandingPage'
  | 'customExitPage'
  | 'customInviteEmail'
  | 'customRemindEmail'
  | 'customCancelEmail'
  | 'customExtendEmail'
  | 'startsOn'
  | 'endsOn'
>;
