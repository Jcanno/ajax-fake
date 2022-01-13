import { XKey, EKey, ReqKey, ResKey, MKey, HKey } from './constants'
import {
  XHR_ON_EVENT_HANDLERS,
  XHR_NON_ON_EVENT_HANDLERS,
  XHR_RESPONSE_PROPERTIES,
  XHR_STATES,
  XHR_REQUEST_PROPERTIES,
  HTTP_STATUS_CODES,
} from './enums'
import { getRequestDelay, noop } from './utils'
import { EventTarget } from './event'
import { hook, InterceptManager } from './hook'

type MatchToken = {
  /** override response text */
  response?: string
  /** send real XMLHttpRequest falg, default false */
  sendRealXhr?: boolean
  /** set request delay, default 500 - 1000 */
  delay?: number
  /** set response status, default 200 */
  status?: number
}
interface RequestInfo {
  requestUrl: string
  method: string
}

type HandleManager = (requestInfo: RequestInfo) => MatchToken | undefined

let OriginXhr

const defaultValue: MatchToken & { matched: boolean } = {
  // mark whether matched
  matched: false,
  response: '',
  sendRealXhr: false,
  delay: 0,
  status: 200,
}

const FakeXMLHttpRequest = function () {
  // init fake xhr properties
  XHR_ON_EVENT_HANDLERS.forEach(event => this[event] = null)
  this.readyState = XHR_STATES.UNSENT
  this.response = ''
  this.responseText = ''
  this.responseType = ''
  this.responseURL = ''
  this.responseXML = null
  this.status = 0
  this.statusText = ''
  this.timeout = 0
  this.withCredentials = false
  this.upload = Object.create(EventTarget)

  // private properties
  this[XKey] = null             // $$xhr
  this[EKey] = {}               // $$events
  this[ReqKey] = {}             // $$requestHeaders
  this[ResKey] = {}             // $$responseHeaders
  this[MKey] = defaultValue     // $$matchItem
  this[HKey] = hook             // $$hook
} as unknown as XMLHttpRequest

// get origin xhr
export function getOriginXHR(): typeof XMLHttpRequest {
  return OriginXhr ?? window.XMLHttpRequest
}

// create origin xhr
export function createXhr() {
  const OriginXhr = getOriginXHR()
  return new OriginXhr()
}

interface FakeOptions {
  force?: boolean
  handle?: HandleManager
  interceptors?: InterceptManager
}
 
export function fake(options: FakeOptions = { handle: noop }) {
  const FakeXMLHttpRequestPrototype = {
    ...XHR_STATES,
    open(method: string, url: string, async: boolean, username: string, password: string) {
      // simulate xhr state change
      this.readyState = XHR_STATES.OPENED
      this.dispatchEvent(new Event('readystatechange' /*, false, false, this*/))
  
      // sync property by real xhr bind to FakeXMLHttpRequest
      const bindEventHandle = (event, xhr) => {
        for (let i = 0; i < XHR_RESPONSE_PROPERTIES.length; i++) {
          try {
            this[XHR_RESPONSE_PROPERTIES[i]] = xhr[XHR_RESPONSE_PROPERTIES[i]]
          } catch (e) { }
        }
        this.dispatchEvent(new Event(event.type /*, false, false, that*/))
      }
      typeof async !== 'boolean' && (async = true)

      const req: RequestInfo = { requestUrl: url, method }
  
      // match success will fake, else send real xhr
      const match = options.handle!(req)
      if (match) {
        // merge config
        this[MKey] = { ...this[MKey], ...match, matched: true }

        // send real xhr if true in fake xhr
        if (this[MKey].sendRealXhr) {
          this[XKey] = createXhr()
          if (options.interceptors) {
            this[HKey](this[XKey], options.interceptors)
          }
          this[XKey].open(method, url, async, username, password)
        }
        return
      }

      this[XKey] = createXhr()
      // intercept
      if (options.interceptors) {
        this[HKey](this[XKey], options.interceptors)
        this[XKey].open(method, url, async, username, password)
        return
      }

      // listen real xhr event handler, sync real xhr properties to fake xhr
      XHR_NON_ON_EVENT_HANDLERS.forEach((handler) => {
        this[XKey].addEventListener(handler, function (event) {
          // below this means this[xKey]
          bindEventHandle(event, this)
        })
        // bind this means FakeXMLHttpRequest
      }, this)

      // sync with timeout / withCredentials
      XHR_REQUEST_PROPERTIES.forEach((property) => {
        try {
          this[XKey][property] = this[property]
        } catch (e) { }
      })

      this[XKey].open(method, url, async, username, password)
    },
    send(data) {
      const { matched, response, sendRealXhr, delay, status } = this[MKey] as MatchToken & { matched: boolean }
  
      // no matched, just send data
      if (!matched) {
        this[XKey].send(data)
        return
      }
  
      this.dispatchEvent(new Event('loadstart' /*, false, false, this*/))
      this.readyState = XHR_STATES.HEADERS_RECEIVED
      this.dispatchEvent(new Event('readystatechange' /*, false, false, that*/))
      this.readyState = XHR_STATES.LOADING
      this.dispatchEvent(new Event('readystatechange' /*, false, false, that*/))
      sendRealXhr && this[XKey].send(data)
  
      setTimeout(
        () => {
          this.status = HTTP_STATUS_CODES[status!] ? status : 200
          this.statusText = HTTP_STATUS_CODES[status!] ?? HTTP_STATUS_CODES[200]
          this.responseText = this.response = typeof response === 'object' ? JSON.stringify(response) : response
  
          this.readyState = XHR_STATES.DONE
          this.dispatchEvent(new Event('readystatechange' /*, false, false, that*/))
          this.dispatchEvent(new Event('load' /*, false, false, that*/))
          this.dispatchEvent(new Event('loadend' /*, false, false, that*/))
        },
        typeof delay === 'number' ? delay : getRequestDelay(),
      )
    },
    abort() {
      // check matched
      if (!this[MKey].matched) {
        this[XKey].abort()
        return
      }
  
      this.readyState = XHR_STATES.UNSENT
      this.dispatchEvent(new Event('abort'))
      this.dispatchEvent(new Event('error'))
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    overrideMimeType: noop,
    // set request header
    setRequestHeader(name: string, value: string) {
      // check matched or sendRealXhr is true
      if (!this[MKey].matched || this[MKey].sendRealXhr) {
        this[XKey].setRequestHeader(name, value)
        return
      }
  
      const requestHeaders = this[ReqKey]
      if (requestHeaders[name]) {
        requestHeaders[name] += ',' + value
      } else {
        requestHeaders[name] = value
      }
    },
    getResponseHeader(name: string) {
      if (!this[MKey].matched) {
        return this[XKey].getResponseHeader(name)
      }
  
      return this[ResKey][name.toLowerCase()]
    },
    getAllResponseHeaders() {
      if (!this[MKey].matched) {
        return this[XKey].getAllResponseHeaders()
      }
  
      const responseHeaders = this[ResKey]
      let headers = ''
      for (const h in responseHeaders) {
        if (!responseHeaders.hasOwnProperty(h)) continue
        headers += h + ': ' + responseHeaders[h] + '\r\n'
      }
      return headers
    },
  }
  
  Object.setPrototypeOf(FakeXMLHttpRequestPrototype, EventTarget)
  ;(FakeXMLHttpRequest as any).prototype = FakeXMLHttpRequestPrototype

  // cache origin XHR
  OriginXhr = window.XMLHttpRequest
  // we don't want other code modify xhr with force
  if (typeof options.force === 'boolean' && options.force) {
    Object.defineProperty(window, 'XMLHttpRequest', {
      value: FakeXMLHttpRequest,
      enumerable: true,
      writable: false,
    })
  } else {
    window.XMLHttpRequest = FakeXMLHttpRequest as any
  }
}

export function unfake() {
  if (!!OriginXhr) {
    Object.defineProperty(window, 'XMLHttpRequest', {
      value: OriginXhr,
      enumerable: true,
      writable: true,
    })
    OriginXhr = null
  }
}

export { FakeXMLHttpRequest }