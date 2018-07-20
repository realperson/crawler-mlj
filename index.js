/**
 * 作用:获取数据
 * 作者:realperson
 * 日期:2018-07-19
 */

const fs = require('fs');
const request = require('request');
const config = require('./config');
const categories = require('./data/categories');
// const categories = require('./data/category');
const links=[];//分类链接地址

console.log(categories);
// categories.some((category, index) => {
//     readCategory(category);
//     if (index == 0) {
//         return true;
//     }
//     return false;
// });

/**
 * 获取分类数据
 * @param category 分类
 */
function readCategory(category) {
    let url = `${config.urlPrefix}${category.link}`;
    request(url, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            //判断目录是否存在
            if (!fs.existsSync('./temp')) {
                fs.mkdirSync('./temp');
            }
            fs.writeFileSync(config.tempFile, body);//输出分类页面数据
            processCategory(url, category.id, body);
            // console.log(body);
        }
    });
}

/**
 * 处理分类数据
 * @param id 分类id
 * @param html 分类对应的html页面
 */
function processCategory(url, id, html) {
    var t = new Date().getTime();
    let pattern = /<span class="filter-pager-text">.+?<i>(\d+?)<\/i><\/span>/i;
    let match = html.match(pattern);
    t = new Date().getTime() - t;
    match && fs.writeFileSync(config.tempFile, match[1]);//输出分类页面数据
    // console.log(index);
    // console.log(t);
    // <span class="filter-pager-text"><b>1</b><em>/</em><i>2</i></span>
}