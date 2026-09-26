// UI 层：两栏输出行与勾选面板都按 registry 生成，这里不再逐个硬编码编码清单。
// P4 起输出按 span 渲染并与输入框高亮联动（重构方案 §5.3）：悬停/键盘选中任一字符或字节，
// 对应关系在所有编码行间联动；输入即转换，不再依赖点 Convert。
import { registry } from './encodings/registry.js'
import { ensureData } from './conversion.ts'
import { isTableLoaded } from './data/load.ts'
import { parseHex } from './input/hex.ts'
import { createMirror } from './ui/highlight.ts'
import { cpSpans } from './lib/codepoints.js'
import { convertAllEscapes } from './conversionfunctions.js'

/** 当前展示、参与计算的编码 id */
const live = new Set()
/** id → 该编码在页面上的 DOM 引用 */
const rows = new Map()

/** 一行输出：标签 + 格式下拉框 + ↗/↖ 按钮 + <br> + 结果 span（结构同改造前） */
function buildRow (entry, side) {
	const row = document.createElement('p')
	row.className = 'output'
	row.id = entry.id + side
	const out = document.createElement('span')
	out.id = entry.id + side + 'Result'
	const button = document.createElement('button')
	button.textContent = side === 'enc' ? '↗' : '↖'
	// ↗ 把编码结果送进右栏的解码输入框，↖ 把解码结果送进左栏的编码输入框
	button.addEventListener('click', () => {
		document.getElementById(side === 'enc' ? 'lBytes' : 'uChar').value = out.textContent
		triggerConvert(side === 'enc' ? lBytes : uChar)
		})
	const nodes = [entry.label + ' ', button]
	// 有可切换格式的编码（目前只有 Unicode 序号行）在标签后多一个下拉框
	const select = entry.variants ? buildVariantSelect(entry, side) : null
	if (select) nodes.push(select)
	nodes.push(document.createElement('br'), out)
	row.append(...nodes)
	return { row, out, select, units: [] }
	}

/** 格式下拉框：改一个，另一栏的同名框跟着改，行内两个框不各说各话 */
function buildVariantSelect (entry, side) {
	const select = document.createElement('select')
	select.id = entry.id + side + 'Variant'
	for (const variant of entry.variants) {
		const option = document.createElement('option')
		option.value = variant.value
		option.textContent = variant.label
		select.append(option)
		}
	select.addEventListener('change', () => {
		// rows 里存的是同一份引用，事件触发时一定已填好
		const pair = rows.get(entry.id)
		for (const other of [pair.enc, pair.dec]) if (other.select) other.select.value = select.value
		// 格式变了输出跟着变：两栏都重跑当前输入
		if (uChar.value) triggerConvert(uChar)
		if (lBytes.value) triggerConvert(lBytes)
		})
	return select
	}

function setVisible (id, on) {
	const r = rows.get(id)
	r.enc.row.style.display = on ? '' : 'none'
	r.dec.row.style.display = on ? '' : 'none'
	if (r.box) r.box.checked = on
	if (on) live.add(id)
	else live.delete(id)
	}

function buildColumns () {
	const encColumn = document.getElementById('encodingcolumn')
	const decColumn = document.getElementById('decodingcolumn')
	for (const entry of registry) {
		const enc = buildRow(entry, 'enc')
		const dec = buildRow(entry, 'dec')
		encColumn.append(enc.row)
		decColumn.append(dec.row)
		rows.set(entry.id, { entry, enc, dec })
		setVisible(entry.id, entry.shown === true)
		}
	}

/** 勾选面板里的三个操作格，跟在第一列末尾 */
const settingsControls = [
	{ text: 'select all', onClick: () => { for (const entry of registry) setVisible(entry.id, true) } },
	{ text: 'clear all', onClick: () => { for (const entry of registry) if (entry.id !== 'utf8') setVisible(entry.id, false) } },
	{ text: 'X', onClick: () => { document.getElementById('customsettings').style.display = 'none' } }
	]

function buildSettings () {
	const columns = [
		[...registry.filter(entry => entry.group === 'common'), ...settingsControls],
		registry.filter(entry => entry.group === 'windows'),
		registry.filter(entry => entry.group === 'iso')
		]
	const body = document.getElementById('settings').querySelector('tbody')
	for (let i = 0; i < Math.max(...columns.map(column => column.length)); i++) {
		const tr = document.createElement('tr')
		for (const column of columns) tr.append(cell(column[i]))
		body.append(tr)
		}
	}

/** 一个格子：编码项是复选框，操作项是纯文本 */
function cell (item) {
	const td = document.createElement('td')
	if (!item) return td
	if (item.text) {
		td.textContent = item.text
		td.style.cursor = 'pointer'
		td.addEventListener('click', item.onClick)
		}
	else {
		const box = document.createElement('input')
		box.type = 'checkbox'
		box.id = item.id
		box.checked = item.shown === true
		box.addEventListener('click', () => setVisible(item.id, box.checked))
		rows.get(item.id).box = box
		td.append(box, ' ' + item.label)
		}
	return td
	}

// ---------------------------------------------------------------------------
// 高亮联动（P4，§5.3）
// ---------------------------------------------------------------------------

const uChar = document.getElementById('uChar')
const lBytes = document.getElementById('lBytes')
/** 左栏镜像：一个码点一个区间；右栏镜像：一个字节一个区间 */
const encMirror = createMirror(uChar)
const decMirror = createMirror(lBytes)
/** 当前点亮的所有元素，换目标或移开时统一熄灭 */
let litEls = new Set()

function lightEl (el) {
	el.classList.add('lit')
	litEls.add(el)
	}

function clearHighlight () {
	for (const el of litEls) el.classList.remove('lit')
	litEls = new Set()
	// 镜像层自己管理点亮（不走 litEls），也要一并熄灭
	encMirror.lit([])
	decMirror.lit([])
	}

/** 正向联动：悬停/选中输入的第 cp 个字符 → 所有已启用编码行里 cpIndex 相同的单元一起亮。
 *  跨编码同时联动是本功能的杀手锏：一次悬停看遍该字符在各编码下的字节占用。 */
function focusEncode (cp) {
	clearHighlight()
	encMirror.lit([cp])
	for (const id of live) {
		for (const unit of rows.get(id).enc.units) if (unit.cpIndex === cp) lightEl(unit.el)
		}
	}

/** 反向联动：字节区间 [a, b) → 右栏输入里对应的字节与各解码行里吃掉这些字节的字符 */
function focusDecode (a, b) {
	clearHighlight()
	const indices = []
	for (let i = a; i < b && i < decMirror.count; i++) indices.push(i)
	decMirror.lit(indices)
	for (const id of live) {
		const r = rows.get(id)
		// Unicode 序号行的 inputRange 是记号序号，与字节不在同一空间，不参与联动（§5.3）
		if (r.entry.decodeLinked === false) continue
		for (const unit of r.dec.units) if (unit.a < b && a < unit.b) lightEl(unit.el)
		}
	}

/** 编码结果的 span 化渲染：data 单元逐个 span，unmappable 整段一个 span。
 *  返回的 units 供联动反查：{ cpIndex, el }。cpIndex 为 null 的流尾 control 段不参与联动。 */
function renderEncodeSpans (segments) {
	const frag = document.createDocumentFragment()
	const units = []
	for (const seg of segments) {
		if (seg.kind === 'unmappable') {
			const el = document.createElement('span')
			el.textContent = seg.literal
			el.dataset.cp = seg.cpIndex
			frag.append(el)
			if (seg.cpIndex != null) units.push({ cpIndex: seg.cpIndex, el })
			continue
			}
		for (const unit of seg.units) {
			if (frag.childNodes.length > 0) frag.append(' ')
			const el = document.createElement('span')
			el.textContent = unit.render
			if (unit.control) el.title = '状态切换字节（ISO 2022 换档）'
			if (seg.cpIndex != null) el.dataset.cp = seg.cpIndex
			frag.append(el)
			if (seg.cpIndex != null) units.push({ cpIndex: seg.cpIndex, el })
			}
		}
	return { frag, units }
	}

/** 解码结果的 span 化渲染：一个 unit（可能吞多个字节）一个 span，data-a/b 供联动反查 */
function renderDecodeSpans (units) {
	const frag = document.createDocumentFragment()
	const spans = []
	for (const unit of units) {
		const el = document.createElement('span')
		el.textContent = unit.text
		el.dataset.a = unit.inputRange[0]
		el.dataset.b = unit.inputRange[1]
		frag.append(el)
		spans.push({ a: unit.inputRange[0], b: unit.inputRange[1], el })
		}
	return { frag, spans }
	}

/** 给输出容器挂 hover 联动；用事件委托，span 每次转换都重建，不必逐个挂监听 */
function wireOutputHover (out, onFocus) {
	out.addEventListener('mouseover', e => {
		const target = e.target.closest('[data-cp],[data-a]')
		if (target && target.dataset.cp !== undefined) focusEncode(Number(target.dataset.cp))
		else if (target) onFocus(Number(target.dataset.a), Number(target.dataset.b))
		else clearHighlight()
		})
	out.addEventListener('mouseleave', clearHighlight)
	}

/** 输入框上的联动：mousemove 命中镜像区间，方向键后高亮跟随光标，Esc 取消 */
function wireInputHighlight (input, mirror, onFocus) {
	input.addEventListener('mousemove', e => {
		const i = mirror.hitTest(e.clientX)
		if (i == null) clearHighlight()
		else onFocus(i)
		})
	input.addEventListener('mouseleave', clearHighlight)
	input.addEventListener('blur', clearHighlight)
	input.addEventListener('keyup', e => {
		if (e.key === 'Escape') { clearHighlight(); return }
		// 方向键/Home/End 移动光标后，高亮跟随光标所在的区间（键盘可达，§5.3）
		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
			const i = mirror.indexAt(input.selectionStart)
			if (i == null) clearHighlight()
			else onFocus(i)
			}
		})
	}

// ---------------------------------------------------------------------------
// 转换
// ---------------------------------------------------------------------------

/** 输入即转换：输入、勾选、格式切换都经由这里重跑当前栏 */
function triggerConvert (input) {
	if (input === uChar) {
		// 镜像按原文分区间；含 &#x…; 转义时 encoder 收到的是转换后的文本，
		// 两边下标可能对不上 —— 此时高亮仅供参考（普通文本 convertAllEscapes 是恒等变换）
		encMirror.setRanges(cpSpans(uChar.value))
		encode(convertAllEscapes(uChar.value))
		}
	else {
		let spans = []
		try { spans = parseHex(lBytes.value).spans } catch { /* 奇数位等：无区间可亮，错误提示由 decode 给出 */ }
		decMirror.setRanges(spans)
		decode(lBytes.value)
		}
	}

function clearOutputs (side) {
	for (const r of rows.values()) {
		r[side].out.textContent = ''
		r[side].units = []
		}
	}

/** 数据未就绪的行先显示 loading，等索引表按需加载完再统一渲染（P3）。
 *  已就绪的表 ensureData 直接返回，这个前置对常规转换没有可感开销。 */
async function withData (render) {
	for (const r of rows.values()) {
		if (live.has(r.entry.id) && r.entry.tables.some(name => !isTableLoaded(name))) {
			r.enc.out.textContent = 'loading…'
			r.dec.out.textContent = 'loading…'
			}
		}
	await Promise.all([...live].map(id => ensureData(rows.get(id).entry.tables)))
	render()
	}

/** 输入即转换会连续触发，过期的异步结果直接丢弃，避免旧输入覆盖新输出 */
let encRun = 0
let decRun = 0

export function encode ( stream ) {
	const mine = ++encRun
	void withData(() => {
	if (mine !== encRun) return
	// clear out the previous results
	clearOutputs('enc')
	for (const id of live) {
		const r = rows.get(id)
		const segments = r.entry.encode(stream, variantOf(r))
		const rendered = renderEncodeSpans(segments)
		r.enc.out.textContent = ''
		r.enc.out.append(rendered.frag)
		r.enc.units = rendered.units
		// legacy 靠 textContent.match('&') 猜成功与否（bug 4），这里直接看 segment 的 kind
		const ok = r.enc.out.textContent != '' && segments.every(segment => segment.kind != 'unmappable')
		r.enc.row.className = ok ? 'output yes' : 'output'
		}
	})
	}

export function decode ( stream ) {
	const mine = ++decRun
	void withData(() => {
	if (mine !== decRun) return
	clearOutputs('dec')
	// 文本 → 字节只在这里做一次，各字节型编码共用同一份结果。
	// 解析失败（例如奇数个十六进制位）时给一个空字节数组：那类行留空并在这里说明原因，
	// 而不按字节解读的行（Unicode 序号）输入本来就不必是 hex，仍照常解析。
	let bytes = []
	let reason = null
	try {
		bytes = parseHex(stream).bytes
		}
	catch (error) {
		reason = error.message
		}
	showDecodeError(reason)
	for (const id of live) {
		const r = rows.get(id)
		const units = r.entry.decode({ text: stream, bytes }, variantOf(r))
		const rendered = renderDecodeSpans(units)
		r.dec.out.textContent = ''
		r.dec.out.append(rendered.frag)
		r.dec.units = rendered.spans
		const ok = r.dec.out.textContent != '' && units.every(unit => unit.kind != 'replacement')
		r.dec.row.className = ok ? 'output yes' : 'output'
		}
	})
	}

/** 解析失败的提示只在解码栏出现一次，不跟着每一行重复；传 null 即清除 */
function showDecodeError (message) {
	const node = document.getElementById('decError')
	node.textContent = message || ''
	node.style.display = message ? 'block' : 'none'
	}


export function toggleCustomList () {
	var node = document.getElementById('customsettings')
	if (node.style.display == 'none') node.style.display = 'block'
	else node.style.display = 'none'
	}


export function toggleNotes () {
	var notes = document.getElementById('detailednotes')
	var showNotes = document.getElementById('showNotes')
	if (notes.style.display=='block') {
		notes.style.display='none'
		showNotes.querySelector('span').textContent='show notes'
		}
	else {
		notes.style.display='block'
		showNotes.querySelector('span').textContent='hide notes'
		}
	}

/** 该行当前的格式取值；没有下拉框的编码返回 undefined，由各 encoder/decoder 走默认值 */
function variantOf (r) {
	return r.enc.select ? r.enc.select.value : undefined
	}

/** 入口：由 main.ts 调用，此时 DOM 已就绪（module 脚本默认 defer） */
export function init () {
	buildColumns()
	buildSettings()
	// P4：内联事件处理器改写为正式绑定（index.html 不再有 onsubmit/onclick）
	document.getElementById('encodingcolumn').querySelector('form').addEventListener('submit', e => {
		e.preventDefault()
		triggerConvert(uChar)
		})
	document.getElementById('decodingcolumn').querySelector('form').addEventListener('submit', e => {
		e.preventDefault()
		triggerConvert(lBytes)
		})
	uChar.addEventListener('input', () => triggerConvert(uChar))
	lBytes.addEventListener('input', () => triggerConvert(lBytes))
	// 变更勾选时重跑当前输入，新行的结果与高亮立即可用
	document.getElementById('settings').addEventListener('change', () => {
		if (uChar.value) triggerConvert(uChar)
		if (lBytes.value) triggerConvert(lBytes)
		})
	wireInputHighlight(uChar, encMirror, cp => focusEncode(cp))
	wireInputHighlight(lBytes, decMirror, b => focusDecode(b, b + 1))
	for (const r of rows.values()) {
		wireOutputHover(r.enc.out, focusDecode)
		wireOutputHover(r.dec.out, focusDecode)
		}
	}
