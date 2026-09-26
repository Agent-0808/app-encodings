// 入口：把 legacy 模块导出的函数挂到 window 上，供 index.html 里的内联事件处理器调用。
// P4 会把这些内联处理器改写为正式的事件绑定，届时本文件可以删除。
import * as basics from './basics.js'
import * as conversion from './conversion.ts'
import { convertAllEscapes, hex2char, convertCharStr2CP } from './conversionfunctions.js'
// index.html 的 hex/char/dec 小工具直接内联调用了 dec2char，需要一并挂到 window
import { dec2char } from './lib/codepoints.js'

Object.assign(window, basics, conversion, { convertAllEscapes, hex2char, convertCharStr2CP, dec2char })
