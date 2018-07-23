/**
 * 作用:配置
 * 作者:realperson
 * 日期:2018-07-19
 */

module.exports = {
    tempFile: './temp/index.html',//临时文件
    pageFile: './data/categories.js',//分类数据(分页)
    errorCategoryFile: './data/errorCategories.js',//保存出错的分类id
    detailFile: './data/detail.js',//商品详情链接数据
    brandFile: './data/brands.js',//商品品牌数据
    brandSqlFile: './data/brands.sql',//商品品牌数据(用于向数据库插入数据)
    errorBrandFile: './data/errorBrands.js',//商品品牌数据(出错的链接数据)
    goodsFile: './data/goods.js',//商品数据
    goodsSqlFile: './data/goods.sql',//商品数据(用于向数据库插入数据)
    errorGoodsFile: './data/errorGoods.js',//商品数据(出错的链接数据)
    imagesFile: './data/images.js',//图片数据
    imagesSqlFile: './data/images.sql',//图片数据(用于向数据库插入数据)
    urlPrefix: 'http://www.168mlj.com' //网站地址
};