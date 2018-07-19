/**
 * 作用:获取数据
 * 作者:realperson
 * 日期:2018-07-19
 */

var request = require('request');
var config = require('./config');
var category = require('./data/category');

console.log(category);
console.log(config);
let url = config.urlPrefix;



// request(url, (error, response, body) => {
//     if (!error && response.statusCode == 200) {
//         console.log(body)
//     }
// });