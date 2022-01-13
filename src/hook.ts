import { createSymbol } from "./utils"

type GetterHandle<T> = (value: T, xhr: XMLHttpRequest) => T
type SetterHandle<T> = (value: T, xhr: XMLHttpRequest) => T
type FuncHandle = (xhr: XMLHttpRequest, ...args) => any

interface PropertyHandle<T = any> {
  getter?: GetterHandle<T>
  setter?: SetterHandle<T>
}

interface XMLHttpRequestProperty {
  readyState?: PropertyHandle<XMLHttpRequest['readyState']>
  response?: PropertyHandle<XMLHttpRequest['response']>
  responseText?: PropertyHandle<XMLHttpRequest['responseText']>
  responseType?: PropertyHandle<XMLHttpRequest['responseType']>
  responseURL?: PropertyHandle<XMLHttpRequest['responseURL']>
  responseXML?: PropertyHandle<XMLHttpRequest['responseXML']>
  status?: PropertyHandle<XMLHttpRequest['status']>
  statusText?: PropertyHandle<XMLHttpRequest['statusText']>
  timeout?: PropertyHandle<XMLHttpRequest['timeout']>
  withCredentials?: PropertyHandle<XMLHttpRequest['withCredentials']>
}

export interface InterceptManager extends XMLHttpRequestProperty, Partial<Omit<XMLHttpRequest, keyof XMLHttpRequestProperty>> {
}

export function hook(xhr: XMLHttpRequest, config: InterceptManager = {}) {
  if (!xhr) {
    return
  }

  for (const attr in xhr) {
    if (typeof xhr[attr] === "function") {
      this[attr] = wrapFunc(attr)
    } else {
      Object.defineProperty(this, attr, {
        get: getter(attr),
        set: setter(attr),
        enumerable: true
      })
    }
  }

  function configEvent(event, xhr: XMLHttpRequest) {
    const e: any = {}
    for (const attr in event) {
      e[attr] = event[attr]
    }
    e.target = e.currentTarget = xhr
    return e
  }

  function wrapFunc(attr: string) {
    return function (...args) {
      if (config[attr]) {
        const ret = (config[attr] as FuncHandle).call(this, args, xhr)
        if (ret) return ret
      }
      return xhr[attr].apply(xhr, args)
    }
  }

  function setter(attr: string) {
    return function (v) {
      const hook = config[attr]
      const key = createSymbol(attr)
      if (attr.startsWith('on')) {
        this[key] = v
        xhr[attr] = (e) => {
          e = configEvent(e, this)
          if (hook) {
            const ret = (hook as FuncHandle).call(this, xhr, e)
            if (!ret) {
              v.call(this, e)
            }
          } else {
            v.call(this, e)
          }
        }
      } else {
        const s = (hook as PropertyHandle)?.setter
        v = s && s(v, this) || v
        this[key] = v
        try {
          xhr[attr] = v
        } catch (e) { }
      }
    }
  }
  
  function getter(attr: string) {
    return function () {
      const key = createSymbol(attr)
      const v = this.hasOwnProperty(key) ? this[key] : xhr[attr]
      const g = (config[attr] as PropertyHandle)?.getter
      return g && g(v, this) || v
    }
  }
}