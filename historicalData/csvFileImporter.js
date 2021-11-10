const fs = require("fs");
const path = "./csvFileFolder/";
let fullPath = path;

function getFullDataRecord(coinFolder) {
    fullPath += coinFolder + '/';
    fs.readdir(fullPath, aggregateData);
}

function aggregateData(error, data) {
    if (error) {
        console.log("Error: ", error);
    } else {
        handleData(orderFiles(data));
    }
}

function orderFiles(data) {
    const fileMap = new Map();
    let fileArr = [];

    data.forEach((name) => {
        let fileDate = new Date(
            name.split(".")[0].split("-")[2] +
                "-" +
                name.split(".")[0].split("-")[3]
        );
        fileMap.set(name, fileDate);
        fileArr.push({ name: name, fileDate: fileDate });
    });

    return getOrderedFileArr(fileArr);
}

function getOrderedFileArr(fileArr) {
    //ASSUMPTION:
    //THERE IS NOT TWO SAME DATES
    //BINANCE DATA IS PER MONTH
    return fileArr.sort(function (entry1, entry2) {
        if (
            isYearPrevious(entry1.fileDate, entry2.fileDate) ||
            (isYearTheSame(entry1.fileDate, entry2.fileDate) &&
                isMonthPrevious(entry1.fileDate, entry2.fileDate))
        ) {
            return -1;
        }

        return 1;
    });
}

function isMonthPrevious(value, compareValue) {
    return isPrevious(value.getMonth(), compareValue.getMonth());
}

function isYearTheSame(value, compareValue) {
    return isSame(value.getFullYear(), compareValue.getFullYear());
}

function isYearPrevious(value, compareValue) {
    return isPrevious(value.getFullYear(), compareValue.getFullYear());
}

function isSame(number1, number2) {
    if (number1 === number2) return true;
    return false;
}

function isPrevious(number1, number2) {
    if (number1 < number2) return true;
    return false;
}

function handleData(data) {
    
    let fileArray = [];
    data.forEach((element) => fileArray.push(element.name));

    let dataAggregator = [];

    fileArray.forEach((file) => {
        const stream = fs.createReadStream(fullPath + file);
        const reader = require('readline').createInterface({input: stream});
        reader.on("line", (row) => {dataAggregator.push(row.split(","))});
        reader.on("close", () => {
            console.log(dataAggregator);
        });
    });
}
