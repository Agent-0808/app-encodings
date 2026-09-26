// 入口：index.html 的内联事件处理器已在 P4 改写为 basics.init() 里的正式绑定，
// window 挂载不再需要，这里只剩启动。
import { init } from './basics.js'

init()
