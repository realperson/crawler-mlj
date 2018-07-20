/**
 * 作用:获取数据(所有三级分类,包括分页数据)
 * 作者:realperson
 * 日期:2018-07-19
 */

const fs = require('fs');
const request = require('request');
const config = require('./config');
const categories = require('./data/category');

const links=[];//分类链接地址
let currentCount=0;//现在获取了多少个分类的数据
let categoryCount=categories.length;
// categoryCount=5;

categories.some((category, index) => {
    readCategory(category);
    if (index == categoryCount-1) {
        return true;
    }
    return false;
});

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
            // fs.writeFileSync(config.tempFile, body);//输出分类页面数据
            processCategory(category.link, category.id, body);
        }else{
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
    // var t = new Date().getTime();
    let pattern = /<span class="filter-pager-text">.+?<i>(\d+?)<\/i><\/span>/i;
    let match = html.match(pattern);
    let page=match?+match[1]:1;
    let i=0;
    while(++i<=page){
        let link=`${url}?page=${i}`;//链接地址
        let node={
            id,
            link
        };
        links.push(node);
    }
    save();//保存数据
    // t = new Date().getTime() - t;
    // match && fs.writeFileSync(config.tempFile, match[1]);//输出分类页面数据
    // console.log(index);
    // console.log(t);
    // <span class="filter-pager-text"><b>1</b><em>/</em><i>2</i></span>
}

/**
 * 保存数据
 */
function save() {
    ++currentCount;
    var t = new Date().getTime();
    // console.log(`${t}:${currentCount}`);
    console.log(`${currentCount}:${links[links.length-1].id}`);
    if(currentCount>=categoryCount){
        //排序
        links.sort((a,b)=>{
            return a.id-b.id;
        });
        let linksOutput=`module.exports=${JSON.stringify(links)};`;
        fs.writeFileSync(config.pageFile, linksOutput);//生成分类链接数据,用于抓取数据
    }
}