import chalk from 'chalk'
import convert from './convert'
import { Intf, ICreatorExtr } from '../types'
import { creatInterfaceHelpStr } from './tools'
import { getPackageName } from '../utils'

/** 生成 Models 文件 */
export async function createInterfaceModel(interfaces: Array<Intf>, extr: ICreatorExtr, len = 2) {
  return await Promise.all(
    interfaces.map(async (itf) => {
      let body = ''
      const splieUrls = itf.url.split(/[/\\{}]/g).filter((it) => it !== '')
      const length = Math.max(1, Math.min(len, splieUrls.length))
      const names = splieUrls
        .slice(splieUrls.length - length, splieUrls.length)
        .map((it) => it.charAt(0).toUpperCase() + it.slice(1))

      const fileName = Array.from(names, (it) => it.charAt(0).toUpperCase() + it.slice(1)).join('')
      try {
        const [reqItf, resItf] = await convert(itf)
        body = `
              Req: ${reqItf.replace(/export (type|interface) Req =?/, '').replace(/;/g, '')};
              Res: ${resItf.replace(/export (type|interface) Res =?/, '').replace(/;/g, '')};

          `
      } catch (error) {
        throw chalk.red(`接口：${extr.rapUrl}/repository/editor?id=${itf.repositoryId}&mod=${itf.moduleId}&itf=${itf.id}
          生成出错
          ${error}`)
      }
      body = `
      ${creatInterfaceHelpStr(extr.rapUrl, itf)}
      export interface ${fileName} {
          ${body}
      };
  `
      return { fileName, body }
    }),
  )
}
