const parse = require("csv-parse/lib/sync");
const fs = require("fs");
const _ = require("lodash");
const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const extractEmail = require('extract-email-address').default;

let rawDataArray = getCSVRawDataFromFile('./input.csv');

let headers = getHeaderFromRawData(rawDataArray);

let dataArray = getAssignedDataWithHeaders(rawDataArray, headers);

let output = [];

dataArray.forEach(data => {

    let structureData = {};

    structureData.fullname = data.fullname;
    structureData.eid = data.eid;
    structureData.groups = splitGroupsString(data.group);
    
    const matchedProps = _.assign(getPropByMatch(data, 'email'), getPropByMatch(data, 'phone'));
    const addresses = transformToAddress(matchedProps);
    
    structureData.addresses = addresses;
    
    structureData.invisible = data.invisible;
    structureData.see_all = data.see_all;
    output.push(structureData);

});

output = mergeByProperty(output, 'eid');

sanitizeOutput(output);

saveToFile(output);

function getCSVRawDataFromFile(path) {
    const csvContent = fs.readFileSync(path);

    return parse(csvContent, {});
}

function getAssignedDataWithHeaders(rawDataArray, headersArray) {
    return rawDataArray.slice(1).map((currentRow) => {
        return currentRow.reduce((prev, value, index) => {
            const currentHeader = headersArray[index];
            if (!prev.hasOwnProperty(currentHeader)) {
                prev[currentHeader] = value;
            } else {
                let existing = prev[currentHeader];
                prev[currentHeader] = (Array.isArray(existing) ? existing : [existing]).concat(value);
            }
            return prev;
        }, {});
    })
}

function getHeaderFromRawData(rawDataArray) {
    return Object.values(rawDataArray[0]);
}

function splitGroupsString(groupArray) {
    let groupList = [];
    for (element of groupArray) {
        if (element.indexOf('/') >= 0) {
            groupList = groupList.concat(splitElement(element, '/'));
        } else if (element.indexOf(',') >= 0) {
            groupList = groupList.concat(splitElement(element, ','));
        } else if (element) {
            groupList = groupList.concat([element]);
        }
    }
    groupList = groupList.map(element => element.trim());
    return groupList;
}

function splitElement(element, separator) {
    let newArraySplited = element.split(separator);
    newArraySplited.map((val) => {
        return val.trim();
    })
    return newArraySplited;
}

function sanitizeBoolean(string) {
    return (string == 'yes' || string == '1');
}

function mergeByProperty(dataArray, propertyName) {
    return _(dataArray)
        .groupBy((element) => {
            return element[propertyName].toLowerCase();
        })
        .map((group) => {
            return _.mergeWith.apply(_, [{}].concat(group, (obj, src) => {
                if (Array.isArray(obj)) {
                    return _.union(obj, src);
                }
            }));
        })
        .values()
        .value();
}

function sanitizeOutput(output) {
    _.map(output, (element) => {
        element.invisible = sanitizeBoolean(element.invisible);
        element.see_all = sanitizeBoolean(element.see_all);
    
        element.addresses = returnSanitizeAdrressesEmail(element.addresses);
        removeInvalidAddresses(element.addresses);
        sanitizeAddressesPhone(element.addresses);
    })
}

function getPropByMatch(arrayObj, propMatch) {
    return _.pickBy(arrayObj, (value, key) => {
        return _.startsWith(key, propMatch);
    });
}

function transformToAddress(arrayOfMatches) {
    let arrayToReturn = [];
    const regex = new RegExp('([\\w]+)');
    _.map(arrayOfMatches, (value, key) => {
        let object = {};
        let data = key.split(' ');
        _.chain(object)
            .assign({
                type: data.shift()
            })
            .assign({
                tags: data
            })
            .assign({
                address: value
            })
            .value();

        arrayToReturn.push(object);
    })

    return arrayToReturn;

}

function isValidAddress(element) {

    if (element.type == 'phone') {
        try {
            const number = phoneUtil.parseAndKeepRawInput(element.address, 'BR');
            return phoneUtil.isValidNumberForRegion(number, 'BR');
        } catch (error) {
            return false;
        }

    } else if (element.type == 'email') {
        return element.address != '';
    }
}

function removeInvalidAddresses(addressesArray) {
    _.remove(addressesArray, (address) => {
        return !isValidAddress(address);
    })
}

function sanitizeAddressesPhone(addressesArray) {
    _.map(addressesArray, (address) => {
        if (address.type == 'phone') {
            const number = (phoneUtil.format(phoneUtil.parseAndKeepRawInput(address.address, 'BR'), PNF.E164)).replace('+', '');
            address.address = number;
        }
    })
}

function returnSanitizeAdrressesEmail(addresses) {
    return _.reduce(addresses, (acc, val) => {
        if (val.type == 'email') {
            let emails = val.address.split('/');
            let arr = [];
            emails.forEach(email => {
                emailString = extractEmail(email).length > 0 ? extractEmail(email)[0].email : '';
                arr.push({
                    ...val,
                    address: emailString
                });
            });
            return acc.concat(arr);
        } else {
            return acc.concat(val);
        };
    }, []);
}

function saveToFile(output) {
    const data = JSON.stringify(output, null, 2);

    fs.writeFile('output.json', data, (err) => {
        if (err) {
            throw err;
        }
        console.log("JSON data is saved to output.json .");
    });

}