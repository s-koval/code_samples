import {gql} from 'graphql.macro';

export const CREATE_PROGRAM_MODULE_SENDS = gql`
  mutation createProgramModuleSends($input: CreateProgramModuleSendsInput!) {
    createProgramModuleSends(input: $input) {
      id
      programModule {
        id
      }
      learner {
        id
      }
      recipientList {
        id
      }
      reason
      channel
      subject
      message

      send_timestamp
      open_timestamp
      click_timestamp
      response_timestamp

      response_feedback
      response_rating
      response_data
    }
  }
`;

export const UPSERT_MODULE = gql`
  mutation upsertModule($input: UpsertModuleInput!) {
    upsertModule(input: $input) {
      id
      title
      description
      content
      programModules {
        id
        folder
        order
        module_variables
        module_answers
        recipientList {
          id
        }
        program {
          id
          tags {
            id
            label
          }
        }
        sends {
          id
          learner {
            id
          }
          reason
          channel
          subject
          message

          send_timestamp
          open_timestamp
          click_timestamp
          response_timestamp

          response_feedback
          response_rating
          response_data
        }
        module {
          id
          title
          description
          content
          reminder {
            id
            subject
            message
            frequency
            max_reminders
          }
          trigger {
            id
            start_timestamp
            start_timestamp_field
            frequency
            max_sends
          }
          conditions{
            id
            module_variable_key
            operator
            module_variable_value
            boolean_operator
            group
          }
          tags {
            id
            label
          }
        }
      }
    }
  }
`;

//Local apollo state queries
export const CURRENT_USER_PROFILE = gql`
  {
    userProfile @client{
      id
      picture_url
      type
    }
  }
`;
