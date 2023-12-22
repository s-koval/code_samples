import { OrgAssignmentTypeQuestionnaire, OrgAssignmentTypes } from '@/types/org-assignment/assignmentTypes';
import { OrgAssignmentCustomEmailFields, OrgAssignmentReminder } from '@/types/org-assignment/customEmailFields';
import { OrgAssignmentCustomLandingExitPage } from '@/types/org-assignment/customPageFields';
import { OrgAssignmentInviteTypes } from '@/types/org-assignment/inviteTypes';
import { OrgAssignmentRestrictionTypes } from '@/types/org-assignment/restrictionTypes';

export type OrgAssignment = {
  id: string;
  organisationId: string;
  type: OrgAssignmentTypes;
  restrictionType: OrgAssignmentRestrictionTypes;
  inviteType: OrgAssignmentInviteTypes;
  customLandingPage: OrgAssignmentCustomLandingExitPage;
  customExitPage: OrgAssignmentCustomLandingExitPage;
  customInviteEmail: OrgAssignmentCustomEmailFields;
  customRemindEmail: OrgAssignmentCustomEmailFields;
  customCancelEmail: OrgAssignmentCustomEmailFields;
  customExtendEmail: OrgAssignmentCustomEmailFields;
  reminders: OrgAssignmentReminder[];
  startsOn: number;
  endsOn: number;
  assignedOn: number;
  assignedBy: string;
  modifiedOn: number;
  modifiedBy: string;
};

export type OrgQuestionnaireAssignment = Omit<OrgAssignment, 'type'> & {
  type: OrgAssignmentTypeQuestionnaire;
  reminders: OrgAssignmentReminder[];
};
