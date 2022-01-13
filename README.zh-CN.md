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
        // 当matched为true时ajax-fake会模拟ajax请求
        matched: true,
        response: matchedItem.response,
        // 我们可以通过配置sendRealXhr在matched为true的情况依然可以发起真实ajax请求
        // 注意当sendRealXhr为true时，实际上会有两个请求，一个是模拟的请求，另一个是真实请求
        // 模拟的请求不会出现在Chrome Network 面板，真实请求是附加的，我们处理的还是模拟请求的结果
        // 这个配置是为了让请求更具有欺骗性
        sendRealXhr: true,
        status: 200,
        delay: 2000,
      }
    } else {
      return {
        // 当matched为false时，ajax-fake将发起真实ajax请求
        matched: false,
      }
    }
  },
})

- force 选项的实际使用场景是什么？不想明白
- 更友好的api支持，onRequestMatch 当返回 undefined 时默认就是 { match: false }; 现在的功能返回 {} 和 { match: false } 应该是等效的吧；更进一步的，其实match可以不要吧？
- 增强功能，现在没有对真实xhr的拦截功能，我看关键字有intercept，是否考虑增加拦截器选项
- 考虑使用 context function api 更加方便


fake({
  // 过滤请求，匹配成功会进入handle做进一步处理，返回false，发送真实请求
  filter() {
    return mockData.some(...)
  },
  // 做进一步处理，req类型{ requestUrl: string; method: string } , res类型mock数据, 上面匹配的数据
  handle(req, res) {
    return {
      status: ,
      delay: ,
      response: ,
    }
  },
  // 发送真实请求时，用于拦截请求做修改，参考ajax-hook https://github.com/wendux/Ajax-hook/blob/master/src/xhr-hook.js
  interceptors: {
    // 方法
    onreadstatechange(xhr, ...args /* 原有的参数 */) {
      // 考虑把this指向xhr还是通过形参xhr？
      this.responseText = '1234'
    },
    // 属性
    responseText: {
      getter(v, xhr) {
        return update(v)
      },
      setter(value, xhr) {

      }
    }
  },
})

// 取消ajax请求拦截
unfake()
```
