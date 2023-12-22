import config from '../config';
import { makeQueryString } from './makeQueryString';
import axios from 'axios';
import { s3UploadFile } from './aws';

const crypto = require('crypto');

export default (map, address, uploadedDocuments, draft = false) => new Promise(async (resolve, reject) => {

    const params = {
        center: address.location.lat + ',' + address.location.lng,
        zoom: 20,
        size: '640x320',
        scale: 2,
        maptype: 'satellite',
        markers: 'color:#E12F0E|shadow: true|' + address.location.lat + ',' + address.location.lng,
        key: config.GOOGLE_MAP_API_KEY,
    };
    const url = 'https://maps.googleapis.com/maps/api/staticmap?' + makeQueryString(params);
    const { data } = await axios.get(url, { responseType: 'arraybuffer' }).catch(reject);
    const s3Key = await crypto.randomBytes(20).toString('hex') + '.png';
    await s3UploadFile(s3Key, data);

    map.s3Key = s3Key;
    map.url = config.MEDIA_DOMAIN + '/' + s3Key;
    map.name = s3Key;
    uploadedDocuments.push(map);
    if(!draft){

        resolve(uploadedDocuments)
    }

    else {
        resolve(map)
    }

});


