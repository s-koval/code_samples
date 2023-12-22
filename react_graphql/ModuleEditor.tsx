import React, {useContext} from 'react';
import {Row, Form, Tab, Nav, Button} from 'react-bootstrap';
import FormBuilder from "../form-builder/FormBuilder";
import ModuleSettingsEditor from "./ModuleSettingsEditor";
import {immutableMerge} from "~/utils/utils";
import {ToastContext, ProgramContext} from "~/contexts/ToastContext";

interface Props {
  module: any,
  setModuleState: any,
  deleteModuleCondition: any,
  sendModule: any,
  onSave: any,
}

const ModuleEditor: React.FunctionComponent<Props> =
  ({
     module,
     setModuleState,
     deleteModuleCondition,
     sendModule,
     onSave
   }) => {

    const programContext = useContext(ProgramContext);
    const recipientLists = programContext.program.recipientListss;

    const toastContext = useContext(ToastContext);
    let settingsFormRef;

    const onSettingsSave = (cb?: any) => {
      if (!settingsFormRef.reportValidity()) {
        toastContext.addToast({header: "Error", body: "You haven't filled out all the module's settings."});
      } else if (!module.module.title) {
        toastContext.addToast({header: "Error", body: "You haven't filled out the module's title."});
      } else if (!module.module.description) {
        toastContext.addToast({header: "Error", body: "You haven't filled out the module's description."});
      } else {
        onSave(cb);
      }
    };

    const canSend = () => {
      return !(module.module.content === null ||
        Object.keys(module.module.content.schema.properties).length === 0);
    }

    const onModuleSend = () => {
      //TODO: Hack to validate and save module before send
      onSettingsSave(() => {
        if (!canSend()) {
          toastContext.addToast({
            header: "Error",
            body: "You need to save at least 1 field in your module's content to send."
          });
        } else {
          sendModule(module)
        }
      });
    };

    const setFormRef = (r) => {
      settingsFormRef = r
    };

    return (
      <>
        <Row className="pb-1 mr-0" style={{justifyContent: "flex-end"}}>
          {canSend() &&
          <Button className='action-btn' variant="outline-primary" onClick={onModuleSend}>Send Module</Button>
          }
          <Button className="ml-1 action-btn" onClick={onSettingsSave}>Save Module</Button>
        </Row>
        <Tab.Container
          defaultActiveKey="content"
          id="module-editor"
          transition={false}>
          <div className='module-editor'>
            <Nav variant="tabs" fill className="justify-content-center">
              <Nav.Item>
                <Nav.Link eventKey="content">Content</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="settings">Settings</Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content>
              <Tab.Pane className="ml-3" eventKey="content" title="Content">
                <Form.Group>
                  <h5 className='module-editor-heading'>Title*</h5>
                  <Form.Control
                    value={module ? module.module.title || "" : ""}
                    placeholder='Post-Workshop Survey'
                    onChange={e => setModuleState(immutableMerge(
                      module, {
                        module: {...module.module, title: e.target.value}
                      }
                    ))}
                  />
                </Form.Group>
                <Form.Group>
                  <h5 className='module-editor-heading'>Description*</h5>
                  <Form.Control
                    as='textarea'
                    value={module ? module.module.description || "" : ""}
                    placeholder='Your feedback helps us improve...'
                    onChange={e => setModuleState(immutableMerge(
                      module, {
                        module: {
                          ...module.module,
                          description: (e.target as HTMLInputElement).value
                        }
                      }
                    ))}
                  />
                </Form.Group>
                <Form.Group>
                  <h5 className='module-editor-heading'>Content</h5>
                  <FormBuilder
                    schema={module.module.content ? module.module.content.schema : undefined}
                    uiSchema={module.module.content ? module.module.content.uiSchema : undefined}
                    tagList={module.module_variables ? JSON.parse(module.module_variables) : null}
                    answerList={module.module_answers ? JSON.parse(module.module_answers) : null}
                    enableCorAnswer={true}
                    recipientLists={recipientLists}
                    onSave={(schema, uiSchema) => setModuleState(immutableMerge(
                      module, {
                        module: immutableMerge(
                          module.module, {
                            content: {
                              schema: schema,
                              uiSchema: uiSchema
                            }
                          }
                        )
                      }
                    ))}
                  />
                </Form.Group>
              </Tab.Pane>
              <Tab.Pane eventKey="settings" title="Settings">
                <ModuleSettingsEditor
                  module={module}
                  onChange={d => setModuleState(d)}
                  deleteModuleCondition={deleteModuleCondition}
                  setFormRef={setFormRef}
                />
              </Tab.Pane>
            </Tab.Content>
          </div>
        </Tab.Container>
      </>
    );
  };

export default ModuleEditor;
