import agenda from '../utils/agenda';
import moment from 'moment';

const checkAppointmentIsCompletedJobHandler = async (serviceRequest, status, inProgressMessages) => {
    let expiration;
    if (!inProgressMessages){

        const date  = serviceRequest.appointmentDate.date;
        const  time = serviceRequest.appointmentDate.time;

        expiration = moment(date+' '+time, 'D MMM YYYY hh:mm a A').add(status.expirationData.number, status.expirationData.format).format();

    } else {
        expiration = moment().add(status.expirationData.number, status.expirationData.format).format();
    }

    await agenda.cancel({ 'data.requestId': serviceRequest.id });

    await agenda.schedule(new Date(expiration), ['checkAppointmentIsCompleted'], { requestId: serviceRequest.id, status: status.status });

};

export default checkAppointmentIsCompletedJobHandler;