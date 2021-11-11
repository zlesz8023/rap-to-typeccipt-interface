import chalk from 'chalk';
import { format } from 'json-schema-to-typescript/dist/src/formatter';
import { DEFAULT_OPTIONS } from 'json-schema-to-typescript';
import {
  Intf,
  TRAILING_COMMA,
  IWriteFile
} from './types';
import { createInterfaceModel } from './core/base-creator';
import {
  writeFile,
  getMd5,
  latestVersion,
  fileOverWiriteconfirm,
} from './utils';
import { getInterfaces, creatHeadHelpStr } from './core/tools';
import {  findRapperVersion, getFiles } from './core/scanFile';
import url = require('url');
import * as semver from 'semver';
import * as ora from 'ora';
const packageJson = require('../package.json');
const path = require('path')


export interface IRapper {
  /** 必填，redux、normal 等 */
  // type: RAPPER_TYPE;
  /** 必填，api仓库地址，从仓库的数据按钮可以获得 */
  apiUrl: string;
  /** 选填，rap平台前端地址，默认是 http://rap2.taobao.org */
  rapUrl?: string;
  /** 选填，生成出 rapper 的文件夹地址, 默认 ./src/rapper */
  rapperPath?: string;
  // /** 选填，url映射，可用来将复杂的url映射为简单的url */
  // urlMapper?: IUrlMapper;
  /** 选填，输出模板代码的格式 */
  codeStyle?: {};
  /** 接口id 当前接口生成一个文件夹 */
  interfaceId?: string;
  /** token */
  token?: string;
/** 项目id */
  projectId?: string;
/** 生成的文件对应url的地址 */
  split?:number
}

const getWriteFile = async (existFileList:string[], outputFiles:IWriteFile[]) => {
  const tempoutfiles: IWriteFile[] = []
  const cmdPath = process.cwd()
  const handleOverWrite = {
    yes: (it) => {
      tempoutfiles.push(it)
      return true
    },
    no: (it) => {
      return true
    },
    allYes: (it) => {
      tempoutfiles.length = 0
      tempoutfiles.push(...outputFiles); return false
    },
    allNo:(it)=>{return false}
  }
  for await (const { path:pathname, content } of outputFiles) {
    if (existFileList.length && existFileList.includes(pathname)) {
      const rePath=path.relative(cmdPath,pathname)
      const { confirm } = await fileOverWiriteconfirm(`确定要覆盖文件: ${rePath} 吗？`,)
      const fun = handleOverWrite[confirm]
      if (typeof fun === 'function') {
        const goOn = fun({ path:pathname, content })
        if (goOn) {
          continue
        } else {
          break
        }
      }
    } else {
    // 清空
      tempoutfiles.length = 0
      // 添加所有的文件
      tempoutfiles.push(...outputFiles)
      break
    }
  }

  return tempoutfiles

}

export default async function ({
  // type,
  rapUrl = 'http://rap2.taobao.org',
  apiUrl = 'http://rap2api.taobao.org',
  rapperPath = './src/rapper',
  // urlMapper = (t) => t,
  codeStyle,
  interfaceId,
  split = 2,
  token,
  projectId
}: IRapper) {
  const rapperVersion: string = packageJson.version;
  console.log(`当前rapper版本: ${chalk.grey(rapperVersion)}`);
  const spinner = ora(chalk.grey('rapper: 开始检查版本'));
  spinner.start();

  /** 参数校验 */
  spinner.start(chalk.grey('rapper: 开始校验参数'));
  if (!projectId) {
    spinner.fail(chalk.grey('rapper: 没有配置projectId，无法项目信息'));
    process.exit(0)
  }
  if (!token) {
    spinner.fail(chalk.grey('rapper: 没有配置token，无法获取接口信息'));
    process.exit(0)
  }
  if (!interfaceId) {
    spinner.warn(chalk.gray ('rapper: interfaceId 没有配置，将会获取项目下所有接口 '));
  }
  // spinner.succeed(chalk.grey('rapper: 参数校验成功'));
  DEFAULT_OPTIONS.style = {
    ...DEFAULT_OPTIONS.style,
    singleQuote: true,
    semi: true,
    trailingComma: TRAILING_COMMA.ES5,
  };
  if (codeStyle && typeof codeStyle === 'object') {
    DEFAULT_OPTIONS.style = { ...codeStyle };
  }
  rapperPath = rapperPath.replace(/\/$/, '');
  rapUrl = rapUrl.replace(/\/$/, '');
  apiUrl = apiUrl.replace(/\/$/, '');

  /** 输出文件集合 */
  let outputFiles:IWriteFile[] = [];
  /** 所有接口集合 */
  let interfaces: Intf[] = [];

  spinner.start(chalk.grey('rapper: 正在从 Rap 平台获取接口信息...'));
  try {
    // interfaces = await getInterfaces(apiUrl);
    interfaces = await getInterfaces(apiUrl)
    spinner.succeed(chalk.grey('rapper: 获取接口信息成功'));
  } catch (e) {
    return new Promise(() => spinner.fail(chalk.red(`rapper: 获取接口信息失败，${e}`)));
  }
  if (typeof interfaceId !== 'undefined' && interfaceId !== '') {
    interfaces=interfaces.filter(it=>{return String(it.id)===String(interfaceId)})
  }
  if (interfaces.length === 0) {
    console.log(chalk.grey(`rapper: 没有找到interfaceId是${interfaceId}的接口`))
    process.exit(0)
  }
  /** Rap 接口引用扫描，如果 projectId 更改了就不再扫描，避免过多的报错信息展现在Terminal */
  spinner.start(chalk.grey('rapper: 正在生成模板代码...'));
  try {
    /** 生成接口文件模板请求函数和类型声明 */
    const interfaceModels = await createInterfaceModel(interfaces, { rapUrl },Number(split))
    interfaceModels.forEach(it => {
      outputFiles.push({
        path: path.resolve(rapperPath ,`${it.fileName}.ts`) ,
        content: format(`
        ${creatHeadHelpStr(rapperVersion)}
        ${it.body}
        ` , DEFAULT_OPTIONS),
      });
    })
    /** 生成的模板文件第一行增加MD5 */
    outputFiles = outputFiles.map((item) => ({
      ...item,
      content: `/* md5: ${getMd5(item.content)} */\n${item.content}`,
    }));
  } catch (err) {
    spinner.fail(chalk.red(`rapper: 失败！${err.message}`));
    return;
  }
    /** 扫描找出生成的模板文件是否被手动修改过 */
  spinner.start(chalk.grey('rapper: 检查文件是否被修改'));

  const existFileList = getFiles(rapperPath)
  // const changeFiles = findChangeFiles(existFileList);
  spinner.succeed(chalk.grey('rapper: 检查文件成功'));

  const tempoutfiles = await getWriteFile(existFileList,outputFiles)

  return Promise.all(tempoutfiles.map(async ({ path, content }) => {

    writeFile(path, content).then(() => {
      spinner.succeed(chalk.green(`写入成功: ${path}`));
    })
  }))
    .then(() => {
      spinner.succeed(chalk.green(`共同步了 ${tempoutfiles.length} 个接口`));
    })
    .catch((err) => {
      spinner.fail(chalk.red(`rapper: 失败！${err.message}`));
    });
}
