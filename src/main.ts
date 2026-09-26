// 入口：把 legacy 模块导出的函数挂到 window 上，供 index.html 里的内联事件处理器调用。
// P4 会把这些内联处理器改写为正式的事件绑定，届时本文件可以删除。
import * as basics from './basics.js'
import * as conversion from './conversion.ts'
import { convertAllEscapes } from './conversionfunctions.js'

Object.assign(window, basics, conversion, { convertAllEscapes })

// 两栏输出行与勾选面板按注册表生成，必须在挂好 window 之后执行
basics.init()
