import chalk from 'chalk'
import axios from 'axios'
import * as _ from 'lodash'
import { IModules, ICollaborator, Interface, Intf } from '../types'

function get(url: string, data?: any) {
  return axios.get(url, { timeout: 1000 * 20, data, headers: {} }).then((res) => res.data)
}

function updateURLParameter(url: string, param: string, paramVal: string) {
  let newAdditionalURL = ''
  let tempArray = url.split('?')
  const baseURL = tempArray[0]
  const additionalURL = tempArray[1]
  let temp = ''
  if (additionalURL) {
    tempArray = additionalURL.split('&')
    for (let i = 0; i < tempArray.length; i++) {
      if (tempArray[i].split('=')[0] != param) {
        newAdditionalURL += temp + tempArray[i]
        temp = '&'
      }
    }
  }

  const rowsTxt = temp + '' + param + '=' + paramVal
  return baseURL + '?' + newAdditionalURL + rowsTxt
}

function trimInterfaces(interfaces: Intf[]) {
  return interfaces.map((item) => ({ ...item, name: item.name.trim() }))
}

export function interfaceToObj(interfaces: Intf[]) {
  return interfaces.reduce<Record<string, Intf[]>>((counter, val) => {
    const { id, name } = val
    val.name = name?.trim()
    if (counter[id]) {
      counter[id].push(val)
    } else {
      counter[id] = [val]
    }
    return counter
  }, {})
}

/** 从rap查询所有接口数据 */
export async function getInterfaces(rapApiUrl: string) {
  const response = await axios.get(rapApiUrl, { timeout: 1000 * 20 })
  const data = response.data.data
  const modules: Array<IModules> = data.modules
  const collaborators: Array<ICollaborator> = data.collaborators

  let interfaces = _(modules)
    .map((m) => m.interfaces)
    .flatten()
    .value()

  if (collaborators.length) {
    const collaboratorsInterfaces = await Promise.all(
      collaborators.map((e) =>
        getInterfaces(
          updateURLParameter(
            updateURLParameter(rapApiUrl, 'id', e.id.toString()),
            'token',
            e.token || '',
          ),
        ),
      ),
    )
    // 协作仓库有重复接口，将被主仓库覆盖
    interfaces = _.unionBy(interfaces, _.flatten(collaboratorsInterfaces), (item) => {
      // 描述中如果存在唯一标示定义，优先使用
      const matches = item.description.match(/\${union:\s?(.*)}/)
      if (matches) {
        const [__, unionID] = matches
        return unionID
      }
      // 使用 method-url 作为 key
      return `${item.method}-${item.url}`
    })
  }

  // console.log('返回的结果',interfaces)

  // 去除字段中的空格
  return trimInterfaces(interfaces)
}

/** 生成提示文案 */
export function creatHeadHelpStr(rapperVersion: string): string {
  return `
  /* Rapper版本: ${rapperVersion} */
  /* eslint-disable */
  /* tslint:disable */
  // @ts-nocheck
  
  /**
   * 本文件由 Rapper 同步 Rap 平台接口，自动生成，请勿修改
   */
  `
}

/**
 * 生成接口提示文案
 * @param rapUrl Rap平台地址
 * @param itf 接口信息
 * @param extra 额外信息
 */
export function creatInterfaceHelpStr(rapUrl: string, itf: Intf, extra?: string): string {
  const { name, repositoryId, moduleId, id } = itf
  if (extra) {
    return `
    /**
     * 接口名：${name}
     * Rap 地址: ${rapUrl}/repository/editor?id=${repositoryId}&mod=${moduleId}&itf=${id}
     * 请求方式：${itf.method}
     * 请求地址：${itf.url}
     * ${extra}
     */`
  }

  return `
    /**
     * 接口名：${name}
     * Rap 地址: ${rapUrl}/repository/editor?id=${repositoryId}&mod=${moduleId}&itf=${id}
     * 请求方式：${itf.method}
     * 请求地址：${itf.url}
     */`
}
