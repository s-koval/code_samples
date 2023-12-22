import * as React from 'react';
import { ControlLabel, FormGroup } from 'react-bootstrap';
import { iocContainer } from '../../../ioc.config';
import { TYPES } from '../../../ioc.types';
import { ITicket } from '../../../common/models/ITicket';
import { ColumnService } from '../../../services/app/Column/ColumnService';
import ValidatedInput, { IValidatedField } from '../../common/ValidatedInput';
import TextInput from '../../common/TextInput';
import { minLengthValidator } from '../../../common/helpers/validators';
import ButtonSet from '../../common/ButtonSet';
import Button from '../../common/Button';

interface INewTicketProps {
    columnId?: string;
    boardId?: string;
    cb: () => void;
    ticket?: ITicket;
}

interface INewTicketState {
    _id: string | null;
    title: IValidatedField;
    description: IValidatedField;
}

export default class NewTicket extends React.Component<INewTicketProps, INewTicketState> {

    private initialState: INewTicketState = {
        _id: null,
        title: {
            value: '',
            isValid: false,
        },
        description: {
            value: '',
            isValid: true,
        },
    };

    private _columnService: ColumnService = iocContainer.get<ColumnService>(TYPES.ColumnService);

    constructor(props: INewTicketProps) {
        super(props);

        this.state = this.initialState;
    }

    public componentWillReceiveProps (nextProps: INewTicketProps): void {
        if (nextProps.ticket) {
            this.setState({
                _id: nextProps.ticket._id,
                title: {
                    value: nextProps.ticket.title,
                    isValid: true,
                },
                description: {
                    value: nextProps.ticket.description,
                    isValid: true,
                },
            });
        }
    }

    public reset = (): void => {
        this.setState(this.initialState);
    };

    public onChangeField (field: string, fieldState: IValidatedField) {
        this.setState({
            ...this.state,
            [field]: fieldState,
        });
    }

    public addTicket = (): void => {
        const {boardId, columnId} = this.props;
        const {_id, title, description} = this.state;

        const ticket: ITicket = {
            _id,
            title: title.value,
            description: description.value,
            creator: '',
            comments: [],
            assigners: [],
        };

        if (ticket._id) {
            this._columnService.editTicket(boardId, columnId, ticket)
                .then(this.props.cb);
        } else {
            this._columnService.addTicket(boardId, columnId, ticket)
                .then(this.props.cb);
        }
    };

    private _checkValidStatus () {
        return this.state.title.isValid && this.state.description.isValid;
    }

    public render() {
        const {_id, title, description} = this.state;

        return (
            <div className='new-ticket'>
                <div className={'new-ticket-form collapsein'}>
                    <form className='ticket-form'>
                        <ValidatedInput
                            id={'ticket-title'}
                            value={title.value}
                            type={'text'}
                            name={'title'}
                            placeholder={'Enter title...'}
                            label={'Title'}
                            onChange={this.onChangeField.bind(this, 'title')}
                            validators={[minLengthValidator.bind(null, 1)]}
                        />
                        <ValidatedInput
                            id={'ticket-description'}
                            value={description.value}
                            type={'text'}
                            name={'description'}
                            placeholder={'Enter description...'}
                            label={'Description'}
                            onChange={this.onChangeField.bind(this, 'description')}
                            validators={[]}
                        />
                        <FormGroup>
                            <ButtonSet>
                                <Button
                                    type='button'
                                    bootstrapBtn={this._checkValidStatus() && 'success'}
                                    onClick={this.addTicket}
                                >
                                    {_id ? 'Edit Ticket' : 'Add Ticket'}
                                </Button>
                                <Button
                                    type='button'
                                    bootstrapBtn={'primary'}
                                    onClick={this.props.cb}
                                    position={'right'}
                                >
                                    Cancel
                                </Button>
                            </ButtonSet>
                        </FormGroup>
                    </form>
                </div>
            </div>
        );
    }

}
