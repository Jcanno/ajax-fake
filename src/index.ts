import {
  XHR_ON_EVENT_HANDLERS,
  XHR_NON_ON_EVENT_HANDLERS,
  XHR_RESPONSE_PROPERTIES,
  XHR_STATES,
  XHR_REQUEST_PROPERTIES,
  HTTP_STATUS_CODES,
} from './enums'

type MatchItem = {
  /** override response text */
  response?: string
  /** if matched, go on mock, default false */
  matched?: boolean
  /** send real XMLHttpRequest falg, default false */
  sendRealXhr?: boolean
  /** set request delay, default 500 - 1000 */
  delay?: number
  /** set response status, default 200 */
  status?: number
}

type onRequestMatchFn = (requestInfo: { requestUrl: string; requestMethod: string }) => MatchItem

interface FakeXhr extends XMLHttpRequest {
  config: Map<'onRequestMatch', onRequestMatchFn>
}

/**
 * simulate request time, range 500 - 1000
 * @returns delay
 */
const getRequestDelay = () => {
  const randomNum = Math.random()
  return (randomNum > 0.5 ? randomNum : randomNum + 0.5) * 1000
}

const ORIGIN_XHR = Symbol()
const MATCHITEM = Symbol()

// event listener
const EventTarget = {
  addEventListener: function addEventListener(type, handle) {
    const events = this._events[type] || (this._events[type] = [])
    events.push(handle)
  },
  removeEventListener: function removeEventListener(type, handle) {
    const handles = this._events[type] || []

    let i = handles.length - 1
    while (i >= 0) {
      if (handles[i] === handle) {
        handles.splice(i, 1)
      }
      i--
    }
  },
  dispatchEvent: function dispatchEvent(event: Event) {
    const handles = this._events[event.type] || []
    for (let i = 0; i < handles.length; i++) {
      handles[i].call(this, event)
    }

    const onType = `on${event.type}`
    if (this[onType]) this[onType](event)
  },
}

const FakeXMLHttpRequest = function FakeXMLHttpRequest() {
  // init fake xhr properties
  XHR_ON_EVENT_HANDLERS.forEach((event) => {
    this[event] = null
  })
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
  this._xhr = null
  this._events = {}
  this._requestHeaders = {}
  this._responseHeaders = {}
  this[MATCHITEM] = {
    matched: false,
    response: null,
    sendRealXhr: false,
    timeout: 'default',
    status: 200,
  }
} as unknown as FakeXhr

function createXhr() {
  const OriginXhrConstructor = window[ORIGIN_XHR] || window.XMLHttpRequest
  const xhr = new OriginXhrConstructor()
  return xhr
}

FakeXMLHttpRequest.config = new Map()

const FakeXMLHttpRequestPrototype = {
  ...XHR_STATES,
  open(method, url, async, username, password) {
    const onRequestMatch = FakeXMLHttpRequest.config.get('onRequestMatch')
    if (typeof onRequestMatch === 'function') {
      try {
        this[MATCHITEM] = Object.assign(
          {},
          this[MATCHITEM],
          onRequestMatch({ requestMethod: method, requestUrl: url }),
        )
      } catch (error) {}
    }

    // sync property by real xhr bind to FakeXMLHttpRequest
    const bindEventHandle = function handle(event, xhr) {
      for (let i = 0; i < XHR_RESPONSE_PROPERTIES.length; i++) {
        try {
          this[XHR_RESPONSE_PROPERTIES[i]] = xhr[XHR_RESPONSE_PROPERTIES[i]]
        } catch (e) {}
      }
      this.dispatchEvent(new Event(event.type /*, false, false, that*/))
    }.bind(this)
    typeof async !== 'boolean' && (async = true)

    // if no matched, send real xhr
    if (!this[MATCHITEM]?.matched) {
      this._xhr = createXhr()

      // listen real xhr event handler, sync real xhr properties to fake xhr
      XHR_NON_ON_EVENT_HANDLERS.forEach((handler) => {
        this._xhr.addEventListener(handler, function (event) {
          // below this means this._xhr
          bindEventHandle(event, this)
        })
        // bind this means FakeXMLHttpRequest
      }, this)

      // sync with timeout / withCredentials
      XHR_REQUEST_PROPERTIES.forEach((property) => {
        try {
          this._xhr[property] = this[property]
        } catch (e) {}
      })

      this._xhr.open(method, url, async, username, password)
      return
    }

    // simulate xhr state change
    this.readyState = XHR_STATES.OPENED
    this.dispatchEvent(new Event('readystatechange' /*, false, false, this*/))
    // send real xhr if true in fake xhr
    if (this[MATCHITEM]?.sendRealXhr) {
      this._xhr = createXhr()
      this._xhr.open(method, url, async, username, password)
    }
  },
  send(data) {
    const { matched, response, sendRealXhr, delay: timeout, status } = this[MATCHITEM] as MatchItem

    // no matched, just send data
    if (!matched) {
      this._xhr.send(data)
      return
    }

    this.dispatchEvent(new Event('loadstart' /*, false, false, this*/))
    this.readyState = XHR_STATES.HEADERS_RECEIVED
    this.dispatchEvent(new Event('readystatechange' /*, false, false, that*/))
    this.readyState = XHR_STATES.LOADING
    this.dispatchEvent(new Event('readystatechange' /*, false, false, that*/))
    sendRealXhr && this._xhr.send(data)

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
      typeof timeout === 'number' ? timeout : getRequestDelay(),
    )
  },
  abort: function abort() {
    // check matched
    if (!this[MATCHITEM]?.matched) {
      this._xhr.abort()
      return
    }

    this.readyState = XHR_STATES.UNSENT
    this.dispatchEvent(new Event('abort'))
    this.dispatchEvent(new Event('error'))
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  overrideMimeType: function (/*mime*/) {},
  // set request header
  setRequestHeader: function (name, value) {
    // check matched or sendRealXhr is true
    if (!this[MATCHITEM]?.matched || this[MATCHITEM]?.sendRealXhr) {
      this._xhr.setRequestHeader(name, value)
      return
    }

    const requestHeaders = this._requestHeaders
    if (requestHeaders[name]) {
      requestHeaders[name] += ',' + value
    } else {
      requestHeaders[name] = value
    }
  },
  getResponseHeader: function (name) {
    if (!this[MATCHITEM]?.matched) {
      return this._xhr.getResponseHeader(name)
    }

    return this._responseHeaders[name.toLowerCase()]
  },
  getAllResponseHeaders: function () {
    if (!this[MATCHITEM]?.matched) {
      return this._xhr.getAllResponseHeaders()
    }

    const responseHeaders = this._responseHeaders
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

export function fake(
  options: {
    force?: boolean
    onRequestMatch?: onRequestMatchFn
  } = {},
) {
  const { force = false, onRequestMatch } = options
  if (typeof onRequestMatch === 'function') {
    FakeXMLHttpRequest.config.set('onRequestMatch', onRequestMatch)
  }

  // cache origin XHR
  window[ORIGIN_XHR] = window.XMLHttpRequest
  // we don't want other code modify xhr with force
  if (typeof force === 'boolean' && force) {
    Object.defineProperty(window, 'XMLHttpRequest', {
      value: FakeXMLHttpRequest,
      enumerable: true,
      writable: false,
    })
  } else {
    ;(window as any).XMLHttpRequest = FakeXMLHttpRequest
  }
}

export function unfake() {
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

export { FakeXMLHttpRequest }
