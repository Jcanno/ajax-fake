const prefix = 'axios onMatch test fail'

// onMatch
;(function() {
    const mockData = [
        { url: './test.json', text: 'test', status: 201 },
    ]    
    af.fake({
        onMatch(req) {
            return (
                mockData
                    .map(item => ({ url: item.url, status: item.status, response: item.text }))
                    .find(item => item.url === req.url)
            )
        }
    })

    axios.get('./test.json').then(res => {
        except(() => res.data === 'test' && res.status === 201)
            .toBe(true)
            .log(`${prefix} on onMatch`)
    })

})()

// // onHandle
// ;(function() {
//     const mockData = [
//         { url: './test.json', text: 'test', status: 201 },
//         { url: './test2.json', text: 'test2', status: 202 },
//     ]    
//     af.fake({
//         onMatch(req) {
//             return mockData.find(item => item.url === req.url)
//         },
//         onHandle(data) {
//             if (data.url === './test2.json') {
//                 return {
//                     response: 'mock test2',
//                     status: 202,
//                 }
//             }
//         }
//     })

//     axios.get('./test.json').then(res => {
//         except(() => (JSON.stringify(res.data) === '{"foo":1}' && res.status === 200))
//             .toBe(true)
//             .log(`${prefix} on onHandle by test`)
//     })
//     axios.get('./test2.json').then(res => {
//         except(() => (res.data === 'mock test2' && res.status === 202))
//             .toBe(true)
//             .log(`${prefix} on onHandle by test2`)
//     })
// })()


// // onIntercept
// ;(function() {
//     af.fake({
//         onIntercept() {
//             return {
//                 responseText: {
//                     getter(val) {
//                         const obj = JSON.parse(val)
//                         obj.foo *= 10
//                         return JSON.stringify(obj)
//                     }
//                 }
//             }
//         }
//     })
//     axios.get('./test.json').then(res => {
//         except(() => (JSON.stringify(res.data) === '{"foo":10}'))
//             .toBe(true)
//             .log(`${prefix} on onHandle by test ---- 1`)
//     })
//     axios.get('./test2.json').then(res => {
//         except(() => (JSON.stringify(res.data) === '{"foo":20}'))
//             .toBe(true)
//             .log(`${prefix} on onHandle by test2---- 2`)
//     })



//     af.fake({
//         onIntercept() {
//             function modify () {
//                 if (this.readyState === 4) {
//                     this.responseText = '1'
//                 }
//             }
//             return {
//                 onreadystatechange: modify,
//                 onload: modify,
//                 onloadend: modify,
//             }
//         }
//     })
//     axios.get('./test.json').then(res => {
//         except(() => (JSON.stringify(res.data) === '1'))
//             .toBe(true)
//             .log(`${prefix} on onHandle by test ---- 3`)
//     })
//     axios.get('./test2.json').then(res => {
//         except(() => (JSON.stringify(res.data) === '1'))
//             .toBe(true)
//             .log(`${prefix} on onHandle by test2 ---- 4`)
//     })
// })()


// // 联合使用
// ;(function() {
//     const mockData = [
//         { url: './test.json', text: 'test', status: 201 },
//         { url: './test2.json', text: 'test2', status: 202 },
//         { url: './test3.json', text: 'test3', status: 203 },
//     ]    
//     af.fake({
//         onMatch(req) {
//             return mockData.find(item => item.url === req.url)
//         },
//         onHandle(data) {
//             if (data.url === './test.json') {
//                 return {
//                     response: 'mock',
//                     status: data.status,
//                 }
//             }
//         },
//         onIntercept(data) {
//             function modify () {
//                 if (this.readyState === 4) {
//                     this.responseText = '1'
//                 }
//             }
//             return {
//                 onreadystatechange: modify,
//                 onload: modify,
//                 onloadend: modify,
//             }
//         }
//     })

//     axios.get('./test.json').then(res => {
//         except(() => (res.data === 'mock'))
//             .toBe(true)
//             .log(`${prefix} on All by test`)
//     })
//     axios.get('./test2.json').then(res => {
//         except(() => (JSON.stringify(res.data) === '1'))
//             .toBe(true)
//             .log(`${prefix} on All by test2`)
//     })
//     axios.get('./test4.json').then(res => {
//         except(() => (JSON.stringify(res.data) === '1'))
//             .toBe(true)
//             .log(`${prefix} on All by test4`)
//     })
// })()


// // 联合使用
// ;(function() {
//     const mockData = [
//         { url: './test.json', text: 'test', status: 201 },
//         { url: './test2.json', text: 'test2', status: 202 },
//     ]    
//     af.fake({
//         onMatch(req) {
//             return mockData.find(item => item.url === req.url)
//         },
//         onHandle(data) {
//             if (data.url === './test4.json') {
//                 return
//             }
//             return {
//                 response: 'mock',
//                 status: data.status,
//                 sendRealXhr: data.url === './test.json',
//             }
//         },
//         onIntercept(data) {
//             function modify () {
//                 if (this.readyState === 4) {
//                     this.responseText = '1'
//                 }
//             }
//             return {
//                 onreadystatechange: modify,
//                 onload: modify,
//                 onloadend: modify,
//             }
//         }
//     })

//     axios.get('./test.json').then(res => {
//         console.log(res);
//         except(() => (res.data == '1'))
//             .toBe(true)
//             .log(`${prefix} on both handle and intercept by test`)
//     })
//     axios.get('./test2.json').then(res => {
//         except(() => (res.data === 'mock'))
//             .toBe(true)
//             .log(`${prefix} on both handle and intercept by test2`)
//     })
//     axios.get('./test4.json').then(res => {
//         except(() => (res.data == '1'))
//             .toBe(true)
//             .log(`${prefix} on both handle and intercept by test4`)
//     })
// })()

