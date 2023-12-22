import * as React from 'react';
import { ITicket } from '../../../common/models/ITicket';
import Link from '../../Navigation/Link';

export interface ITicketProps {
    ticket: ITicket;
    boardId: string;
    columnId: string;
}

export default class Ticket extends React.Component<ITicketProps, null> {

    public render() {
        const {ticket, boardId, columnId} = this.props;
        const {_id, title} = ticket;

        return (
            <Link href={`/boards/${boardId}/columns/${columnId}/tickets/${_id}`} className='ticket'>
                <div className='title text-overflow'>{title}</div>
            </Link>
        );
    }

}
