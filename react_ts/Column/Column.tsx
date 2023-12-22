import * as React from 'react';
import Ticket from '../Ticket/Ticket';
import { ITicket } from '../../../common/models/ITicket';
import { IColumn } from '../../../common/models/IColumn';
import NewTicket from '../Ticket/NewTicket';
import RemoveIcon from '../../common/RemoveIcon';
import { DragSource, DropTarget, DndComponent } from 'react-dnd';
import DndService from '../../../services/DndService';

interface IColumnProps {
    column?: IColumn;
    deleteColumn?: (columnId: string) => void;
    boardId?: string;
    key?: string;
    index?: number;
    id?: string;
    moveCard?: any;
    isDragging?: boolean;
    connectDragSource?: any;
    connectDropTarget?: any;
}

interface IColumnState {
    isFormHidden: boolean;
}

@DropTarget('card', DndService.dropTarget(), connect => ({
    connectDropTarget: connect.dropTarget(),
}))
@DragSource('card', DndService.dragSource(), (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
}))
export default class Column extends React.Component<IColumnProps, IColumnState> {

    constructor(props: any, context: any) {
        super(props, context);

        this.state = {
            isFormHidden: true,
        };
    }

    public deleteColumn? = (): void => {
        this.props.deleteColumn(this.props.column._id);
    };

    public showForm? = (): void => {
        this.setState({ isFormHidden: false });
    };

    public hideForm? = (): void => {
        this.setState({ isFormHidden: true });
    };

    public render() {
        const { column, boardId, isDragging, connectDragSource, connectDropTarget } = this.props;
        const tickets: ITicket[] = [...column.tickets];
        const opacity: number = isDragging ? 0 : 1;

        return connectDragSource(connectDropTarget(
            <div className='column column-element' style={{opacity}}>
                <RemoveIcon onClick={this.deleteColumn}/>
                <div className='column-title text-overflow'>
                    {column.name}
                </div>
                {
                    this.state.isFormHidden
                    &&
                    <div className='new-ticket'>
                        <div className={'btn-wrap'}>
                            <button className={'btn text'} onClick={this.showForm}>
                                Add ticket...
                            </button>
                        </div>
                    </div>
                    ||
                    <NewTicket
                        columnId={column._id}
                        boardId={boardId}
                        cb={this.hideForm}
                    />
                }
                {!!tickets.length && (
                    <div className='ticket-container'>
                        {tickets.map((ticket: ITicket) => (
                            <Ticket ticket={ticket} boardId={boardId} columnId={column._id} key={ticket._id}/>
                        ))}
                    </div>
                )}
            </div>
        ));
    }

}
