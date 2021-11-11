#!/usr/bin/env node

import { rapper } from './index';
import { resolve } from 'path';
import chalk from 'chalk';
import * as program from 'commander';
import { IRapper } from './rapper';

const getConfig = () => {
  const cmdPath = process.cwd()
  let config = require(resolve(cmdPath, './package.json'));

  if (!config.rapper) {
    // console.log(chalk.yellow('尚未在 package.json 中配置 rapper'));
    const path=resolve(cmdPath, '.raprc')
    console.log(chalk.yellow(`尚未在正在读取${path}中的配置`))
    config = require(path)
  }
  const { projectId, rapUrl, apiUrl, rapperPath,interfaceId,token,split } = config.rapper || config;
  const flag = [{id:"projectId",value:projectId}, {id:'token',value:token}].every(it => {
    if (!it.value) {
      console.log(chalk.yellow(`尚未在配置文件中配置${it.id}`));
      return false
    }
    return true
  })
  if (!flag) {
    process.exit(1);
  }
  return {projectId, rapUrl, apiUrl, rapperPath,interfaceId,token,split}
}

;(() => {
  program
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
    program.parse(process.argv);


  let {apiUrl,rapUrl,rapperPath,token,i,interfaceId,p,projectId,split,s }=program

  let rapperConfig: IRapper;
  const config=getConfig()

  apiUrl = apiUrl || config.apiUrl
  rapperPath = rapperPath || config.rapperPath
  token = token || config.token
  projectId = p || projectId || projectId
  interfaceId = i || interfaceId || config.interfaceId
  split = s || split || config.split
  rapUrl=rapUrl||config.rapUrl
  rapperConfig = {
    ...config,
    split,
    token,
    apiUrl: `${apiUrl}/repository/get?id=${projectId}&token=${token}`,
    rapperPath: resolve(process.cwd(), rapperPath || './src/types'),
    projectId,
    interfaceId,
    rapUrl
  };
  console.log(rapperConfig);
  rapper(rapperConfig);
})();
