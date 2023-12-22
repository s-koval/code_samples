import axios from 'axios';
import config from '../config';

const removeUKFromAddress = address => {
    let addressForShow = address;
    const indexOfUK = address.indexOf(', UK');

    if (indexOfUK !== -1) {
        addressForShow = address.slice(0, indexOfUK);
        return addressForShow;
    } else {
        return address;
    }
};

const parseAddress = address => {
    const streetNumber = address.address_components.find(item => item.types[0] === 'street_number');
    const route = address.address_components.find(item => item.types[0] === 'route');
    const postalTown = address.address_components.find(item => item.types[0] === 'postal_town' || item.types[0] === 'locality');
    const postalCode = address.address_components.find(item => item.types[0] === 'postal_code');

    let fullAddress = '';

    if (postalCode && postalCode.long_name) {
        fullAddress = postalCode.long_name;
    }
    if (postalTown && postalTown.long_name) {
        fullAddress = postalTown.long_name + ' ' + fullAddress;
    }
    if (route && route.long_name) {
        fullAddress = route.long_name + ' ' + fullAddress;
    }
    if (streetNumber && streetNumber.long_name) {
        fullAddress = streetNumber.long_name + ' ' + fullAddress;
    }

    return {
        address: fullAddress,
        subBuildingName: null,
        buildingName: null,
        number: streetNumber ? streetNumber.long_name : null,
        street: route ? route.long_name : null,
        town: postalTown ? postalTown.long_name : null,
        zip: postalCode ? postalCode.long_name : null,
        location: address.geometry.location,
    };
};

export default (address, suggestions) => new Promise(async (resolve, reject) => {

    let searchAddress = address.split(' ').join('+');

    const url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + searchAddress + '&key=' + config.GOOGLE_MAP_API_KEY;

    const { data } = await axios.get(url).catch(reject);

    let suggestion = parseAddress(data.results[0]);
    suggestions.push(suggestion);

    resolve(suggestions);

})
