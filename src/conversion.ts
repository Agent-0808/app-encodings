
import { getTable, loadTables } from './data/load.ts'
import { chars2cps, dec2char, getIndexPtr } from './lib/codepoints.js'
import type { DecodeUnit, EncodeSegment, OutputUnit } from './encodings/types.js'


// ---------------------------------------------------------------------------
// Segment 模型的读写助手
// ---------------------------------------------------------------------------

/** 一个十六进制字节单元。upper 对应 legacy 里各编码不同的 toString(16) 写法。
 *  补零到两位：否则字节 0x0E 会显示成 `e`，去掉空格粘贴回解码框会被并成 0xE4（方案 §8.3） */
function hex (value: number, upper = false): OutputUnit {
	return { value, render: (upper ? value.toString(16).toUpperCase() : value.toString(16)).padStart(2, '0') }
	}

/** 把 encoder 的 segment 拼回空格分隔的字符串视图 */
export function renderEncode (segments: EncodeSegment[]): string {
	var out = ''
	for (var i = 0; i < segments.length; i++) {
		var seg = segments[i]
		if (seg.kind === 'unmappable') out += ' ' + seg.literal
		else for (var u = 0; u < seg.units.length; u++) out += ' ' + seg.units[u].render
		}
	return out
	}

/** 把 decoder 的 unit 拼回字符，即解码结果的字符串视图 */
export function renderDecode (units: DecodeUnit[]): string {
	var out = ''
	for (var i = 0; i < units.length; i++) out += units[i].text
	return out
	}

// 解码侧不再自己解析输入串：文本 → 字节统一走 src/input/hex.ts，各 decoder 直接收字节数组。


// 索引数据（P3）：不再随模块加载，编码方向的反查表由 ensureData() 在数据就绪后惰性建立。
// encoder 经 cpMap() 取反查表 —— 数据未加载时明确报错，而不是悄悄输出全 unmappable；
// decoder 经 getTable() 取索引表，同样有就绪检查。

var big5CPs: (number | undefined)[] | null = null  // index is unicode cp, value is pointer
var jis0208CPs: (number | undefined)[] | null = null  // index is unicode cp, value is pointer
var sjisCPs: (number | undefined)[] | null = null  // index is unicode cp, value is pointer
var euckrCPs: (number | undefined)[] | null = null  // index is unicode cp, value is pointer
var gbCPs: (number | undefined)[] | null = null  // index is unicode cp, value is pointer
/** 已建立反查表的索引表名，防止重复建表 */
var builtMaps = new Set<string>()

function cpMap (map: (number | undefined)[] | null, name: string): (number | undefined)[] {
	if (map == null) throw new Error(name + ' 索引未加载，先 await ensureData')
	return map
	}

function buildBig5CPs () {
	var big5Index = getTable('big5')
	big5CPs = []
	for (var p=5024;p<big5Index.length;p++) { // "Let index be index jis0208 excluding all pointers in the range 8272 to 8835, inclusive."
		var big5cp = big5Index[p]
		if (big5cp != null && big5CPs[big5cp] == null) {
			big5CPs[big5cp] = p
			}
		}
	//  If code point is U+2550, U+255E, U+2561, U+256A, U+5341, or U+5345, return the last pointer corresponding to code point in index.
	big5CPs[0x2550] = 18991
	big5CPs[0x255E] = 18975
	big5CPs[0x2561] = 18977
	big5CPs[0x256A] = 18976
	big5CPs[0x5341] = 5512
	big5CPs[0x5345] = 5599
	}

function buildJis0208CPs () {
	var jis0208Index = getTable('jis0208')
	jis0208CPs = []
	for (var p=0;p<jis0208Index.length;p++) {
		var jis0208cp = jis0208Index[p]
		if (jis0208cp != null && jis0208CPs[jis0208cp] == null) {
			jis0208CPs[jis0208cp] = p
			}
		}
	}

function buildSjisCPs () {
	var jis0208Index = getTable('jis0208')
	sjisCPs = []
	for (var p=0;p<8272;p++) {
		var sjiscp = jis0208Index[p]
		if (sjiscp != null  && sjisCPs[sjiscp] == null) {
			sjisCPs[sjiscp] = p
			}
		}
	for (var p=8836;p<jis0208Index.length;p++) {
		var sjiscp2 = jis0208Index[p]
		if (sjiscp2 != null  && sjisCPs[sjiscp2] == null) {
			sjisCPs[sjiscp2] = p
			}
		}
	}

function buildEuckrCPs () {
	var euckrIndex = getTable('euckr')
	euckrCPs = []
	for (var p=0;p<euckrIndex.length;p++) {
		var euckrcp = euckrIndex[p]
		if (euckrcp != null && euckrCPs[euckrcp] == null) {
			euckrCPs[euckrcp] = p
			}
		}
	}

var gb18030Ranges: number[][] = [[0,128],[36,165],[38,169],[45,178],[50,184],[81,216],[89,226],[95,235],[96,238],[100,244],[103,248],[104,251],[105,253],[109,258],[126,276],[133,284],[148,300],[172,325],[175,329],[179,334],[208,364],[306,463],[307,465],[308,467],[309,469],[310,471],[311,473],[312,475],[313,477],[341,506],[428,594],[443,610],[544,712],[545,716],[558,730],[741,930],[742,938],[749,962],[750,970],[805,1026],[819,1104],[820,1106],[7922,8209],[7924,8215],[7925,8218],[7927,8222],[7934,8231],[7943,8241],[7944,8244],[7945,8246],[7950,8252],[8062,8365],[8148,8452],[8149,8454],[8152,8458],[8164,8471],[8174,8482],[8236,8556],[8240,8570],[8262,8596],[8264,8602],[8374,8713],[8380,8720],[8381,8722],[8384,8726],[8388,8731],[8390,8737],[8392,8740],[8393,8742],[8394,8748],[8396,8751],[8401,8760],[8406,8766],[8416,8777],[8419,8781],[8424,8787],[8437,8802],[8439,8808],[8445,8816],[8482,8854],[8485,8858],[8496,8870],[8521,8896],[8603,8979],[8936,9322],[8946,9372],[9046,9548],[9050,9588],[9063,9616],[9066,9622],[9076,9634],[9092,9652],[9100,9662],[9108,9672],[9111,9676],[9113,9680],[9131,9702],[9162,9735],[9164,9738],[9218,9793],[9219,9795],[11329,11906],[11331,11909],[11334,11913],[11336,11917],[11346,11928],[11361,11944],[11363,11947],[11366,11951],[11370,11956],[11372,11960],[11375,11964],[11389,11979],[11682,12284],[11686,12292],[11687,12312],[11692,12319],[11694,12330],[11714,12351],[11716,12436],[11723,12447],[11725,12535],[11730,12543],[11736,12586],[11982,12842],[11989,12850],[12102,12964],[12336,13200],[12348,13215],[12350,13218],[12384,13253],[12393,13263],[12395,13267],[12397,13270],[12510,13384],[12553,13428],[12851,13727],[12962,13839],[12973,13851],[13738,14617],[13823,14703],[13919,14801],[13933,14816],[14080,14964],[14298,15183],[14585,15471],[14698,15585],[15583,16471],[15847,16736],[16318,17208],[16434,17325],[16438,17330],[16481,17374],[16729,17623],[17102,17997],[17122,18018],[17315,18212],[17320,18218],[17402,18301],[17418,18318],[17859,18760],[17909,18811],[17911,18814],[17915,18820],[17916,18823],[17936,18844],[17939,18848],[17961,18872],[18664,19576],[18703,19620],[18814,19738],[18962,19887],[19043,40870],[33469,59244],[33470,59336],[33471,59367],[33484,59413],[33485,59417],[33490,59423],[33497,59431],[33501,59437],[33505,59443],[33513,59452],[33520,59460],[33536,59478],[33550,59493],[37845,63789],[37921,63866],[37948,63894],[38029,63976],[38038,63986],[38064,64016],[38065,64018],[38066,64021],[38069,64025],[38075,64034],[38076,64037],[38078,64042],[39108,65074],[39109,65093],[39113,65107],[39114,65112],[39115,65127],[39116,65132],[39265,65375],[39394,65510],[189000,65536],[2000000,2000000]]


function getRangePtr (cp: number): number {
	if (cp == 0xE7C7) return 7457
	var offset = 128
	var ptrOffset = 0
	for (var i=0;i<gb18030Ranges.length;i++) {
		if (gb18030Ranges[i][1] > cp) {
			offset = gb18030Ranges[i-1][1]
			ptrOffset = gb18030Ranges[i-1][0]
			break
			}
		}
	return ptrOffset + cp - offset
	}


function getRangeCP (ptr: number): number | null {
	if ((ptr > 39419 && ptr < 189000) || ptr > 1237575) return null
	var offset = 0
	var cpOffset = 0
	for (var i=0;i<gb18030Ranges.length;i++) {
		if (gb18030Ranges[i][0] > ptr) {
			offset = gb18030Ranges[i-1][0]
			cpOffset = gb18030Ranges[i-1][1]
			break
			}
		}
	return cpOffset + ptr - offset
	}

function buildGbCPs () {
	var gb18030Index = getTable('gb18030')
	gbCPs = []
	for (var p=0;p<gb18030Index.length;p++) {
		var gbcp = gb18030Index[p]
		if (gbcp != null && gbCPs[gbcp] == null) {
			gbCPs[gbcp] = p
			}
		}
	}

/** 确保列出的索引表已加载、相关反查表已建立；encode / decode 之前必须先 await。
 *  已就绪的表直接跳过，重复调用没有代价。jis0212 只服务解码方向，无需建表。 */
export async function ensureData (names: readonly string[]): Promise<void> {
	await loadTables(names)
	for (var name of names) {
		if (builtMaps.has(name)) continue
		if (name === 'big5') buildBig5CPs()
		else if (name === 'jis0208') { buildJis0208CPs(); buildSjisCPs() }
		else if (name === 'euckr') buildEuckrCPs()
		else if (name === 'gb18030') buildGbCPs()
		builtMaps.add(name)
		}
	}

// set up mappings for half/full width katakana
// index is a katakana index pointer, value is Unicode codepoint (dec)
// this is copy-pasted from the json version of the index belonging to the Encoding spec
var iso2022jpkatakana = [12290,12300,12301,12289,12539,12530,12449,12451,12453,12455,12457,12515,12517,12519,12483,12540,12450,12452,12454,12456,12458,12459,12461,12463,12465,12467,12469,12471,12473,12475,12477,12479,12481,12484,12486,12488,12490,12491,12492,12493,12494,12495,12498,12501,12504,12507,12510,12511,12512,12513,12514,12516,12518,12520,12521,12522,12523,12524,12525,12527,12531,12443,12444]


// 	END OF DATA INITIALISATION



export function big5Encoder (stream: string): EncodeSegment[] {
	var cps = chars2cps(stream)
	var segments: EncodeSegment[] = []
	var cpIndex = 0
	while (cps.length > 0) {
		var cp = cps.shift()
		if (cp >= 0x00 && cp <= 0x7F) {  // ASCII
			segments.push({ cpIndex: cpIndex++, units: [hex(cp)], kind: 'data' })
			continue
			}
		var ptr = cpMap(big5CPs, 'big5')[cp]
		if (ptr == null) {
			segments.push({ cpIndex: cpIndex++, units: [], kind: 'unmappable', literal: '&#'+cp+';' })
			continue
			}
		var lead = Math.floor(ptr/157) + 0x81
		var trail = ptr % 157
		var offset
		if (trail < 0x3F) offset = 0x40
		else { offset = 0x62 }
		var end = trail+offset
		segments.push({ cpIndex: cpIndex++, units: [hex(lead, true), hex(end, true)], kind: 'data' })
		}
	return segments
	}

export function big5Decoder (bytes: number[]): DecodeUnit[] {
	var units: DecodeUnit[] = []
	var big5Index = getTable('big5')
	var pos = 0
	var lead, byte, offset, ptr, cp
	var big5lead = 0x00
	var leadStart = 0
	while (pos < bytes.length) {
		var start = pos
		byte = bytes[pos++]
		if (big5lead != 0x00) {
			lead = big5lead
			ptr = null
			big5lead = 0x00
			if (byte < 0x7F) offset = 0x40
			else offset = 0x62

			if ((byte >= 0x40 && byte <= 0x7E) || (byte >= 0xA1 && byte <= 0xFE)) ptr = (lead - 0x81) * 157 + (byte - offset)
			// 原来这里有一段 "If there is a row in the table below..." 的 switch，拿字符串 '1133' 等去比对数字 ptr，
			// 永远不会命中（等价于没有这段）。若要按规范实现，应改成数字 1133 / 1135 / 1164 / 1166。
			if (ptr == null) cp = null
			else cp = big5Index[ptr]
			if (cp == null && byte >= 0x00 && byte < 0x7F) { pos--; continue }
			if (cp == null) {
				units.push({ inputRange: [leadStart, pos], text: '�', kind: 'replacement' })
				continue
				}
			units.push({ inputRange: [leadStart, pos], text: dec2char(cp), kind: 'data' })
			}
		else if (byte >= 0x00 && byte < 0x7F) units.push({ inputRange: [start, pos], text: dec2char(byte), kind: 'data' })
		else if (byte >= 0x81 && byte <= 0xFE) { big5lead = byte; leadStart = start }
		else units.push({ inputRange: [start, pos], text: '�', kind: 'replacement' })
		}
	if (big5lead != 0x00) units.push({ inputRange: [leadStart, pos], text: '�', kind: 'replacement' })
	return units
	}



export function utf8Encoder (stream: string): EncodeSegment[] {
	// stream: a string of unicode characters
	var cps = chars2cps(stream)
	var segments: EncodeSegment[] = []
	var cpIndex = 0
	var count, offset
	while (cps.length > 0) {
		var cp = cps.shift()
		if (cp >= 0x00 && cp <= 0x7F) {  // ASCII
			segments.push({ cpIndex: cpIndex++, units: [hex(cp)], kind: 'data' })
			continue
			}
		if (cp >= 0x80 && cp <= 0x7FF) { count = 1; offset = 0xC0; }
		else if (cp >= 0x800 && cp <= 0xFFFF) { count = 2; offset = 0xE0; }
		else { count = 3; offset = 0xF0; }
		var bytes: number[] = []
		bytes[0] = (cp >> (6 * count)) + offset
		while (count > 0) {
			var temp = cp >> (6 * (count-1))
			bytes.push(0x80|(temp & 0x3F))
			count--
			}
		segments.push({ cpIndex: cpIndex++, units: bytes.map(byte => hex(byte)), kind: 'data' })
		}
	return segments
	}


export function utf8Decoder (bytes: number[]): DecodeUnit[] {
	// bytes: 字节数组（文本 → 字节由 src/input/hex.ts 负责）
	var units: DecodeUnit[] = []
	var pos = 0
	var u8cp = 0
	var bytesseen = 0
	var bytesneeded = 0
	var lowerbound = 0x80
	var upperbound = 0xBF
	var seqStart = 0  // 当前多字节序列的首字节下标

	while (pos < bytes.length) {
		var start = pos
		var byte = bytes[pos++]
		if (bytesneeded == 0) {
			if (byte >= 0x00 && byte <= 0x7F) {
				units.push({ inputRange: [start, pos], text: dec2char(byte), kind: 'data' })
				continue
				}
			else if (byte >= 0xC2 && byte <= 0xDF) {
				bytesneeded = 1
				u8cp = byte - 0xC0
				}
			else if (byte >= 0xE0 && byte <= 0xEF) {
				if (byte == 0xE0) lowerbound = 0xA0
				if (byte == 0xED) upperbound = 0x9F
				bytesneeded = 2; u8cp = byte - 0xE0
				}
			else if (byte >= 0xF0 && byte <= 0xF4) {
				if (byte == 0xF0) lowerbound = 0x90
				if (byte == 0xF4) upperbound = 0x8F
				bytesneeded = 3; u8cp = byte - 0xF0
				}
			else {
				units.push({ inputRange: [start, pos], text: '�', kind: 'replacement' })
				continue
				}
			u8cp = u8cp << (6 * bytesneeded)
			seqStart = start
			continue
			}

		if (byte < lowerbound || byte > upperbound) {
			u8cp = 0
			bytesneeded = 0
			bytesseen = 0
			lowerbound = 0x80
			upperbound = 0xBF
			pos--
			units.push({ inputRange: [seqStart, pos], text: '�', kind: 'replacement' })
			continue
			}

		lowerbound = 0x80
		upperbound = 0xBF
		bytesseen++
		u8cp = u8cp + ((byte - 0x80) << (6 * (bytesneeded - bytesseen)))
		if (bytesseen != bytesneeded) continue

		var cp = u8cp
		u8cp = 0
		bytesneeded = 0
		bytesseen = 0
		units.push({ inputRange: [seqStart, pos], text: dec2char(cp), kind: 'data' })
		}
	if (bytesneeded != 0x00) units.push({ inputRange: [seqStart, pos], text: '�', kind: 'replacement' })
	return units
	}



export function eucjpEncoder (stream: string): EncodeSegment[] {
	var cps = chars2cps(stream)
	var segments: EncodeSegment[] = []
	var cpIndex = 0
	while (cps.length > 0) {
		var cp = cps.shift()
		if (cp >= 0x00 && cp <= 0x7F) {  // ASCII
			segments.push({ cpIndex: cpIndex++, units: [hex(cp)], kind: 'data' })
			continue
			}
		if (cp == 0xA5) { segments.push({ cpIndex: cpIndex++, units: [hex(0x5C, true)], kind: 'data' }); continue }
		if (cp == 0x203E) { segments.push({ cpIndex: cpIndex++, units: [hex(0x7E, true)], kind: 'data' }); continue }
		if (cp >= 0xFF61 && cp <= 0xFF9F) {
			var temp = cp - 0xFF61 + 0xA1
			segments.push({ cpIndex: cpIndex++, units: [hex(0x8E, true), hex(temp, true)], kind: 'data' })
			continue
			}
		if (cp == 0x2212) { cp = 0xFF0D }
		var ptr = cpMap(jis0208CPs, 'jis0208')[cp]
		if (ptr == null) {
			segments.push({ cpIndex: cpIndex++, units: [], kind: 'unmappable', literal: '&#'+cp+';' })
			continue
			}
		var lead = Math.floor(ptr/94) + 0xA1
		var trail = (ptr % 94) + 0xA1
		segments.push({ cpIndex: cpIndex++, units: [hex(lead, true), hex(trail, true)], kind: 'data' })
		}
	return segments
	}

export function eucjpDecoder (bytes: number[]): DecodeUnit[] {
	var units: DecodeUnit[] = []
	var jis0208Index = getTable('jis0208')
	var jis0212Index = getTable('jis0212')
	var pos = 0
	var lead, byte, ptr, cp
	var jis0212flag = false
	var eucjpLead = 0x00
	var leadStart = 0
	while (pos < bytes.length) {
		var start = pos
		byte = bytes[pos++]
		if (eucjpLead == 0x8E && byte >= 0xA1 && byte <= 0xDF) {
			var temp = 0xFF61 + byte - 0xA1
			// 注意：legacy 在这里没有清掉 eucjpLead，这里保持一致（否则行为会变）；
			// leadStart 往后挪到 pos，避免后续因残留状态产生的 � 与已归属的字节区间重叠
			units.push({ inputRange: [leadStart, pos], text: dec2char(temp), kind: 'data' })
			leadStart = pos
			continue
			}
		if (eucjpLead == 0x8F && byte >= 0xA1 && byte <= 0xFE) {
			jis0212flag = true
			eucjpLead = byte
			continue
			}
		if (eucjpLead != 0x00) {
			lead = eucjpLead
			eucjpLead = 0x00
			cp = null

			if ((lead >= 0xA1 && lead <= 0xFE) && (byte >= 0xA1 && byte <= 0xFE)) {
				ptr = (lead - 0xA1) * 94 + byte - 0xA1
				if (jis0212flag) cp = jis0212Index[ptr]
				else cp = jis0208Index[ptr]
				jis0212flag = false
				}
			if (byte < 0xA1 || byte > 0xFE) pos--
			if (cp == null) {
				units.push({ inputRange: [leadStart, pos], text: '�', kind: 'replacement' })
				continue
				}
			units.push({ inputRange: [leadStart, pos], text: dec2char(cp), kind: 'data' })
			}
		else if (byte >= 0x00 && byte < 0x7F) units.push({ inputRange: [start, pos], text: dec2char(byte), kind: 'data' })
		else if (byte == 0x8E || byte == 0x8F || (byte >= 0x81 && byte <= 0xFE)) { eucjpLead = byte; leadStart = start }
		else units.push({ inputRange: [start, pos], text: '�', kind: 'replacement' })
		}
	if (eucjpLead != 0x00) units.push({ inputRange: [leadStart, pos], text: '�', kind: 'replacement' })
	return units
	}


export function iso2022jpEncoder (stream: string): EncodeSegment[] {
	var cps = chars2cps(stream)
	var endofstream = 2000000
	cps.push(endofstream)
	var segments: EncodeSegment[] = []
	var cpIndex = 0
	var cpsPos = 0
	var encState = 'ascii'
	var finished = false
	// 换档字节不归属任何输入字符：先攒进 pendingControl，
	// 等下一个字符产出 segment 时并入它的 units（高亮时随该字符一起亮）
	var pendingControl: OutputUnit[] = []

	// 一个换档序列（ESC + 两字节），三个字节都标 control
	function shiftBytes (second: number, third: number): OutputUnit[] {
		return [
			{ value: 0x1B, render: '1B', control: true },
			{ value: second, render: second.toString(16).toUpperCase(), control: true },
			{ value: third, render: third.toString(16).toUpperCase(), control: true }
			]
		}

	function emitCharacter (units: OutputUnit[], kind: 'data' | 'unmappable', literal?: string): void {
		var merged = pendingControl
		pendingControl = []
		for (var i = 0; i < units.length; i++) merged.push(units[i])
		segments.push({ cpIndex: cpIndex++, units: merged, kind: kind, literal: literal })
		}

	while (!finished) {
		var cp = cps[cpsPos++]
		if (cp == endofstream && encState != 'ascii') {
			cpsPos--
			encState = 'ascii'
			pendingControl.push(...shiftBytes(0x28, 0x42))
			continue
			}
		if (cp == endofstream && encState == 'ascii') {
			finished = true
			break
			}
		if ((encState === 'ascii'|| encState === 'roman') && (cp === 0x0E || cp === 0x0F || cp === 0x1B)) {
			emitCharacter([], 'unmappable', '&#'+cp+';')
			continue
			}
		if (encState == 'ascii' && cp >= 0x00 && cp <= 0x7F) {
			emitCharacter([hex(cp, true)], 'data')
			continue
			}
		if (encState == 'roman' && ((cp >= 0x00 && cp <= 0x7F && cp !== 0x5C && cp !== 0x7E) || cp == 0xA5 || cp == 0x203E)) {
			if (cp >= 0x00 && cp <= 0x7F) {  // ASCII
				emitCharacter([hex(cp, true)], 'data')
				continue
				}
			if (cp == 0xA5) { emitCharacter([hex(0x5C, true)], 'data'); continue }
			if (cp == 0x203E) { emitCharacter([hex(0x7E, true)], 'data'); continue }
			}
		if (encState != 'ascii' && cp >= 0x00 && cp <= 0x7F) {
			cpsPos--
			encState = 'ascii'
			pendingControl.push(...shiftBytes(0x28, 0x42))
			continue
			}
		if ((cp == 0xA5 || cp == 0x203E) && encState != 'roman') {
			cpsPos--
			encState = 'roman'
			pendingControl.push(...shiftBytes(0x28, 0x4A))
			continue
			}
		if (cp == 0x2212) cp = 0xFF0D
		if (cp >= 0xFF61 && cp <= 0xFF9F) {
			cp = iso2022jpkatakana[cp-0xFF61]
			}
		var ptr = cpMap(jis0208CPs, 'jis0208')[cp]
		if (ptr == null) {
			emitCharacter([], 'unmappable', '&#'+cp+';')
			continue
			}
		if (encState != 'jis0208') {
			cpsPos--
			encState = 'jis0208'
			pendingControl.push(...shiftBytes(0x24, 0x42))
			continue
			}
		var lead = Math.floor(ptr/94) + 0x21
		var trail = (ptr % 94) + 0x21
		emitCharacter([hex(lead, true), hex(trail, true)], 'data')
		}
	// 流末尾残留的换档字节（例如切回 ASCII 的 1B 28 42）挂到流尾
	if (pendingControl.length > 0) segments.push({ cpIndex: null, units: pendingControl, kind: 'control' })
	return segments
	}

export function iso2022jpDecoder (bytes: number[]): DecodeUnit[] {
	var endofstream = 2000000
	//bytes.push(endofstream)
	var units: DecodeUnit[] = []
	var jis0208Index = getTable('jis0208')
	var pos = 0
	var decState = 'ascii'
	var outState = 'ascii'
	var isoLead = 0x00
	var leadStart = 0
	var escStart = 0
	var outFlag = false
	var cp: number | null, ptr: number
	var lead: number, state: string | null

	var finished = false
	while (!finished) {
		var start = pos
		var byte = pos < bytes.length ? bytes[pos++] : endofstream

		switch (decState) {
			case 'ascii':  if (byte == 0x1B) { escStart = start; decState = 'escStart'; continue }
							else if (byte >= 0x00 && byte <= 0x7F && byte !== 0x0E && byte !== 0x0F && byte !== 0x1B) {
								outFlag = false;
								units.push({ inputRange: [start, pos], text: dec2char(byte), kind: 'data' })
								continue
								}
							else if ( byte == endofstream) { finished = true; continue }
							else { outFlag = false; units.push({ inputRange: [start, pos], text: '�', kind: 'replacement' }); continue }
							break
			case 'roman':	if (byte == 0x1B) { escStart = start; decState = 'escStart'; continue }
							else if (byte == 0x5C) {
								outFlag = false;
								units.push({ inputRange: [start, pos], text: dec2char(0xA5), kind: 'data' })
								continue
								}
							else if (byte == 0x7E) {
								outFlag = false;
								units.push({ inputRange: [start, pos], text: dec2char(0x203E), kind: 'data' })
								continue
								}
							else if (byte >= 0x00 && byte <= 0x7F && byte !== 0x0E && byte !== 0x0F && byte !== 0x1B && byte !== 0x5C && byte !== 0x7E) {
								outFlag = false;
								units.push({ inputRange: [start, pos], text: dec2char(byte), kind: 'data' })
								continue
								}
							else if ( byte == endofstream) { finished = true; continue }
							else { outFlag = false; units.push({ inputRange: [start, pos], text: '�', kind: 'replacement' }); continue }
							break
			case 'katakana': if (byte == 0x1B) { escStart = start; decState = 'escStart'; continue }
							else if (byte >= 0x21 && byte <= 0x5F) {
								outFlag = false;
								units.push({ inputRange: [start, pos], text: dec2char(0xFF61+byte-0x21), kind: 'data' })
								continue
								}
							else if ( byte == endofstream) { finished = true; continue }
							else { outFlag = false; units.push({ inputRange: [start, pos], text: '�', kind: 'replacement' }); continue }
							break
			case 'leadbyte': if (byte == 0x1B) { escStart = start; decState = 'escStart'; continue }
							else if (byte >= 0x21 && byte <= 0x7E) {
								outFlag = false
								isoLead = byte
								leadStart = start
								decState = 'trailbyte'
								continue
								}
							else if ( byte == endofstream) { finished = true; continue }
							else { outFlag = false; units.push({ inputRange: [start, pos], text: '�', kind: 'replacement' }); continue }
							break
			case 'trailbyte': if (byte == 0x1B) {
								// 待归属的前导字节作废；0x1B 本身留给下一轮当转义序列的开头
								escStart = start
								decState = 'escStart'
								units.push({ inputRange: [leadStart, leadStart + 1], text: '�', kind: 'replacement' })
								continue
								}
							else if (byte >= 0x21 && byte <= 0x7E) {
								decState = 'leadbyte'
								ptr = (isoLead - 0x21) * 94 + byte - 0x21
								cp = jis0208Index[ptr]
								if (cp == null) {
									units.push({ inputRange: [leadStart, pos], text: '�', kind: 'replacement' })
									continue
									}
								units.push({ inputRange: [leadStart, pos], text: dec2char(cp), kind: 'data' })
								continue
								}
							else if ( byte == endofstream) {
								// legacy 这里把 endofstream 塞回数组再读一次，效果就是收尾
								decState = 'leadbyte'
								units.push({ inputRange: [leadStart, pos], text: '�', kind: 'replacement' })
								finished = true
								continue
								}
							else { decState = 'leadbyte'; units.push({ inputRange: [leadStart, pos], text: '�', kind: 'replacement' }); continue }
							break
			case 'escStart':
							if (byte == 0x24 || byte == 0x28) {
								isoLead = byte
								decState = 'escape'
								continue
								}
							if (byte == endofstream) {
								// 流在 ESC 之后就结束了；legacy 会把 endofstream 塞回数组再读一次，这里直接收尾
								outFlag = false
								units.push({ inputRange: [escStart, escStart + 1], text: '�', kind: 'replacement' })
								finished = true
								continue
								}
							// 不是合法转义序列：ESC 记作 �，当前字节退回按原状态重新处理
							pos--
							outFlag = false
							decState = outState
							units.push({ inputRange: [escStart, escStart + 1], text: '�', kind: 'replacement' })
							continue
			case 'escape': 	lead = isoLead
							isoLead = 0x00
							state = null
							if (lead == 0x28 && byte == 0x42) state = 'ascii'
							if (lead == 0x28 && byte == 0x4A) state = 'roman'
							if (lead == 0x28 && byte == 0x49) state = 'katakana'
							if (lead == 0x24 && (byte == 0x40 || byte == 0x42)) state = 'leadbyte'
							if (state != null) {
								decState = state
								outState = state
								var outputflag = outFlag
								outFlag = true
								// 前一个转义序列尚未产出任何字符又来了一个，记一个 �
								if (outputflag == false) continue
								else { units.push({ inputRange: [escStart, pos], text: '�', kind: 'replacement' }); continue }
								}
							if (byte == endofstream) {
								// legacy 在这里把 endofstream 塞回数组，遇到「ESC + $/( 后输入就结束」会死循环；
								// 语义上这就是一个非法转义序列，记 � 并收尾
								outFlag = false
								units.push({ inputRange: [escStart, escStart + 1], text: '�', kind: 'replacement' })
								finished = true
								continue
								}
							// 非法转义序列：ESC 记作 �，lead 与 byte 按 legacy 的顺序（先 byte 后 lead）退回重读
							pos -= 2
							bytes[pos] = byte
							bytes[pos + 1] = lead
							outFlag = false
							decState = outState
							units.push({ inputRange: [escStart, escStart + 1], text: '�', kind: 'replacement' })
							continue
			}
		}
	return units
	}




export function sjisEncoder (stream: string): EncodeSegment[] {
	var cps = chars2cps(stream)
	var segments: EncodeSegment[] = []
	var cpIndex = 0
	while (cps.length > 0) {
		var cp = cps.shift()
		if ((cp >= 0x00 && cp <= 0x7F) || cp == 0x80) {
			segments.push({ cpIndex: cpIndex++, units: [hex(cp)], kind: 'data' })
			continue
			}
		if (cp == 0xA5) { segments.push({ cpIndex: cpIndex++, units: [hex(0x5C, true)], kind: 'data' }); continue }
		if (cp == 0x203E) { segments.push({ cpIndex: cpIndex++, units: [hex(0x7E, true)], kind: 'data' }); continue }
		if (cp >= 0xFF61 && cp <= 0xFF9F) {
			var temp = cp - 0xFF61 + 0xA1
			// legacy 这里漏了前导空格（结果会与后一个字节粘在一起），改成正常的单个字节单元
			segments.push({ cpIndex: cpIndex++, units: [hex(temp)], kind: 'data' })
			continue
			}
		if (cp == 0x2212) { cp = 0xFF0D }
		var ptr = cpMap(sjisCPs, 'jis0208')[cp]
		if (ptr == null) {
			segments.push({ cpIndex: cpIndex++, units: [], kind: 'unmappable', literal: '&#'+cp+';' })
			continue
			}
		var lead = Math.floor(ptr/188)
		var leadoffset
		if (lead < 0x1F) leadoffset = 0x81
		else leadoffset = 0xC1
		var trail = (ptr % 188)
		var first = lead + leadoffset
		var offset
		if (trail < 0x3F) offset = 0x40
		else offset = 0x41
		var second = trail + offset
		segments.push({ cpIndex: cpIndex++, units: [hex(first, true), hex(second, true)], kind: 'data' })
		}
	return segments
	}

export function sjisDecoder (bytes: number[]): DecodeUnit[] {
	var units: DecodeUnit[] = []
	var jis0208Index = getTable('jis0208')
	var pos = 0
	var lead, byte, leadoffset, offset, ptr, cp
	var sjisLead = 0x00
	var leadStart = 0

	while (pos < bytes.length) {
		var start = pos
		byte = bytes[pos++]
		if (sjisLead != 0x00) {
			lead = sjisLead
			ptr = null
			sjisLead = 0x00
			if (byte < 0x7F) offset = 0x40
			else offset = 0x41
			if (lead < 0xA0) leadoffset = 0x81
			else leadoffset = 0xC1
			if ((byte >= 0x40 && byte <= 0x7E) || (byte >= 0x80 && byte <= 0xFC)) ptr = (lead - leadoffset) * 188 + byte - offset
			if (ptr == null) cp = null
			else cp = jis0208Index[ptr]
			if (cp == null && ptr != null && ptr >= 8836 && ptr <= 10715) {
				var temp = 0xE000 + ptr - 8836
				units.push({ inputRange: [leadStart, pos], text: dec2char(temp), kind: 'data' })
				continue
				}
			if (cp == null && byte >= 0x00 && byte <= 0x7F) {
				pos--
				}
			if (cp == null) {
				units.push({ inputRange: [leadStart, pos], text: '�', kind: 'replacement' })
				continue
				}
			units.push({ inputRange: [leadStart, pos], text: dec2char(cp), kind: 'data' })
			continue
			}
		if ((byte >= 0x00 && byte <= 0x7F) || byte == 0x80) {
			units.push({ inputRange: [start, pos], text: dec2char(byte), kind: 'data' })
			continue
			}
		if (byte >= 0xA1 && byte <= 0xDF) {
			var temp = 0xFF61 + byte - 0xA1
			units.push({ inputRange: [start, pos], text: dec2char(temp), kind: 'data' })
			continue
			}
		if ((byte >= 0x81 && byte <= 0x9F) || (byte >= 0xE0 && byte <= 0xFC)) {
			sjisLead = byte
			leadStart = start
			continue
			}
		units.push({ inputRange: [start, pos], text: '�', kind: 'replacement' })
		}
	if (sjisLead != 0x00) units.push({ inputRange: [leadStart, pos], text: '�', kind: 'replacement' })
	return units
	}




export function euckrEncoder (stream: string): EncodeSegment[] {
	var cps = chars2cps(stream)
	var segments: EncodeSegment[] = []
	var cpIndex = 0
	while (cps.length > 0) {
		var cp = cps.shift()
		if (cp >= 0x00 && cp <= 0x7F) {  // ASCII
			segments.push({ cpIndex: cpIndex++, units: [hex(cp)], kind: 'data' })
			continue
			}
		var ptr = cpMap(euckrCPs, 'euckr')[cp]
		if (ptr == null) {
			segments.push({ cpIndex: cpIndex++, units: [], kind: 'unmappable', literal: '&#'+cp+';' })
			continue
			}
		var lead = Math.floor(ptr/190) + 0x81
		var trail = (ptr % 190) + 0x41
		segments.push({ cpIndex: cpIndex++, units: [hex(lead, true), hex(trail, true)], kind: 'data' })
		}
	return segments
	}

export function euckrDecoder (bytes: number[]): DecodeUnit[] {
	var units: DecodeUnit[] = []
	var euckrIndex = getTable('euckr')
	var pos = 0
	var lead, byte, ptr, cp
	var euckrLead = 0x00
	var leadStart = 0

	while (pos < bytes.length) {
		var start = pos
		byte = bytes[pos++]
		if (euckrLead != 0x00) {
			lead = euckrLead
			ptr = null
			euckrLead = 0x00
			if (byte >= 0x41 || byte <= 0xFE) ptr = (lead - 0x81) * 190 + (byte - 0x41)
			if (ptr == null) cp = null
			else cp = euckrIndex[ptr]
			if (cp == null && byte >= 0x00 && byte <= 0x7F) pos--
			if (cp == null) {
				units.push({ inputRange: [leadStart, pos], text: '�', kind: 'replacement' })
				continue
				}
			units.push({ inputRange: [leadStart, pos], text: dec2char(cp), kind: 'data' })
			continue
			}
		if (byte >= 0x00 && byte <= 0x7F) {
			units.push({ inputRange: [start, pos], text: dec2char(byte), kind: 'data' })
			continue
			}
		else if (byte >= 0x81 && byte <= 0xFE) {
			euckrLead = byte
			leadStart = start
			continue
			}
		units.push({ inputRange: [start, pos], text: '�', kind: 'replacement' })
		}
	if (euckrLead != 0x00) units.push({ inputRange: [leadStart, pos], text: '�', kind: 'replacement' })
	return units
	}





export function gbEncoder (stream: string, gbk: boolean): EncodeSegment[] {
	var cps = chars2cps(stream)
	var segments: EncodeSegment[] = []
	var cpIndex = 0
	var lead, trail, offset, end

	while (cps.length > 0) {
		var cp = cps.shift()
		if (cp >= 0x00 && cp <= 0x7F) {  // ASCII
			segments.push({ cpIndex: cpIndex++, units: [hex(cp, true)], kind: 'data' })
			continue
			}
		if (cp == 0xE5E5) {
			segments.push({ cpIndex: cpIndex++, units: [], kind: 'unmappable', literal: '&#'+cp+';' })
			continue
			}
		if (gbk && cp == 0x20AC) {
			segments.push({ cpIndex: cpIndex++, units: [hex(0x80, true)], kind: 'data' })
			continue
			}
		var ptr = cpMap(gbCPs, 'gb18030')[cp]
		if (ptr != null) {
			lead = Math.floor(ptr/190) + 0x81
			trail = (ptr % 190)
			if (trail < 0x3F) offset = 0x40
			else offset = 0x41
			end = trail + offset
			segments.push({ cpIndex: cpIndex++, units: [hex(lead, true), hex(end, true)], kind: 'data' })
			continue
			}
		if (gbk) {
			segments.push({ cpIndex: cpIndex++, units: [], kind: 'unmappable', literal: '&#'+cp+';' })
			continue
			}
		var rangePtr = getRangePtr(cp)
		var byte1 = Math.floor(rangePtr / 10 /126 /10)
		rangePtr = rangePtr - byte1 * 10 * 126 * 10
		var byte2 = Math.floor(rangePtr / 10 /126)
		rangePtr = rangePtr - byte2 * 10 * 126
		var byte3 = Math.floor(rangePtr / 10)
		var byte4 = rangePtr - byte3 * 10
		byte1 += 0x81
		byte2 += 0x30
		byte3 += 0x81
		byte4 += 0x30
		segments.push({ cpIndex: cpIndex++, units: [hex(byte1, true), hex(byte2, true), hex(byte3, true), hex(byte4, true)], kind: 'data' })
		}
	return segments
	}

export function gbDecoder (bytes: number[]): DecodeUnit[] {
	var units: DecodeUnit[] = []
	var gb18030Index = getTable('gb18030')
	var pos = 0
	var lead, byte, offset, ptr, cp
	var first = 0x00
	var second = 0x00
	var third = 0x00
	var firstStart = 0  // 当前 4 字节序列的首字节下标
	var endofstream = 2000000
	//bytes.push(endofstream)
	var finished = false

	while (!finished) {
		var start = pos
		byte = pos < bytes.length ? bytes[pos++] : endofstream
		if (byte == endofstream && first == 0x00 && second == 0x00 && third == 0x00) {
			finished = true
			break
			}
		if (byte == endofstream && (first != 0x00 || second != 0x00 || third != 0x00)) {
			first = 0x00
			second = 0x00
			third = 0x00
			units.push({ inputRange: [firstStart, pos], text: '�', kind: 'replacement' })
			continue
			}
		if (third != 0x00) {
			cp = null
			if (byte >= 0x30 && byte <= 0x39) {
				cp = getRangeCP((((first - 0x81) * 10 + second - 0x30) * 126 + third - 0x81) *10 + byte - 0x30)
				}
			first = 0x00
			second = 0x00
			third = 0x00
			if (cp == null) {
				// 退回 second / third / byte 重新处理（legacy 的三次 unshift）
				pos -= 3
				units.push({ inputRange: [firstStart, pos], text: '�', kind: 'replacement' })
				continue
				}
			units.push({ inputRange: [firstStart, pos], text: dec2char(cp), kind: 'data' })
			continue
			}
		if (second != 0x00) {
			if (byte >= 0x81 && byte <= 0xFE) {
				third = byte
				continue
				}
			// 退回 second / byte 重新处理（legacy 的两次 unshift）
			pos -= 2
			first = 0x00
			second = 0x00
			units.push({ inputRange: [firstStart, pos], text: '�', kind: 'replacement' })
			continue
			}
		if (first != 0x00) {
			if (byte >= 0x30 && byte <= 0x39) {
				second = byte
				continue
				}
			lead = first
			ptr = null
			first = 0x00
			if (byte < 0x7F) offset = 0x40
			else offset = 0x41
			if ((byte >= 0x40 && byte <= 0x7E) || (byte >= 0x80 && byte <= 0xFE)) ptr = (lead - 0x81) * 190 + (byte - offset)
			if (ptr == null) cp = null
			else cp = gb18030Index[ptr]
			if (cp == null && byte >= 0x00 && byte <= 0x7F) pos--
			if (cp == null) {
				units.push({ inputRange: [firstStart, pos], text: '�', kind: 'replacement' })
				continue
				}
			units.push({ inputRange: [firstStart, pos], text: dec2char(cp), kind: 'data' })
			continue
			}
		if (byte >= 0x00 && byte <= 0x7F) {
			units.push({ inputRange: [start, pos], text: dec2char(byte), kind: 'data' })
			continue
			}
		if (byte == 0x80) {
			units.push({ inputRange: [start, pos], text: dec2char(0x20AC), kind: 'data' })
			continue
			}
		if (byte >= 0x81 && byte <= 0xFE) {
			first = byte
			firstStart = start
			continue
			}
		units.push({ inputRange: [start, pos], text: '�', kind: 'replacement' })
		}
	return units
	}



export function sbEncoder (stream: string, index: (number | null)[]): EncodeSegment[] {
	var cps = chars2cps(stream)
	var segments: EncodeSegment[] = []
	var cpIndex = 0

	while (cps.length > 0) {
		var cp = cps.shift()

		if (cp >= 0x00 && cp <= 0x7F) {
			segments.push({ cpIndex: cpIndex++, units: [hex(cp, true)], kind: 'data' })
			continue
			}
		var ptr = getIndexPtr(cp, index)
		if (ptr == null) {
			segments.push({ cpIndex: cpIndex++, units: [], kind: 'unmappable', literal: '&#'+cp+';' })
			continue
			}
		cp = ptr + 0x80
		segments.push({ cpIndex: cpIndex++, units: [hex(cp, true)], kind: 'data' })
		}
	return segments
	}

export function sbDecoder (bytes: number[], index: (number | null)[]): DecodeUnit[] {
	var units: DecodeUnit[] = []
	var pos = 0

	while (pos < bytes.length) {
		var start = pos
		var byte = bytes[pos++]

		if (byte >= 0x00 && byte <= 0x7F) {
			units.push({ inputRange: [start, pos], text: dec2char(byte), kind: 'data' })
			continue
			}
		var cp = index[byte - 0x80]
		if (cp == null) {
			units.push({ inputRange: [start, pos], text: '�', kind: 'replacement' })
			continue
			}
		units.push({ inputRange: [start, pos], text: dec2char(cp), kind: 'data' })
		}
	return units
	}
