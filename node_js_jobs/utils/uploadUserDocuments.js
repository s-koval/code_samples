import { s3UploadFile } from './aws';
import fs from 'fs';
import config from '../config';

export default (file, documents, uploadedDocuments) => new Promise(async (resolve, reject) => {

    try {
        const s3Key = file.filename + '.' + file.originalname.split('.').pop();
        await s3UploadFile(s3Key, fs.readFileSync(file.path));
        let document = {
            s3Key: s3Key,
            url: config.MEDIA_DOMAIN + '/' + s3Key,
            name: file.originalname,
        };

        uploadedDocuments.push(document);

        const index = documents.findIndex(doc => doc.name === file.originalname);

        if (index !== -1){
            documents[index] = { ...document };
        }else {
            documents.push(document);
        }


        fs.unlinkSync(file.path);
        resolve(uploadedDocuments);
    } catch (error) {
        fs.unlinkSync(file.path);
        reject(error);
    }
})
