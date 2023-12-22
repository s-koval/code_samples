import agenda from '../utils/agenda';

const activatePropertyJobHandler = async (property,  expiration) => {


    await agenda.cancel({ 'data.propertyId': property.id.toString() });


    await agenda.schedule(new Date(expiration), ['activateProperty'], { propertyId: property.id });

};

export default activatePropertyJobHandler;