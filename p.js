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
totalCount = 10;
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
        goods_thumb: '',//缩略图
        goods_img: '',//展示图
        original_img: '',//大图
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

    //----------保存图片
    $('.xs-box-list li a img').each((i, img)=>{
        let image=$(img);
        let img_url=image.attr('data-src-md');//展示图
        let thumb_url=image.attr('src');//缩略图
        let img_original=image.attr('data-src-lg');//原图(用于展示大图)
        let imageNode={
            img_id:images.length+1,
            goods_id:node.id,
            img_url,
            thumb_url,
            img_original
        };
        images.push(imageNode);

        //保存图片信息到商品数据中
        if(i===0){
            node.goods_thumb = thumb_url;
            node.goods_img = img_url;
            node.original_img = img_original;
        }
    });


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
    writeSql();//写入sql文件
    let linksOutput = `module.exports=${JSON.stringify(links)};`;
    fs.writeFileSync(config.goodsFile, linksOutput);//生成商品数据
    linksOutput = `module.exports=${JSON.stringify(images)};`;
    fs.writeFileSync(config.imagesFile, linksOutput);//生成图片数据
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
    //---------------商品详情
    links.forEach((node, index) => {
        // node.id = index + 1;
        // INSERT INTO `ecs_goods` VALUES ('29', '13', 'ECS000029', '意大利费列罗巧克力食品进口零食礼盒576粒整箱装结婚喜糖', '+', '103', '47', '', '0', '0.000', '456.00', '380.00', '320.00', '1476691200', '1448784000', '1', '2', '1437379200', '1448784000', '5', '巧克力,零食,甜品,甜点', '层层甄选 臻心臻意 爱的见证 巧克力让爱历久弥新 送佳人女友礼品', '<p></p>', 'images/201507/thumb_img/29_thumb_G_1437506331258.jpg', 'images/201507/goods_img/29_G_1437506331520.jpg', 'images/201507/source_img/29_G_1437506331121.jpg', '1', '', '1', '1', '0', '3', '1437506293', '100', '0', '1', '1', '1', '1', '8.4', '0', '1443566149', '0', '', '-1', '-1', '0', '0', '0', '', '0', '1', '0.00', '0', '0');
        sql += `INSERT INTO \`ecs_goods\` VALUES ('${node.id}', '${node.cat_id}', '${node.goods_sn}', '${node.goods_name}', '+', '0', '${node.brand_id}', '', '0', '0.000', '456.00', '380.00', '320.00', '1476691200', '1448784000', '1', '2', '1437379200', '1448784000', '1', '', '${node.goods_brief}', '${node.goods_desc}', '${node.goods_thumb}', '${node.goods_img}', '${node.original_img}', '1', '', '1', '1', '0', '100', '1437506293', '100', '0', '0', '0', '0', '0', '10.0', '0', '1443566149', '0', '', '-1', '-1', '0', '0', '0', '', '0', '1', '0.00', '0', '0');${separator}`;
    });
    fs.writeFileSync(config.goodsSqlFile, sql);//生成分类数据的sql代码,用于向数据库中插入分类数据
    //---------------商品图片
    sql = ``;//sql数据
    images.forEach((node, index) => {
        sql += `INSERT INTO \`ecs_goods_gallery\` VALUES ('${node.img_id}', '${node.goods_id}', '${node.img_url}', '', '${node.thumb_url}', '${node.img_original}', '0', '0', '0');${separator}`;
    });
    fs.writeFileSync(config.imagesSqlFile, sql);//生成分类数据的sql代码,用于向数据库中插入分类数据
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