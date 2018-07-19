/**
 * 作用:生成分类数据
 * 作者:realperson
 * 日期:2018-07-19
 */

const fs = require('fs');
const cheerio = require('cheerio');

const fromFile = './data/category.html';
const toFile = './data/category.sql';
const linksFile = './data/category.txt';
//加载数据
const domStr = fs.readFileSync(fromFile, 'utf8');
const $ = cheerio.load(domStr);

function main() {
    let categories = [];//分类
    let links = [];//分类链接
    let count = 0;
    let inc = 1;//起始id

    $('#all > li').each((index, li) => {
        count++;
        //----------------一级分类
        let link = $(li).find('.navitems-cate-list-first-title').attr('href');
        let c1 = $(li).find('.navitems-cate-list-first-title span').first()[0];
        let title = $(c1).text();
        let item = {
            title,
            link,
            child: []
        };
        //----------------二级分类
        $(li).find('.navitems-cate-list-second-list>li').each((index2, li2) => {
            count++;
            link = $(li2).find('.navitems-cate-list-second-title a').attr('href');
            let c2 = $(li2).find('.navitems-cate-list-second-title a')[0];
            title = $(c2).text();
            let item2 = {
                title,
                link,
                child: []
            };
            item.child.push(item2);

            //----------------三级分类
            $(li2).find('.navitems-cate-list-third-list li').each((index3, li3) => {
                count++;
                link = $(li3).find('a').attr('href');
                title = $(li3).text();
                let item3 = {
                    title,
                    link,
                    child: []
                };
                item2.child.push(item3);
            });

        });

        categories.push(item);
    });

    let ouput = ``;
    let sql = ``;//sql数据
    let separator = '\n';
    // separator='';
    // separator='<br/>';
    let node = null;
    //----------------更新第1级数据
    categories.forEach((c1, i1) => {
        c1.id = inc++;
        c1.parent_id = 0;
        c1.sort_order = i1 + 1;
        c1.grade = 5;
        node = c1;
        sql += `INSERT INTO \`ecs_category\` VALUES ('${node.id}', '${node.title}', '', '', '${node.parent_id}', '${node.sort_order}', '', '', '0', '', '1', '${node.grade}', '', '0', '0', '', '0', '', '', '', '', '', '', '', '', '', '0', '');${separator}`;
    });

    //----------------更新第2,3级数据
    //----------------输出第1级至第3级的数据
    categories.forEach((c1, i1) => {
        c1.child.forEach((c2, i2) => {
            c2.id = inc++;
            c2.parent_id = c1.id;
            c2.sort_order = 50;
            c2.grade = 0;
            node = c2;
            sql += `INSERT INTO \`ecs_category\` VALUES ('${node.id}', '${node.title}', '', '', '${node.parent_id}', '${node.sort_order}', '', '', '0', '', '1', '${node.grade}', '', '0', '0', '', '0', '', '', '', '', '', '', '', '', '', '0', '');${separator}`;
            c2.child.forEach((c3, i3) => {
                c3.id = inc++;
                c3.parent_id = c2.id;
                c3.sort_order = 50;
                c3.grade = 0;
                node = c3;
                sql += `INSERT INTO \`ecs_category\` VALUES ('${node.id}', '${node.title}', '', '', '${node.parent_id}', '${node.sort_order}', '', '', '0', '', '1', '${node.grade}', '', '0', '0', '', '0', '', '', '', '', '', '', '', '', '', '0', '');${separator}`;
                let linkItem = {
                    id: node.id,
                    link: node.link
                };
                links.push(linkItem);
            });
        });
    });
    fs.writeFileSync(toFile, sql);//生成分类数据的sql代码,用于向数据库中插入分类数据
    fs.writeFileSync(linksFile, JSON.stringify(links));//生成分类链接数据,用于抓取数据
}

main();