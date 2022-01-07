# ajax-fake

English|[简体中文](https://github.com/Jcanno/ajax-fake/blob/master/README.zh-CN.md)

We can use `ajax-fake` to intercept native ajax to do something hacking, such as mocking ajax response, status, timeout and so on.

## Example

```js
import { fake } from 'ajax-fake'

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
        matched: true,
        response: matchedItem.response,
        sendRealXhr: true,
        status: 200,
        timeout: 2000,
      }
    } else {
      return {
        matched: false,
      }
    }
  },
})
```
