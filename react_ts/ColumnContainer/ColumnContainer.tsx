import * as React from 'react';
import { IColumn } from '../../../common/models/IColumn';
import Column from '../Column/Column';
import NewColumn from '../Column/NewColumn';
import { iocContainer } from '../../../ioc.config';
import { TYPES } from '../../../ioc.types';
import ModalWindow from '../../common/ModalWindow';
import { ColumnService } from '../../../services/app/Column/ColumnService';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import DndService from '../../../services/DndService';

interface IColumnProps {
    boardId: string;
    columns: IColumn[];
    dndCallback: (columns: IColumn[]) => void;
}

interface IColumnState {
    showDeleteModal: boolean;
    columnToDeleteId: string | null;
    columns: IColumn[];
}

@DragDropContext(HTML5Backend)
export default class ColumnContainer extends React.Component<IColumnProps, IColumnState> {

    private initialState?: IColumnState = {
        showDeleteModal: false,
        columnToDeleteId: null,
        columns: this.props.columns,
    };

    private _columnsService?: ColumnService = iocContainer.get<ColumnService>(TYPES.ColumnService);

    constructor(props: any, context: any) {
        super(props, context);

        this.state = this.initialState;
    }

    public componentWillReceiveProps? (nextProps: IColumnProps) {
        this.setState({ columns: nextProps.columns });
    }

    public handleDeleteColumn? = (columnId: string): void => {
        this.setState({showDeleteModal: true, columnToDeleteId: columnId});
    };

    public abortDeleting? = (): void => {
        this.setState(this.initialState);
    };

    public applyDeleting? = (): void => {
        this._columnsService.removeColumn(this.state.columnToDeleteId, this.props.boardId);
        this.abortDeleting();
    };

    public saveColumnsOrder? = (newState: IColumnState): void => {
        this.props.dndCallback(newState.columns);
    };

    public render() {
        const {boardId} = this.props;

        return (
            <div className='column-container'>
                <NewColumn boardId={boardId}/>
                {
                    this.props.columns.map((col: IColumn, i: number) => (
                        <Column
                            column={col}
                            boardId={boardId}
                            key={col._id}
                            deleteColumn={this.handleDeleteColumn}
                            index={i}
                            id={col._id}
                            moveCard={DndService.moveCard.bind(
                                this,
                                'columns',
                                this.state,
                                this.saveColumnsOrder.bind(this)
                            )}
                        />
                    ))
                }
                <ModalWindow
                    showModal={this.state.showDeleteModal}
                    title={'Are you sure you want to delete this column?'}
                    onDecline={this.abortDeleting}
                    onApply={this.applyDeleting}
                />
            </div>
        );
    }

}
