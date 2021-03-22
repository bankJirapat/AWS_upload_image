const AWS = require('aws-sdk');
const Jimp = require('jimp');
const s3 = new AWS.S3();
var dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc');
var timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);
//var arrayResults = [];

exports.handler = async(event,context) => {

    let url = event.arguments.url;
    var countURL = url.length;
    var arrayResults = [];

    // format date and convert
    let myDate = dayjs.tz(Date.now(), "asia/bangkok").format();
    var dateFormatYearMonthDay = myDate.slice(0,10);
    var dateFormatHHMMSS = myDate.slice(11,19);
    var convertDateFormatHHMMSS = dateFormatHHMMSS.replace(/:/g,"-");

    for(let index = 0 ; index < countURL ; index++){
        
        var indexImage = url[index]
        let image = await Jimp.read(indexImage);
        let buffer = await image.getBufferAsync("image/jpeg");
        let buffer2 = await image.quality(60).resize(100,100).getBufferAsync("image/jpeg");
    
        var date = `${dateFormatYearMonthDay}_${convertDateFormatHHMMSS}_${index}`;

        let nameNormal = `${date}_normal.jpg`;
        let nameResize = `${date}_resize.jpg`;

        let URLResultsData = {
            imageNormalURL: `https://imagetestbank.s3-ap-southeast-1.amazonaws.com/${nameNormal}`,
            imageResizeURL: `https://imagetestbank.s3-ap-southeast-1.amazonaws.com/${nameResize}`,
        };

        const params = {
            Bucket: "imagetestbank",
            Key: nameNormal,
            ContentType: "image/jpeg",
            ACL: "public-read",
            Body: buffer,
        };
        const params2 = {
            Bucket: "imagetestbank",
            Key: nameResize,
            ContentType: "image/jpeg",
            ACL: "public-read",
            Body: buffer2,
        };

        // console.log("============================");
        arrayResults.push(URLResultsData);
        // console.log("arrayResults -> ",arrayResults);
        // console.log("============================");

        var uploadImage = new Promise((resolve,reject)=>{
            s3.putObject(params,(err,result)=>{
                if(err) {
                    console.log(err);
                }else {
                    console.log("uploadeImage Round -> ",index);
                    console.log("uploadImage is complete");
                    result = arrayResults;
                    resolve(result);
                }
            })
        });

        var uploadImageResize = new Promise((resolve,reject)=>{
            s3.putObject(params2,(err,result)=>{
                if(err) console.log(err);
                else {
                    console.log("uploadeImageResize Round -> ",index);
                    console.log("uploadImageResize is complete");
                    result = arrayResults;
                    resolve(result);
                }
            })
        });
    }
    
    return await uploadImageResize.then(uploadImage.then());
    
}
