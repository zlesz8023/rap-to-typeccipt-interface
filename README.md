## rap2itf 是什么？

rap2itf 是在[rapper][https://www.yuque.com/rap/rapper/readme] 的基础上封装的一个工具，根据rapper接口文档生成为你生成 TypeScript 类型定义本地接口类型的工具。

## 为什么要单独开发这么一个工具？

rapper官方团队的工具包含的请求的封装，有些情况下，我仅仅需要生成 TypeScript的类型定义，

## 快速开始

1. 安装

```shell
npm i rap2itf -D
```

或

```shell
yarn add rap2itf -D
```

2. 在项目根目录添加配置文件.raprc.js 添加一下配置内容

```javascript
module.exports = {
    /** 必须 项目id */
    projectId: '',
    /**可选 rap服务器地址 这里配置的都是默认值*/
    rapUrl: 'http://rap2.taobao.org',
     /**可选 rapapi地址 */
    apiUrl: 'http://rap2api.taobao.org',
     /**可选 文件保存路径 */
    rapperPath: './src/types',
     /** 必须 token */
    token: '',
     /**可选 接口的id */
    interfaceId: '',
     /**可选 截取当前接口的的最后n位作为文件名和interface名，接口多解决文件名重复时可调整这个参数 */
    split: 2
}
```

3. 执行

```shell
 yarn rap 
```

或

```shell
 yarn rap2itf 
```

如果使用npm执行，需要在package.json 的 scripts中配置

```json
"scripts": {
       ...
        "rap": "rap" 
    },
```

然后执行

```
 npm run rap
```

4. 命令行参数

```
  .option('--apiUrl <apiUrl>', '设置Rap平台后端地址')
  .option('--rapUrl <rapUrl>', '设置Rap平台前端地址')
  .option('--rapperPath <rapperPath>', '设置生成代码所在目录')
  .option('--i <i>', '接口id')
  .option('--interfaceId <interfaceId>', '接口id')
  .option('--projectId <projectId>', '项目id')
  .option('--p <p>', '项目id')
  .option('--token <token>', '用户token')
  .option('--split <split>', '截取路径长度作为文件名')
  .option('--s <s>', '截取路径长度作为文件名')
```

## 参考文档

没有文档了

有需要请参考rapper的文档：[https://www.yuque.com/rap/rapper/install](https://www.yuque.com/rap/rapper/install)
