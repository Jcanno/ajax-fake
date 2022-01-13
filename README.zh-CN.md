# ajax-fake

[English](https://github.com/Jcanno/ajax-fake)|简体中文

`ajax-fake`可以拦截原生 ajax 请求，我们可以借助它做一些`极客`的事，例如模拟 ajax 响应数据、状态码、请求时间等

## 例子

```js
import { fake, unfake } from 'ajax-fake'

const mockData = [
  {
    path: '/api/v1/article/list',
    method: 'GET',
    response: `{"success": true, "data": "hello", "code": 0}`,
  },
  {
    path: '/api/v2/foo',
    method: 'GET',
    response: `{"success": true, "data": "hello", "code": 0}`,
  },
]

fake({
  // 开启force，原始XMLHttpRequest对象不会被更改
  force: true,
  // 根据mockData查找匹配的请求
  // 如果存在onHandle配置，则会进一步处理
  // 不存在onHandle配置时，通过返回一个MatchToken来配置如何fake
  onMatch(req) {
    return mockData.find((item) => {
      const { path, method } = item
      return requestMethod.toUpperCase() === method.toUpperCase() && requestUrl === path
    })
  },
  /**
   * 可选，用于进一步处理onMatch中的数据
   * @param data onMatch中返回的数据
   * @return MatchToken
   */
  onHandle(data) {
    // 当返回值为空时，ajax-fake将发起真实ajax请求
    if (data.url.includes('v2')) {
      return
    }

    // 当返回值为MatchToken类型时，ajax-fake会模拟ajax请求
    return {
      response: data.response,
      // 我们可以通过配置sendRealXhr在matched为true的情况依然可以发起真实ajax请求
      // 注意当sendRealXhr为true时，实际上会有两个请求，一个是模拟的请求，另一个是真实请求
      // 模拟的请求不会出现在Chrome Network 面板，真实请求是附加的，我们处理的还是模拟请求的结果
      // 这个配置是为了让请求更具有欺骗性
      sendRealXhr: true,
      status: 200,
      delay: 2000,
    }
  },
  /**
   * 可选，用于拦截数据，可以修改响应信息
   * @param data onMatch中返回的数据
   */
  onIntercept(data) {
    return {
      // 方法，可以监听事件，this执行当前代理的xhr，可以修改数据
      onload(xhr) {
        this.responseText = '{"msg":"intercept onload mock"}'
        console.log('onload');
      },
      // 属性，拦截并修改数据
      responseText: {
        getter(val) {
          return '{"msg":"intercept getter mock"}'
        }
      }
    }
  }
})

// 取消ajax请求拦截
unfake()
```
