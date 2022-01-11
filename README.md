# ajax-fake

English|[简体中文](https://github.com/Jcanno/ajax-fake/blob/master/README.zh-CN.md)

We can use `ajax-fake` to intercept native ajax to do something hacking, such as mocking ajax response, status, timeout and so on.

## Example

```js
import { fake, unFake } from 'ajax-fake'

const mockData = [
  {
    path: '/api/v1/article/list',
    method: 'GET',
    response: `{"success": true, "data": "hello", "code": 0}`,
  },
]

fake({
  // XMLHttpRequest can's be written if true
  force: true,
  // custom request match
  onRequestMatch: ({ requestMethod, requestUrl }) => {
    // find matched item
    const matchedItem = mockData.find((item) => {
      const { path, method } = item
      return requestMethod.toUpperCase() === method.toUpperCase() && requestUrl === path
    })
    if (matchedItem) {
      return {
        // ajax-fake will simulate ajax request if matched is true
        matched: true,
        response: matchedItem.response,
        // ajax-fake has intercepted request when mathced, we can also send a real request by sendRealXhr
        // note that there are two requests with sendRealXhr true, one for simulate, another for real request
        // the simulate one will not appear in Chrome Network panel, the real request is additional, we still handle request result with simulate one
        // the option intents to make request more tricky
        sendRealXhr: true,
        status: 200,
        timeout: 2000,
      }
    } else {
      return {
        // send real ajax request if not matched
        matched: false,
      }
    }
  },
})

// cancel ajax request intercept
unFake()
```
