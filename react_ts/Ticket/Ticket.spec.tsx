import 'reflect-metadata';
import * as React from 'react';
import { mount, ReactWrapper, shallow, ShallowWrapper } from 'enzyme';
import Ticket, { ITicketProps } from './Ticket'; /* tslint:disable-line */
import { ITicket } from '../../../common/models/ITicket';
import { iocContainer } from '../../../ioc.config';
import AppStore from '../../../redux/store/index';
import { TYPES } from '../../../ioc.types';
import { Provider } from 'react-redux';

function setup(
    deep: boolean = false,
    title: string = 'Ticket title',
    creator: string = '',
    _id: string = '789',
    comments: any[] = [],
    assigners: any[] = [],
    description: string = 'Ticket description',
    boardId: string = '123',
    columnId: string = '456'
) {
    const ticket: ITicket = {title, creator, _id, comments, assigners, description};

    let component: React.ReactElement<any>;

    if (deep) {
        const appStore: AppStore = iocContainer.get<AppStore>(TYPES.AppStore);
        component = (
            <Provider store={appStore.store}>
                <Ticket ticket={ticket} boardId={boardId} columnId={columnId}/>
            </Provider>
        );
    } else {
        component = <Ticket ticket={ticket} boardId={boardId} columnId={columnId}/>;
    }

    return deep ? mount(component) : shallow(component);
}

describe('Ticket component', () => {

    const wrapper: ShallowWrapper<ITicketProps, null> | ReactWrapper<ITicketProps, null> = setup();

    it('should provide correct href to Link', () => {
        expect(wrapper.first().prop('href')).toEqual('/boards/123/columns/456/tickets/789');
    });

    it('shows title', () => {
        expect(wrapper.find('.title').text()).toEqual('Ticket title');
    });

});
