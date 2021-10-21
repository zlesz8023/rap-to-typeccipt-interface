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
    console.log(chalk.yellow('尚未在 package.json 中配置 rapper'));
    const path=resolve(cmdPath, '.raprc')
    console.log(chalk.yellow(`尚未在正在读取${path}中的配置`))
    config = require(path)
  }
  const { projectId, rapUrl, apiUrl, rapperPath,interfaceId,token, } = config.rapper || config;
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
  return {projectId, rapUrl, apiUrl, rapperPath,interfaceId,token}
}

;(() => {
  program
    .option('--type <typeName>', '设置类型')
    .option('--apiUrl <apiUrl>', '设置Rap平台后端地址')
    .option('--rapUrl <rapUrl>', '设置Rap平台前端地址')
    .option('--rapperPath <rapperPath>', '设置生成代码所在目录')
    .option('--interfaceId <interfaceId>', '设置接口要生成的接口的id')
  program.parse(process.argv);

  let rapperConfig: IRapper;
  if (program.type && program.apiUrl && program.rapUrl) {
    /** 通过 scripts 配置 */
    rapperConfig = {
      apiUrl: program.apiUrl,
      rapUrl: program.rapUrl,
      rapperPath: resolve(process.cwd(), program.rapperPath || './src/types/'),
    };
    if (program.resSelector) {
      rapperConfig = { ...rapperConfig };
    }
  } else {
    const { apiUrl,rapperPath,projectId,token,...others}=getConfig()
    rapperConfig = {
      apiUrl: `${apiUrl}/repository/get?id=${projectId}&token=${token}`,
      rapperPath: resolve(process.cwd(), rapperPath || './src/types'),
      ...others
    };
  }
  rapper(rapperConfig);
})();
