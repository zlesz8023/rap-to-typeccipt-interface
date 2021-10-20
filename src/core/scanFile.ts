/**
 * 扫描项目文件，排除是否存在 rap 接口已删除，但是项目仍然在使用的接口
 */
import * as fs from 'fs'
import * as path from 'path'
import chalk from 'chalk'
import { resolve } from 'path'
import { getMd5 } from '../utils'

/**
 * 获取所有需要扫描的文件
 * @param parentPath
 */
export function getFiles(parentPath: string): string[] {
  let fileList: string[] = []

  /* 不扫描无效路径 */
  if (parentPath.indexOf('/.') > -1 || parentPath.indexOf('node_modules') > -1) {
    return fileList
  }

  let files = []
  try {
    files = fs.readdirSync(parentPath)
  } catch (err) {}

  files.forEach((item) => {
    item = path.join(parentPath, item)

    if (item.indexOf('src') < 0) {
      return
    }

    const stat = fs.statSync(item)
    try {
      if (stat.isDirectory()) {
        fileList = fileList.concat(getFiles(item))
      } else if (stat.isFile()) {
        fileList.push(item)
      }
    } catch (error) {
      console.log(chalk.red(`rapper: Rap 接口引用扫描失败, ${error}`))
    }
  })
  return fileList
}

/** 校验文件 MD5，是否被改动 */
function isFileChange(contentArr: string[]): boolean {
  const matchMD5 = contentArr[0].match(/\/\*\smd5:\s(\S*)\s\*\//) || []
  const oldMD5 = matchMD5[1]
  return oldMD5 !== getMd5(contentArr.slice(1).join('\n'))
}




/**
 * 扫描找出生成的模板文件是否被手动修改过
 * @param rapperPath, 模板文件地址
 */
export function findChangeFiles(fileList: string[]): string[] {
  // const fileList = getFiles(rapperPath)
  const changeList: string[] = []
  fileList.forEach((filePath) => {
    /** 读取文件的内容 */
    const content = fs.readFileSync(filePath, 'utf-8') || ''
    /** 校验文件 MD5，是否被改动 */
    if (isFileChange(content.split(/\r|\n|\r\n/))) {
      changeList.push(resolve(process.cwd(), filePath))
    }
  })
  return changeList
}

/**
 * 从模板文件的前6行中扫描找出生成模板文件的 rapper 版本
 */
export function findRapperVersion(rapperPath: string): string {
  let version = ''
  try {
    const content = fs.readFileSync(`${rapperPath}/index.ts`, 'utf-8') || ''
    const contentArr = content.split(/\r|\n|\r\n/)
    if (contentArr.length) {
      const matchMD5 =
        contentArr
          .slice(0, 6)
          .join('\n')
          .match(/\/\*\sRapper版本:\s(\S*)\s\*\//) || []
      version = matchMD5[1]
    }
  } catch (err) {}
  return version
}
