export const XHR_STATES = {
  // The object has been constructed.
  UNSENT: 0,
  // The open() method has been successfully invoked.
  OPENED: 1,
  // All redirects (if any) have been followed and all HTTP headers of the response have been received.
  HEADERS_RECEIVED: 2,
  // The response's body is being received.
  LOADING: 3,
  // The data transfer has been completed or something went wrong during the transfer (e.g. infinite redirects).
  DONE: 4,
}

export const ONLY_GET_RESPONSE_PROPERTIES = [
  'readyState',
  'responseURL',
  'status',
  'statusText',
  'response',
  'responseText',
  'responseXML',
]
