import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as inquirer from 'inquirer';
import chalk from 'chalk';
import axios from 'axios';
const packageJson = require('../package.json');

export function withoutExt(p: string) {
  return p.replace(/\.[^/.]+$/, '');
}

export function relativeImport(from: string, to: string) {
  return withoutExt('./' + path.relative(path.dirname(from), to));
}



export function writeFile(filepath: string, contents: string) {
  return new Promise<void>((resolve, reject) => {
    mkdirp(path.dirname(filepath), function(err) {
      if (err) return reject(`filepath: ${filepath}, ${err}`);
      fs.writeFile(filepath, contents, err => {
        if (err) return reject(`filepath: ${filepath}, ${err}`);
        resolve();

      });
    });
  });
}

export function moveFile(from: string, to: string) {
  return new Promise<void>((resolve, reject) => {
    mkdirp(path.dirname(to), function(err) {
      if (err) return reject(`读取文件失败: ${from}, ${err}`);
      const contents = fs.readFileSync(from);
      fs.writeFile(to, contents, err => {
        if (err) return reject(`写入文件失败: ${to}, ${err}`);
        resolve();
      });
    });
  });
}

/**
 * 命令是否在根目录执行
 */
export function isInRoot() {
  const cwd = process.cwd();
  const flag = fs.existsSync(path.resolve(cwd, 'package.json'));
  return flag;
}

/** 获取文件md5 */
export function getMd5(fileContent: string) {
  const hash = crypto.createHash('md5');
  hash.update(fileContent);
  return hash.digest('hex');
}




/** 模板文件覆盖确认 */
export async function fileOverWiriteconfirm(message: string) {

  const question = [
    {
      name: 'confirm',
      type: 'list',
      message: chalk.green(message),
      default: ['no'],
      choices: [{ name:"是",value:'yes'},{ name:"全是",value:'allYes'},{ name:"否",value:'no'},{ name:"全否",value:'allNo'}]
    },
  ];
  const answers = await inquirer.prompt(question);
  return answers;
}


/** 获取当前包名 */
export function getPackageName() {
  return packageJson.name;
}

export function getPackageRegistry() {
  return packageJson.publishConfig.registry;
}

/** 获取最新的版本 */
export async function latestVersion(packageName: string, isBeta?: boolean) {
  const response = await axios.get(`${getPackageRegistry()}/${packageName}`, {
    timeout: 1000 * 10,
  });
  const versionsList = Object.keys(response.data.versions);
  for (let i = versionsList.length - 1; i >= 0; i--) {
    if (isBeta) {
      return versionsList[i];
    }
    if (versionsList[i].indexOf('beta') === -1) {
      return versionsList[i];
    }
  }
}
