import * as React from 'react';
import { IColumn } from '../../../common/models/IColumn';
import { Button, FormControl } from 'react-bootstrap';
import FormGroup from '../../common/FormGroup';
import { iocContainer } from '../../../ioc.config';
import { TYPES } from '../../../ioc.types';
import { BoardsService } from '../../../services/app/Board/BoardsService';

interface IColumnProps {
    boardId: string;
}

interface IColumnState {
    columnName: string;
}

export default class NewColumn extends React.Component<IColumnProps, IColumnState> {

    private _boardsService: BoardsService = iocContainer.get<BoardsService>(TYPES.BoardsService);

    constructor(props: IColumnProps, context: any) {
        super(props, context);

        this.state = {
            columnName: '',
        };
    }

    public handleChange(e: any) {
        this.setState({columnName: e.target.value});
    }

    public createColumn() {
        let column: IColumn = {
            _id: null,
            name: this.state.columnName,
            tickets: [],
        };
        this._boardsService.addColumn(this.props.boardId, column);
        this.setState({
            columnName: '',
        });
    }

    public render() {
        return (
            <div className='new-column column-element'>
                <FormGroup>
                    <FormControl
                        type='text'
                        placeholder='Enter column name'
                        value={this.state.columnName}
                        onChange={this.handleChange.bind(this)}
                    />
                </FormGroup>
                <Button bsStyle='success' onClick={this.createColumn.bind(this)}>Add new column</Button>
            </div>
        );
    }

}
