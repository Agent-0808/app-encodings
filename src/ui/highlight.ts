// 输入框镜像层（重构方案 §5.3 / §8.3 #1）：<input> 内部放不了 span，
// 在输入框背后叠一个同字号的镜像 div，按区间切 span 画高亮背景；输入框背景透明、
// 压在镜像之上，不改键盘、粘贴、表单等任何输入语义。
// 交互只做 hover（§8.1），另配方向键移动与 Esc 取消的键盘可达。

/** 一个镜像层：按区间重建高亮 span、命中测试与点亮 */
export interface Mirror {
	/** 当前区间数（左栏 = 码点数，右栏 = 字节数） */
	readonly count: number
	/** 按区间重建镜像 span；区间之外的原样文本照常显示。
	 *  传空数组表示输入无法分段（如奇数个 hex 位），只保留原文、无高亮 */
	setRanges (ranges: ReadonlyArray<readonly [number, number]>): void
	/** 屏幕横坐标落在哪个区间上；都不在内时为 null（hover 命中测试） */
	hitTest (clientX: number): number | null
	/** 原文偏移落在哪个区间内（键盘方向键后跟随光标） */
	indexAt (offset: number): number | null
	/** 只点亮给定下标的 span，其余熄灭 */
	lit (indices: ReadonlyArray<number>): void
	}

/** 把 input 包进镜像容器并返回镜像层。字体、内边距、边框须与 .inputbox 一致（见 style.css） */
export function createMirror (input: HTMLInputElement): Mirror {
	const wrap = document.createElement('span')
	wrap.className = 'mirror-wrap'
	input.replaceWith(wrap)
	wrap.append(input)
	const root = document.createElement('div')
	root.className = 'mirror'
	root.setAttribute('aria-hidden', 'true')
	wrap.append(root)
	// 输入框横向滚动时镜像同步平移，长文本下高亮才对得上字
	input.addEventListener('scroll', () => { root.scrollLeft = input.scrollLeft })

	let spans: HTMLSpanElement[] = []
	let ranges: ReadonlyArray<readonly [number, number]> = []

	const mirror: Mirror = {
		get count () { return spans.length },
		setRanges (next) {
			ranges = next
			root.textContent = ''
			spans = []
			const text = input.value
			let pos = 0
			for (const [start, end] of next) {
				if (start > pos) root.append(text.slice(pos, start))
				const span = document.createElement('span')
				span.textContent = text.slice(start, end)
				root.append(span)
				spans.push(span)
				pos = end
				}
			if (pos < text.length) root.append(text.slice(pos))
			},
		hitTest (clientX) {
			for (let i = 0; i < spans.length; i++) {
				const rect = spans[i].getBoundingClientRect()
				if (clientX >= rect.left && clientX < rect.right) return i
				}
			return null
			},
		indexAt (offset) {
			for (let i = 0; i < ranges.length; i++) {
				if (ranges[i][0] <= offset && offset < ranges[i][1]) return i
				}
			return null
			},
		lit (indices) {
			const lit = new Set(indices)
			for (let i = 0; i < spans.length; i++) spans[i].className = lit.has(i) ? 'lit' : ''
			}
		}
	return mirror
	}
