import { HTTP_STATUS_CODES, ONLY_GET_RESPONSE_PROPERTIES, XHR_STATES } from './enums'

type MatchItem = {
  /** override response text */
  response?: string
  /** if matched, go on mock, default false */
  matched?: boolean
  /** send real XMLHttpRequest falg, default false */
  sendRealXhr?: boolean
  /** set request timeout, default 500 - 1000 */
  timeout?: number
  /** set response status */
  status?: number
}

interface HackXHR extends XMLHttpRequest {
  config: Map<any, any>
}

type RequestMatchFn = (requestInfo: { requestUrl: string; requestMethod: string }) => MatchItem

/**
 * simulate request time, range 500 - 1000
 * @returns timeout
 */
const getRequestTimeout = () => {
  const randomNum = Math.random()
  return (randomNum > 0.5 ? randomNum : randomNum + 0.5) * 1000
}
const ORIGIN_XHR = Symbol()

class HackXMLHttpRequest {
  static config = new Map()

  xhr: XMLHttpRequest = null

  constructor() {
    const OriginXhrConstructor = window[ORIGIN_XHR] || window.XMLHttpRequest
    this.xhr = new OriginXhrConstructor()
    this.proxyXhr(this.xhr)
  }

  private proxyXhr(originXhr: XMLHttpRequest) {
    const xhrMethods = this.hackXhrMethods()
    for (const property in originXhr) {
      if (xhrMethods[property]) {
        xhrMethods[property].call(this)
        continue
      }

      this.proxyOriginXhrProperties.call(this, property)
    }
  }

  /**
   * proxy all origin xhr property to HackXMLHttpRequest instance
   * @param originXhr
   */
  private proxyOriginXhrProperties(property) {
    if (typeof this.xhr[property] === 'function') {
      this[property] = this.xhr[property].bind(this.xhr)
    } else if (ONLY_GET_RESPONSE_PROPERTIES.includes(property)) {
      // make Only Getter Properties can be modified
      Object.defineProperty(this, property, {
        get: () => (this[`_${property}`] == undefined ? this.xhr[property] : this[`_${property}`]),
        set: (val) => (this[`_${property}`] = val),
        enumerable: true,
      })
    } else {
      Object.defineProperty(this, property, {
        get: () => this.xhr[property],
        set: (val) => (this.xhr[property] = val),
        enumerable: true,
      })
    }
  }

  private hackXhrMethods() {
    return {
      open: function () {
        this.open = function (method, url, async, username, password) {
          const requestMatch = HackXMLHttpRequest.config.get('requestMatch')
          if (typeof requestMatch === 'function') {
            this.matchItem = requestMatch({ requestMethod: method, requestUrl: url })
          }
          typeof async !== 'boolean' && (async = true)
          this.xhr.open(method, url, async, username, password)
        }
      },
      send: function () {
        this.send = (data) => {
          const {
            matched = false,
            response = '{}',
            sendRealXhr = false,
            timeout,
            status,
          } = this.matchItem as MatchItem
          if (matched) {
            sendRealXhr && this.xhr.send(data)
            this.readyState = XHR_STATES.HEADERS_RECEIVED
            this.dispatchEvent(new Event('readystatechange' /*, false, false, that*/))
            this.readyState = XHR_STATES.LOADING
            this.dispatchEvent(new Event('readystatechange' /*, false, false, that*/))
            setTimeout(
              () => {
                this.status = HTTP_STATUS_CODES[status] ? status : 200
                this.statusText = HTTP_STATUS_CODES[status] ?? HTTP_STATUS_CODES[200]
                this.responseText = this.response =
                  typeof response === 'object' ? JSON.stringify(response) : response

                this.readyState = XHR_STATES.DONE
                this.dispatchEvent(new Event('readystatechange' /*, false, false, that*/))
                this.dispatchEvent(new Event('load' /*, false, false, that*/))
                this.dispatchEvent(new Event('loadend' /*, false, false, that*/))
              },
              typeof timeout === 'number' ? timeout : getRequestTimeout(),
            )
          } else {
            this.xhr.send(data)
          }
        }
      },
    }
  }
}

export function hack(
  options: {
    force?: boolean
    onRequestMatch?: RequestMatchFn
  } = {},
): HackXHR {
  const { force = false, onRequestMatch } = options
  if (typeof onRequestMatch === 'function') {
    HackXMLHttpRequest.config.set('requestMatch', onRequestMatch)
  }

  window[ORIGIN_XHR] = window.XMLHttpRequest
  if (typeof force === 'boolean' && force) {
    Object.defineProperty(window, 'XMLHttpRequest', {
      value: HackXMLHttpRequest,
      enumerable: true,
      writable: false,
    })
  } else {
    ;(window as any).XMLHttpRequest = HackXMLHttpRequest
  }

  return HackXMLHttpRequest as any
}

export function unHack() {
  if (!!window[ORIGIN_XHR]) {
    Object.defineProperty(window, 'XMLHttpRequest', {
      value: window[ORIGIN_XHR],
      enumerable: true,
      writable: true,
    })
    window[ORIGIN_XHR] = null
  }
}

export function getOriginXHR() {
  return window[ORIGIN_XHR] ?? window.XMLHttpRequest
}
