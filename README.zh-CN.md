# ajax-fake

[English](https://github.com/Jcanno/ajax-fake)|简体中文

`ajax-fake`可以拦截原生 ajax 请求，我们可以借助它做一些`极客`的事，例如模拟 ajax 响应数据、状态码、请求时间等

## 例子

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
  // 开启force，原始XMLHttpRequest对象不会被更改
  force: true,
  // 请求匹配方法
  onRequestMatch: ({ requestMethod, requestUrl }) => {
    // 根据mockData查找匹配的请求
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
