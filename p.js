/**
 * 作用:获取所有商品的数据
 * 作者:realperson
 * 日期:2018-07-23
 */

const fs = require('fs');
const cheerio = require('cheerio');
const request = require('request');
const config = require('./config');
const details = require('./data/detail');
const brands = require('./data/brands');

let $;

const errorIds = [];//出错的id列表
let links = [];//数据
let images = [];//图片数据
let currentCount = 0;//现在获取了多少个详情的数据
let totalCount = details.length;
totalCount = 1;
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
    link.link='/goods/7546';
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
 * 左边填充字符串
 * @param str 要处理的字符串
 * @param length 填充字符串后的总长度
 * @param padStr 要填充的字符
 */
function padStart(str, length, padStr = '0') {
    while (str.length < length) {
        str = padStr + str;
    }
    return str;
}

/**
 * 处理数据
 * @param id 分类id
 * @param html 分类对应的html页面
 */
function processData(url, id, html) {
    let node = {
        id: inc++,
        cat_id: id,
        goods_name: '',
        goods_brief: '',//商品简单描述
        goods_desc: '',//商品详情
        brand_id: '0',
    };
    node.goods_sn = 'JIGU' + padStart(`${node.id}`, 6, '0');//货号

    let $ = cheerio.load(html);
    let pattern;
    let match;
    //品牌
    pattern = /<dt>品　　牌：<\/dt>\n.+<dd>.+>(.+)<\/a>/i;
    match = html.match(pattern);
    if (match) {
        let brand_id = brands.findIndex(item => item.name === match[1]);
        if (brand_id !== -1) {
            node.brand_id = brand_id;
        }
    }
    //名称
    pattern = /<h1 class="basic-name">(.+)<\/h1>/i;
    match = html.match(pattern);
    if (match) {
        node.goods_name = match[1];
    }
    //商品简单描述
    pattern = /<p class="basic-intro">(.+)<\/p>/i;
    match = html.match(pattern);
    if (match) {
        node.goods_brief = match[1];
    }
    //商品详情
    node.goods_desc = $('#goods-detail-description').html();
    // pattern = /<p class="basic-intro">(.+)<\/p>/i;
    // match = html.match(pattern);
    // if (match) {
    //     node.goods_desc = $('#goods-detail-description').html();
    // }


    links.push(node);
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
    // links = distinct(links);
    // writeSql();//写入sql文件
    let linksOutput = `module.exports=${JSON.stringify(links)};`;
    fs.writeFileSync(config.goodsFile, linksOutput);//生成品牌数据
    if (currentCount >= totalCount) {
        if (errorIds.length > 0) {
            let errorIdsOutput = `module.exports=${JSON.stringify(errorIds)};`;
            fs.writeFileSync(config.errorGoodsFile, errorIdsOutput);//保存出错的商品详情链接
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
    fs.writeFileSync(config.goodsSqlFile, sql);//生成分类数据的sql代码,用于向数据库中插入分类数据
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