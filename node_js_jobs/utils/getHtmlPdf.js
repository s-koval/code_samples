import moment from 'moment';

export default (user, property, key, createdAt, expiration) => {

    const formattedKey = key.match(/.{1,4}/g).join(' – ');

    const userName = user.name.first + ' ' + user.name.last;


    const userPostalCode = user.address.postalCode.split(' ')[0];
    const propertyAddress = property.address.formattedAddress;
    const createdAtFormattedString = moment(createdAt).format('dddd, MMMM Do YYYY, h:mm a');

    const address = propertyAddress.split(', ');

    let addressHtml = '';

    address.map((elem) => {
        addressHtml += elem+'<br>'

    });

    const avatar = user.avatar;
    let logoStyle;
    let logoHtml;

    if (avatar && avatar.url) {
        logoStyle = '.user-avatar {\n' +
            '            width: 40px;\n' +
            '            height: 40px;\n' +
            '            text-align: center;\n' +
            '            border-radius: 50%;\n' +
            '            overflow: hidden;\n' +
            '            background-image: url("' + avatar.url + '");\n' +
            '            background-repeat: no-repeat;\n' +
            '            background-position: center;\n' +
            '            background-size: cover;\n' +
            '            margin-right: 10px;\n' +
            '            display: inline-block;\n' +
            '            float: left;\n' +
            '        }\n' +
            '\n' ;

        logoHtml = '<div class="user-avatar">\n' +

            '</div>\n';

    } else {
        const logo = user.name.first.charAt(0) + '' + user.name.last.charAt(0);
        logoStyle = ' .user-logo {\n' +
            '            width: 40px;\n' +
            '            height: 40px;\n' +
            '            text-align: center;\n' +
            '            border-radius: 50%;\n' +
            '            overflow: hidden;\n' +
            '            background-color: #ffd59f;\n' +
            '            color: #c16d02;\n' +
            '            font: 500 12px -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu;\n' +
            '            line-height: 40px;\n' +
            '            margin-right: 10px;\n' +
            '            display: inline-block;\n' +
            '            float: left;\n' +
            '        }\n' +
            '\n' ;

        logoHtml = ' <div class="user-logo">\n' +
            logo +
            '\n' +
            '</div>\n';
    }

    return '<html xmlns="http://www.w3.org/1999/xhtml" data-dnd="true">\n' +
        '\n' +
        '<head>\n' +
        '    <title>{{title}}</title>\n' +
        '    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>\n' +
        '\n' +
        '    <style type="text/css">\n' +
        '\n' +
        '        body {\n' +
        '            font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu;\n' +
        '        }\n' +
        '\n' +
        '\n' +
        '        .page {\n' +
        '\n' +
        '            display: block;\n' +
        '\n' +
        '            page-break-after: always;\n' +
        '\n' +
        '            overflow: hidden;\n' +
        '        }\n' +
        '        .page2 {\n' +
        '\n' +
        '            display: block;\n' +
        '\n' +
        '            page-break-after: auto;\n' +
        '\n' +
        '            overflow: hidden;\n' +
        '        }\n' +
        '\n' +
        '        p {\n' +
        '            margin: 0;\n' +
        '        }\n' +
        '\n' +
        '        .contentWrapper {\n' +
        '            width: 612px;\n' +
        '            margin: 0 auto;\n' +
        '            padding: 42px 66px;\n' +
        '            box-sizing: border-box;\n' +
        '            position: relative;\n' +
        '           // height: 792px;\n' +
        '        }\n' +
        '\n' +
        '        .logoImg {\n' +
        '            margin-bottom: 49px;\n' +
        '            margin-top: 20px;\n' +
        '            width: 180px;\n' +
        '        }\n' +
        '\n' +
        '        .company-address {\n' +
        '            width: 300px;\n' +
        '            margin-bottom: 40px;\n' +
        '            margin-top: 0px;\n' +
        '        }\n' +
        '\n' +
        '        .company-footer-address {\n' +
        '\n' +
        '            margin-bottom: 20px;\n' +
        '        }\n' +
        '\n' +
        '        .address {\n' +
        '\n' +
        '            font-size: 10px;\n' +
        '            font-weight: normal;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: 1.43;\n' +
        '            letter-spacing: normal;\n' +
        '            color: #140f1a;\n' +
        '            margin-bottom: 5px;\n' +
        '        }\n' +
        '\n' +
        '        .company {\n' +
        '\n' +
        '\n' +
        '            font-size: 11px;\n' +
        '            font-weight: normal;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: 1.71;\n' +
        '            letter-spacing: normal;\n' +
        '            color: #140f1a;\n' +
        '            margin-bottom: 2px;\n' +
        '        }\n' +
        '\n' +
        '        .first-text-block {\n' +
        '\n' +
        '            font-size: 10px;\n' +
        '            font-weight: normal;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: 1.3;\n' +
        '            letter-spacing: normal;\n' +
        '            color: #140f1a;\n' +
        '            margin-bottom: 25px;\n' +
        '\n' +
        '        }\n' +
        '\n' +
        '        .first-text-block p:first-child {\n' +
        '            margin-bottom: 15px;\n' +
        '        }\n' +
        '\n' +
        '        .second-text-block {\n' +
        '            font-size: 10px;\n' +
        '            font-weight: normal;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: 1.3;\n' +
        '            letter-spacing: normal;\n' +
        '            color: #140f1a;\n' +
        '            margin-bottom: 24px;\n' +
        '        }\n' +
        '\n' +
        '        .third-text-block {\n' +
        '            font-size: 10px;\n' +
        '            font-weight: normal;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: 1.3;\n' +
        '            letter-spacing: normal;\n' +
        '            color: #140f1a;\n' +
        '\n' +
        '        }\n' +
        '\n' +
        '        .third-text-block p {\n' +
        '            margin-bottom: 7px;\n' +
        '        }\n' +
        '\n' +
        '\n' +
        '        .details-wrapper {\n' +
        '\n' +
        '            margin-bottom: 25px;\n' +
        '            height: 99px;\n' +
        '            position: relative;\n' +
        '\n' +
        '        }\n' +
        '\n' +
        '        .user-details {\n' +
        '            position: absolute;\n' +
        '            top: 0;\n' +
        '            left: 0;\n' +
        '            width: 30%;\n' +
        '            border-top: solid 2px #140f1a;\n' +
        '            padding-top: 22px;\n' +
        '\n' +
        '            display: inline-block;\n' +
        '            margin-right: 5px;\n' +
        '            float: left;\n' +
        '        }\n' +
        '\n' +
        '        .name {\n' +
        '            clear: both;\n' +
        '            margin-top: 5px;\n' +
        '\n' +
        '            font-size: 11px;\n' +
        '            font-weight: bold;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: normal;\n' +
        '            letter-spacing: normal;\n' +
        '            color: #140f1a;\n' +
        '        }\n' +
        '\n' +
        '        .zip {\n' +
        '\n' +
        '            font-size: 11px;\n' +
        '            font-weight: normal;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: normal;\n' +
        '            letter-spacing: normal;\n' +
        '            color: #140f1a;\n' +
        '        }\n' +
        '\n' +
        '        .property-details {\n' +
        '            position: absolute;\n' +
        '            top: 0;\n' +
        '            right: 0;\n' +
        '\n' +
        '            width: 68%;\n' +
        '            border-top: solid 2px #140f1a;\n' +
        '            padding-top: 22px;\n' +
        '\n' +
        '\n' +
        '        }\n' +
        '\n' +
        '        .property-address {\n' +
        '\n' +
        '\n' +
        '            font-size: 20px;\n' +
        '            font-weight: bold;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: 1.15;\n' +
        '            letter-spacing: -0.3px;\n' +
        '            color: #140f1a;\n' +
        '        }\n' +
        '\n' +
        '\n' + logoStyle +
        '        .user-name {\n' +
        '            display: inline-block;\n' +
        '        }\n' +
        '\n' +
        '        .key-block {\n' +
        '\n' +
        '            height: 78px;\n' +
        '            background-color: #ef4f31;\n' +
        '            text-align: center;\n' +
        '            margin-bottom: 25px;\n' +
        '            box-sizing: border-box;\n' +
        '            padding-top: 10px;\n' +
        '        }\n' +
        '\n' +
        '        .key-title {\n' +
        '\n' +
        '\n' +
        '            font-size: 11px;\n' +
        '            font-weight: normal;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: 1.3;\n' +
        '            letter-spacing: normal;\n' +
        '            text-align: center;\n' +
        '            color: #ffffff;\n' +
        '\n' +
        '        }\n' +
        '\n' +
        '        .key-value {\n' +
        '\n' +
        '\n' +
        '            font-size: 25px;\n' +
        '            font-weight: 500;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: normal;\n' +
        '            letter-spacing: normal;\n' +
        '            text-align: center;\n' +
        '            color: #ffffff;\n' +
        '            margin-top: 5px;\n' +
        '        }\n' +
        '\n' +
        '        .bold {\n' +
        '            font-weight: bold;\n' +
        '        }\n' +
        '\n' +
        '        .wrapper {\n' +
        '\n' +
        '\n' +
        '            clear: both;\n' +
        '            height: 310px;\n' +
        '        }\n' +
        '\n' +
        '        .step-container {\n' +
        '            width: 30%;\n' +
        '            display: inline-block;\n' +
        '            margin-bottom: 12px;\n' +
        '            margin-right: 2%;\n' +
        '            box-sizing: border-box;\n' +
        '            float: left;\n' +
        '\n' +
        '        }\n' +
        '\n' +
        '        .step-counter {\n' +
        '            width: 24px;\n' +
        '            height: 24px;\n' +
        '            background-color: #ffebe8;\n' +
        '            border-radius: 50%;\n' +
        '\n' +
        '            font-size: 11px;\n' +
        '            font-weight: bold;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: 24px;\n' +
        '            letter-spacing: normal;\n' +
        '            text-align: center;\n' +
        '            color: #ef4f31;\n' +
        '            margin-bottom: 9px;\n' +
        '\n' +
        '        }\n' +
        '\n' +
        '        .step-title {\n' +
        '\n' +
        '            font-size: 10px;\n' +
        '            font-weight: bold;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: normal;\n' +
        '            letter-spacing: normal;\n' +
        '            color: #140f1a;\n' +
        '            margin-bottom: 9px;\n' +
        '        }\n' +
        '\n' +
        '        .step-text {\n' +
        '\n' +
        '            font-size: 8px;\n' +
        '            font-weight: normal;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: 1.25;\n' +
        '            letter-spacing: normal;\n' +
        '            color: #140f1a;\n' +
        '        }\n' +
        '\n' +
        '        .text-block p {\n' +
        '            clear: both;\n' +
        '\n' +
        '            font-size: 10px;\n' +
        '            font-weight: normal;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: 1.3;\n' +
        '            letter-spacing: normal;\n' +
        '            color: #140f1a;\n' +
        '            margin-bottom: 10px;\n' +
        '        }\n' +
        '\n' +
        '        .trading {\n' +
        '\n' +
        '            font-size: 10px;\n' +
        '            font-weight: normal;\n' +
        '            font-style: normal;\n' +
        '            font-stretch: normal;\n' +
        '            line-height: 1.35;\n' +
        '            letter-spacing: normal;\n' +
        '            color: #a2a0a4;\n' +
        '        }\n' +
        '\n' +
        '        .footer-block {\n' +
        '            border-top: solid 1px #a2a0a4;\n' +
        '            padding-top: 20px;\n' +
        '            margin-top: 80px;\n' +
        '        }\n' +
        '\n' +
        '\n' +
        '    </style>\n' +
        '</head>\n' +
        '<body>\n' +
        '\n' +
        '<div class="page">\n' +
        '    <div class="contentWrapper">\n' +
        '\n' +
        '        <img class="logoImg"\n' +
        '             src="https://s3.us-east-2.amazonaws.com/logo.png"\n' +
        '             alt="logo.png"/>\n' +
        '\n' +
        '\n' +
        '        <div class="company-address">\n' +
        '            <p class=address>\n' +
        '                The Homeowner<br>\n' +
        '\n' + addressHtml +
        '                </p>\n' +
        '\n' +
        '\n' +
        '        </div>\n' +
        '\n' +
        '\n' +
        '        <div class="first-text-block">\n' +
        '            <p>\n' +
        '                Dear Homeowner,</p>\n' +
        '            <p>\n' +
        '                We are writing to you on behalf of <span\n' +
        '                    class="bold">' + userName + '</span>\n' +
        '                of <span class="bold">' + userPostalCode + '</span>, who has\n' +
        '                recently registered their interest in buying your property and has submitted an offer via our website\n' +
        '                <span class="bold">company.io</span>\n' +
        '            </p>\n' +
        '        </div>\n' +
        '\n' +
        '\n' +
        '</body>\n' +
        '</html>\n';
}
