import React, {useContext, useState, FunctionComponent} from "react";
import {useMutation, useQuery} from "@apollo/react-hooks";
import {Link} from "react-router-dom";
import {Row, Col, Button} from "react-bootstrap";
import _ from "lodash";
import {
  CREATE_PROGRAM_MODULE_SENDS,
  CURRENT_USER_PROFILE,
  DUPLICATE_PROGRAM_MODULES,
  UPDATE_PROGRAM_MODULES,
  UPSERT_MODULE
} from "~/graphql/queries";
import {ToastContext, ProgramContext} from "~/contexts";
import LoadingContainer from "~/components/shared/loading-container/LoadingContainer";
import UserTutorial from "~/components/shared/user-tutorial/UserTutorial";
import ModuleEditor from "./ModuleEditor";
import ProgramModuleViewer from "./ProgramModuleViewer";
import ModalList from "./popups/ModalList";
import UserAction from "./popups/actions";
import ModuleList from "./ModuleList";

interface Props {
  modules: any,
  setModules: any,
}

export const Modules: FunctionComponent<Props> =
  ({
     modules,
     setModules,
   }) => {

    const {data: {userProfile}} = useQuery(CURRENT_USER_PROFILE);

    const programContext = useContext(ProgramContext);
    const programId = programContext.program.id;

    const toastContext = useContext(ToastContext);

    const [userAction, setUserAction] = useState(null);
    const [userActionData, setUserActionData] = useState(null);
    const [delConditions, setDelConditions] = useState([]);

    const [upsertModulesMutation, {loading: mutationLoading, error: mutationError}] = useMutation(UPSERT_MODULE);
    const [sendMutation, {loading: sendMutationLoading, error: sendMutationError}] = useMutation(CREATE_PROGRAM_MODULE_SENDS);
    const [updateModulesMutation, {loading: updateMutationLoading, error: updateMutationError}] = useMutation(UPDATE_PROGRAM_MODULES);
    const [duplicateModulesMutation, {loading: duplicateMutationLoading, error: duplicateMutationMutationError}] = useMutation(DUPLICATE_PROGRAM_MODULES);

    const setModuleState = (module) => {
      let newState = modules.map(pm => {
        if (pm.id == module.id) {
          return _.cloneDeep(module);
        }
        return pm;
      });
      setModules(newState);
    };

    const getActiveModule = () => {
      return modules.find(pm => pm.is_active) || _.head(modules);
    };

    const setActiveModule = (module) => {
      const current = modules.find(pm =>
        module.folder && parseInt(pm.id) === parseInt(module.id))
      let newState = modules.map(
        pm => {
          pm.isExpanded = current && pm.folder === module.folder;
          pm.is_active = parseInt(pm.id) === parseInt(module.id);
          return pm;
        }
      );
      setModules(newState);
    };

    const setPropsActiveModule = (modules) => {
      const activeModule = getActiveModule();

      if (activeModule) {
        modules.map(pm => {
          if (typeof pm.module.content === "string") {
            pm.module.content = JSON.parse(pm.module.content);
          }
          if (pm.id === activeModule.id) {
            pm.is_active = true;
            if (!pm.recipientList) {
              pm.recipientList = programContext.program.recipientLists[0];
            }
          }
        });
      } else {
        modules[modules.length - 1].is_active = true;
      }
      return modules;
    };

    const setModulesState = (updatedModules, withFolders = []) => {
      setModules([
        ...updatedModules,
        ...withFolders
      ]);
    };

    const updateModule = (module, cb?: any) => {
      updateModulesMutation({
        variables: {
          input: {
            id: programId,
            programModules: {
              upsert: [{
                id: module.id,
                recipientList: {
                  connect: module.recipientList.id
                },
                module: {
                  upsert: {
                    id: module.module.id,
                    title: module.module.title,
                    description: module.module.description,
                    reminder: {
                      upsert: _.omit(module.module.reminder, '__typename')
                    },
                    trigger: {
                      upsert: _.omit(module.module.trigger, '__typename')
                    },
                    conditions: {
                      upsert: module.module.conditions.map((item) => {
                        return _.omit(item, '__typename');
                      })
                    },
                    content: module.module.content ? JSON.stringify(module.module.content) : null
                  }
                }
              }],

            }
          }
        }
      }).then(r => {
        toastContext.addToast({header: "Success!", body: "Saved"});
        const modules = setPropsActiveModule(r.data.updateProgramModules.programModules);
        setModulesState(modules);
        if (cb) cb(r);
      });
    };

    const sendModule = (module) => {
      sendMutation({
        variables: {
          input: {
            program_module_id: module.id
          }
        }
      }).then(r => {
        toastContext.addToast({header: "Success!", body: "Sent"});
      });
    };

    const addModule = () => {
      upsertModulesMutation({
        variables: {
          input: {
            title: "New Module",
            description: "Module description",
            owner: {
              connect: userProfile.id
            },
            programs: {
              connect: [programId]
            },
          }
        }
      }).then(r => {
        const newModules = setPropsActiveModule([...modules, ...r.data.upsertModule.programModules]);
        setModulesState(newModules);
      });
    };

    const saveModulesOrder = (newModules) => {
      const programModules = newModules.reduce(
        (acc, module) => {
          const {id, folder, order} = module;
          !module.isFolder && acc.push({id, folder, order});
          return acc;
        }, []
      );

      const withFolders = newModules.filter(pm => pm.isFolder).map(pm => {
        return {
          ...pm,
          module: {
            ...pm.module,
            title: pm.name
          },
          folder: null,
        }
      });

      setModulesState(newModules);
      updateModulesMutation({
        variables: {
          input: {
            id: programId,
            programModules: {
              upsert: programModules
            }
          }
        }
      }).then(r => {
        const modules = setPropsActiveModule(r.data.updateProgramModules.programModules);
        setModulesState(modules, withFolders);
      });
    };

    const deleteModules = (modules) => {
      updateModulesMutation({
        variables: {
          input: {
            id: programId,
            programModules: {
              delete: modules
            }
          }
        }
      }).then(r => {
        const modules = setPropsActiveModule(r.data.updateProgramModules.programModules);
        setModulesState(modules);
      });
    };

    const deleteModuleCondition = (conditionId) => {
      const newArray = [...delConditions, conditionId];
      setDelConditions(newArray);
    }

    const duplicateModules = (modules) => {
      duplicateModulesMutation({
        variables: {
          input: {
            id: programId,
            type: 'program',
            modules
          }
        }
      }).then(r => {
        const modules = r.data.duplicateProgramModules.programModules;
        modules[modules.length - 1].is_active = true;
        setModulesState(modules);
      });
    };

    const addFolder = (data) => {
      let newState = _.cloneDeep(modules);
      const id = Math.round(Math.random() * 1e6);
      newState = [
        {
          id,
          folder: null,
          isFolder: true,
          order: 0,
          module: {
            id,
            title: data.folder
          }
        },
        ...newState
      ];

      setModules(newState);
    };

    const onSave = (cb?: any) => {
      const apm = getActiveModule();
      updateModule(apm);
      upsertModulesMutation({
        variables: {
          input: {
            id: apm.module.id,
            conditions: {
              delete: delConditions
            },
          }
        }
      }).then(r => {
        if (cb && _.isFunction(cb)) cb(r);
      });

    };

    const setUserActionHandler = (action, actionData) => {
      const actionChanged = action !== userAction ||
        (actionData != null && !_.isEqual(actionData, userActionData));

      if (actionChanged) {
        setUserAction(action);
        setUserActionData(actionData || null);
      }
    };

    return (
      <LoadingContainer className="pl-0 pr-0 pt-4"
                        loading={[mutationLoading, duplicateMutationLoading, sendMutationLoading, updateMutationLoading]}
                        error={[mutationError, duplicateMutationMutationError, sendMutationError, updateMutationError]}>
        <Row className='pivot-modules'>
          <UserTutorial type="module"/>
          <Col md={3} className="p-0 mr-2">
            <div className='modules-settings-col'>
              <div className='modules-settings-header'>
                <div className='modules-settings-title'>Modules</div>
                <Link
                  className='modules-settings-link'
                  to={window.location.pathname.replace('content', 'settings')}>
                  Edit Settings
                </Link>
              </div>

              <ModuleList modules={modules}
                          setActiveModule={setActiveModule}
                          activeModule={getActiveModule()}
                          saveModulesOrder={saveModulesOrder}
                          deleteModules={deleteModules}
                          duplicateModules={duplicateModules}
                          setUserAction={setUserActionHandler}
              />
              <div className="buttons-container">
                <Button className='action-btn' variant="outline-primary" onClick={() => {
                  setUserActionHandler(UserAction.EDIT_FOLDER, {
                    callback: addFolder
                  });
                }}>
                  + Folder
                </Button>
                <Button className="module-tutorial action-btn" variant="outline-primary" onClick={addModule}>
                  + Module
                </Button>
              </div>
            </div>
          </Col>
          <Col>
            {!!modules?.length &&
            (!(getActiveModule().sends?.length > 0)
                ? <ModuleEditor
                  module={getActiveModule()}
                  setModuleState={setModuleState}
                  sendModule={sendModule}
                  deleteModuleCondition={deleteModuleCondition}
                  onSave={onSave}
                />
                : <ProgramModuleViewer
                  programModule={getActiveModule()}
                />
            )}
          </Col>
        </Row>
        <ModalList
          {...{
            userAction,
            userActionData,
            setUserAction: setUserActionHandler
          }}
        />
      </LoadingContainer>
    )
  };

export default Modules;
