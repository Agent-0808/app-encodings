// UI 层：两栏输出行与勾选面板都按 registry 生成，这里不再逐个硬编码编码清单。
import { registry } from './encodings/registry.js'
import { renderEncode, renderDecode } from './conversion.ts'

/** 当前展示、参与计算的编码 id */
const live = new Set()
/** id → 该编码在页面上的 DOM 引用 */
const rows = new Map()

/** 一行输出：标签 + ↗/↖ 按钮 + <br> + 结果 span（结构同改造前） */
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
		})
	row.append(entry.label + ' ', button, document.createElement('br'), out)
	return { row, out }
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

/** 入口：由 main.ts 调用，此时 DOM 已就绪（module 脚本默认 defer） */
export function init () {
	buildColumns()
	buildSettings()
	}

function clearOutputs (side) {
	for (const r of rows.values()) r[side].out.textContent = ''
	}

export function encode ( stream ) {
	// clear out the previous results
	clearOutputs('enc')
	for (const id of live) {
		const { entry, enc } = rows.get(id)
		const segments = entry.encode(stream)
		enc.out.textContent = renderEncode(segments)
		// legacy 靠 textContent.match('&') 猜成功与否（bug 4），这里直接看 segment 的 kind
		const ok = enc.out.textContent != '' && segments.every(segment => segment.kind != 'unmappable')
		enc.row.className = ok ? 'output yes' : 'output'
		}
	}

export function decode ( stream ) {
	clearOutputs('dec')
	for (const id of live) {
		const { entry, dec } = rows.get(id)
		const units = entry.decode(stream)
		dec.out.textContent = renderDecode(units)
		const ok = dec.out.textContent != '' && units.every(unit => unit.kind != 'replacement')
		dec.row.className = ok ? 'output yes' : 'output'
		}
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
