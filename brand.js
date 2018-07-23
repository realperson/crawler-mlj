/**
 * 作用:获取所有商品品牌的数据
 * 作者:realperson
 * 日期:2018-07-23
 */

const fs = require('fs');
const request = require('request');
const config = require('./config');
const details = require('./data/detail');

const errorIds = [];//出错的id列表
let links = [];//数据
let currentCount = 0;//现在获取了多少个详情的数据
let totalCount = details.length;
// totalCount = 10;
let inc = 1;//起始id

//为了防止出错,限制同时发起请求的个数
let requestCount = 0;//正在请求中的个数
let requestLimit = 10;//同时发起请求的最大个数
let currentIndex = 0;//当前请求的分类在数组中的索引


/**
 * 获取链接数据
 * @param link 分类
 */
function readLink(link) {
    let url = `${config.urlPrefix}${link.link}`;
    request(url, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            //判断目录是否存在
            if (!fs.existsSync('./temp')) {
                fs.mkdirSync('./temp');
            }
            // fs.writeFileSync(config.tempFile, body);//输出分类页面数据
            processData(link.link, link.id, body);
        } else {
            errorIds.push(link);
            console.log(error)
            save();//保存数据
        }
    });
}

/**
 * 处理数据
 * @param id 分类id
 * @param html 分类对应的html页面
 */
function processData(url, id, html) {
    let pattern = /<dt>品　　牌：<\/dt>\n.+<dd>.+>(.+)<\/a>/i;
    let match = html.match(pattern);
    if (match) {
        let name = `${match[1]}`;//链接地址
        let node = {
            id: inc++,
            name
        };
        links.push(node);
    }
    save();//保存数据
}

/**
 * 保存数据
 */
function save() {
    if (--requestCount < 0) {
        requestCount = 0;
    }
    ++currentCount;
    var t = new Date().getTime();
    // console.log(`${t}:${currentCount}`);
    console.log(`${currentCount}:${links[links.length - 1].id}`);
    //排序
    links.sort((a, b) => {
        return a.id - b.id;
    });
    links = distinct(links);
    writeSql();//写入sql文件
    let linksOutput = `module.exports=${JSON.stringify(links)};`;
    fs.writeFileSync(config.brandFile, linksOutput);//生成品牌数据
    if (currentCount >= totalCount) {
        if (errorIds.length > 0) {
            let errorIdsOutput = `module.exports=${JSON.stringify(errorIds)};`;
            fs.writeFileSync(config.errorBrandFile, errorIdsOutput);//保存出错的商品详情链接
        }
    } else {
        startRequestQueue();
    }
}

/**
 * 写入sql文件
 */
function writeSql() {
    let separator = '\n';
    let sql = ``;//sql数据
    links.forEach((node, index) => {
        node.id = index + 1;
        sql += `INSERT INTO \`ecs_brand\` VALUES ('${node.id}', '${node.name}', 'no-piture.png', '', '', '', 'http://', '50', '1');${separator}`;
    });
    fs.writeFileSync(config.brandSqlFile, sql);//生成分类数据的sql代码,用于向数据库中插入分类数据
}

/**
 * 数组去重
 * @param arr 要处理的数组
 */
function distinct(arr) {
    let tempArr = [];
    arr.forEach(item => {
        if (tempArr.findIndex(node => node.name === item.name) === -1) {
            tempArr.push(item);
        }
    });
    return tempArr.length === arr ? arr : tempArr;
}

/**
 * 发起请求队列
 */
function startRequestQueue() {
    while (requestCount < requestLimit && currentIndex <= totalCount - 1) {
        requestCount++;
        readLink(details[currentIndex]);
        currentIndex++;
    }
}

startRequestQueue();