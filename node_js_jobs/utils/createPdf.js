import getHtmlPdf from './getHtmlPdf';
import pdf from 'html-pdf';

const options = { format: 'letter' };

export default (user, property, key, createdAt, expiration) => new Promise(async (resolve, reject) => {

    const html = getHtmlPdf(user, property, key, createdAt, expiration);

    let data;

    pdf.create(html, options).toBuffer(function (err, buffer) {

        if (!err) {
            data = buffer;
            resolve(data);
        } else {
            data = null;
            reject(data);
        }
    });
})
