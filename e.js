/**
 * 作用:获取所有商品的链接数据(处理由于也错没有获取到的分类页面对应的数据)
 * 作者:realperson
 * 日期:2018-07-20
 */

const fs = require('fs');
const request = require('request');
const config = require('./config');
let categories = require('./data/categories');
const errorCategories = require('./data/errorCategories');
const details = require('./data/detail');

const errorIds=[];//出错的id列表
let links=[...details];//商品详情链接地址
let currentCount=0;//现在获取了多少个分类的数据
categories=errorCategories;
let categoryCount=categories.length;

//为了防止出错,限制同时发起请求的个数
let requestCount=0;//正在请求中的个数
let requestLimit=10;//同时发起请求的最大个数
let categoryIndex=0;//当前请求的分类在数组中的索引

/**
 * 处理错误
 */
function processError(){
    let t=new Date().getTime();
    categories=categories.filter(item=>{
        return details.findIndex(d=>{
            return d.id===item.id;
        })===-1;
    });
    t=new Date().getTime()-t;
    console.log(t);
    console.log(categories);
}

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
            processCategory(category.link, category.id, body);
        }else{
            errorIds.push(category);
            console.log(error)
            save();//保存数据
        }
    });
}

/**
 * 处理分类数据
 * @param id 分类id
 * @param html 分类对应的html页面
 */
function processCategory(url, id, html) {
    let pattern = /<div class="goods-item-name">\n.+<a href=".+">/ig;
    let match = html.match(pattern);
    if(match){
        pattern = /href="(.+)">/i;
        match.forEach(m=>{
            let matchLinks = m.match(pattern);
            if(matchLinks){
                let link=`${matchLinks[1]}`;//链接地址
                let node={
                    id,
                    link
                };
                links.push(node);
            }
        });
    }
    // fs.writeFileSync(config.tempFile, JSON.stringify(match));//输出商品详情链接数据
    save();//保存数据
}

/**
 * 保存数据
 */
function save() {
    if(--requestCount<0){
        requestCount=0;
    }
    ++currentCount;
    var t = new Date().getTime();
    // console.log(`${t}:${currentCount}`);
    console.log(`${currentCount}:${links[links.length-1].id}`);
    //排序
    links.sort((a,b)=>{
        return a.id-b.id;
    });
    links=distinct(links);
    let linksOutput=`module.exports=${JSON.stringify(links)};`;
    fs.writeFileSync(config.detailFile, linksOutput);//生成商品详情链接数据,用于抓取数据
    if(currentCount>=categoryCount){
        if(errorIds.length>0){
            let errorIdsOutput=`module.exports=${JSON.stringify(errorIds)};`;
            fs.writeFileSync(config.errorCategoryFile, errorIdsOutput);//保存出错的分类id
        }
    }else{
        startRequestQueue();
    }
}

/**
 * 数组去重
 * @param arr 要处理的数组
 */
function distinct(arr) {
    let tempArr=[];
    console.log(arr.length);
    arr.forEach(item=>{
        if(tempArr.findIndex(node=>node.id===item.id&&node.link===item.link)===-1){
            tempArr.push(item);
        }
    });
    console.log(tempArr.length);
    return tempArr.length===arr?arr:tempArr;
}

/**
 * 发起请求队列
 */
function startRequestQueue() {
    while(requestCount<requestLimit&&categoryIndex<=categoryCount-1){
        requestCount++;
        readCategory(categories[categoryIndex]);
        categoryIndex++;
    }
}

// processError();//处理错误
startRequestQueue();