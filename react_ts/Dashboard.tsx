import * as React from 'react';

import { RouteComponentProps } from 'react-router';
import { Col, Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import { denormalize } from 'normalizr';
import { BoardsService } from '../../services/app/Board/BoardsService';
import { iocContainer } from '../../ioc.config';
import { TYPES } from '../../ioc.types';
import ColumnContainer from './ColumnContainer/ColumnContainer';
import ModalWindow from '../common/ModalWindow';
import NewTicket from './Ticket/NewTicket';
import { IMapStateToProps } from '../../common/IMapStateToProps';
import { BoardsSchema } from '../../common/schema/DataSchema';
// interfaces
import { IAppState } from '../../redux/store/initialState';
import { IBoard } from '../../common/models/IBoard';
import { IColumn } from '../../common/models/IColumn';
import { ITicket } from '../../common/models/ITicket';
import { IUser } from '../../common/models/IUser';

interface IDashboardRouteParams {
    boardId: string;
    columnId: string;
    ticketId: string;
}

interface IDashboardProps extends RouteComponentProps<IDashboardRouteParams> {
    board: IBoard;
    column: IColumn;
    ticket: ITicket;
    user: IUser;
}

interface IDashboardState {
    board: IBoard;
}

class Dashboard extends React.Component<IDashboardProps, IDashboardState> {

    private _boardsService: BoardsService = iocContainer.get<BoardsService>(TYPES.BoardsService);
    private _isTicketCreator: boolean;

    constructor(props: any, context: any) {
        super(props, context);

        this._isTicketCreator = false;
    }

    public componentWillReceiveProps (nextProps: IDashboardProps) {
        this._isTicketCreator =
            nextProps.ticket
            && typeof nextProps.ticket.creator !== 'string'
            && nextProps.ticket.creator._id === nextProps.user._id;
    }

    public componentDidMount() {
        this._boardsService.loadInstance(this.props.match.params.boardId);
    }

    public gotoBoard = (): void => {
        this.props.history.push(`/boards/${this.props.match.params.boardId}`);
    };

    public updateBoard (columns: IColumn[]): void {
        const _board: IBoard = this.props.board;
        _board.columns = columns;
        this._boardsService.changeColumnOrder(_board);
    }

    public renderBoard(board: IBoard) {
        let parts: React.ReactElement<any>[] = [];

        parts.push(
            <div className='dashboard-header' key={1}>
                <Row >
                    <Col xs={12} className='board-title'>
                        {this.props.board.name}
                    </Col>
                </Row>
            </div>
        );

        parts.push(<ColumnContainer
            columns={board.columns}
            boardId={this.props.board._id}
            key={2}
            dndCallback={this.updateBoard.bind(this)}
        />);

        return parts;
    }

    public renderPreloader() {
        return <div>Loading</div>;
    }

    public render() {
        const { ticket, column, board } = this.props;
        return (
            <div className='dashboard'>
                {board ? this.renderBoard(board) : this.renderPreloader()}
                {
                    !!ticket &&
                    <ModalWindow
                        showModal={!!ticket}
                        title={`Ticket '${ticket.title}'`}
                        isFooterHidden={true}
                        children={this._isTicketCreator && [
                            <NewTicket
                                cb={this.gotoBoard}
                                ticket={ticket}
                                columnId={column._id}
                                boardId={board._id}
                            />,
                        ]}
                    />
                }
            </div>
        );
    }
}

const mapStateToProps: IMapStateToProps<IDashboardProps> = (state, ownProps) => {
    const { boardId, columnId, ticketId } = ownProps.match.params;

    let board: IBoard = null;
    if (state.entities.ids.boards.indexOf(boardId) >= 0) {
        board = denormalize([boardId], BoardsSchema, state.entities.normalized)[0];
    }

    let column: IColumn = state.entities.normalized.columns[columnId] || null;
    let ticket: ITicket = state.entities.normalized.tickets[ticketId] || null;
    let user: IUser = state.session.user;

    return {
        ...ownProps,
        board,
        column,
        ticket,
        user,
    };
};

export default connect(mapStateToProps)(Dashboard);
