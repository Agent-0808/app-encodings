// 编码注册表：编码清单的唯一真相来源，两栏输出行与勾选面板都由它生成。
// 新增一个编码只需要在这里加一项 —— 不必再同步修改 live 对象、encode()、decode()、
// customsettings 复选框、两列输出行、showEncoding 的 switch（对应重构方案 §5.1）。
import { indexes } from '../data/indexes.js'
import {
	big5Encoder, big5Decoder,
	eucjpEncoder, eucjpDecoder,
	iso2022jpEncoder, iso2022jpDecoder,
	sjisEncoder, sjisDecoder,
	euckrEncoder, euckrDecoder,
	gbEncoder, gbDecoder,
	sbEncoder, sbDecoder,
	utf8Encoder, utf8Decoder
	} from '../conversion.ts'
import type { DecodeInput, DecodeUnit, EncodeSegment } from './types.js'
import { unicodeEncoder, unicodeDecoder, unicodeVariants } from './unicode.js'

/** 勾选面板里的分组：三列各放一组，与改造前的版面一致 */
export type RegistryGroup = 'common' | 'windows' | 'iso'

/** 一种可切换的展示格式：目前只有 Unicode 序号这行用得上（§5.6） */
export interface EncodingVariant {
	/** 下拉框里的选项文本，如 'U+4F60' */
	label: string
	/** 传给 encode / decode 的取值 */
	value: string
	}

/** 一个编码在 UI 上需要的全部信息 */
export interface EncodingEntry {
	/** 标识符：同时用作 DOM id 前缀与「是否展示」的键 */
	id: string
	/** 显示名 */
	label: string
	/** 勾选面板里的分组 */
	group: RegistryGroup
	/** 初始是否展示（默认只留常用编码） */
	shown?: boolean
	/** 声明了就在行内出现格式下拉框，两栏的框联动 */
	variants?: EncodingVariant[]
	encode: (stream: string, variant?: string) => EncodeSegment[]
	/** 解码侧统一收 DecodeInput：字节型编码用 bytes，Unicode 序号行用 text */
	decode: (input: DecodeInput, variant?: string) => DecodeUnit[]
	}

/** indexes.js 仍是 JS 模块，元素类型是宽松的联合；这里收敛成本模块实际用到的形态 */
type SingleByteTable = (number | null)[] | number[][]

/** 24 个单字节编码共用同一组编解码器，区别只在索引表 */
function singleByte (id: string, label: string, table: SingleByteTable, group: RegistryGroup, shown = false): EncodingEntry {
	const index = table as (number | null)[]
	return { id, label, group, shown, encode: stream => sbEncoder(stream, index), decode: input => sbDecoder(input.bytes, index) }
	}

export const registry: EncodingEntry[] = [
	{ id: 'utf8', label: 'utf-8', group: 'common', shown: true, encode: utf8Encoder, decode: input => utf8Decoder(input.bytes) },
	// Unicode 序号是「伪编码」：不产生字节，只把码位按所选格式写出来（5.6）
	{ id: 'unicode', label: 'Unicode', group: 'common', shown: true, variants: unicodeVariants, encode: unicodeEncoder, decode: (input, variant) => unicodeDecoder(input.text, variant) },
	{ id: 'big5', label: 'big5', group: 'common', shown: true, encode: big5Encoder, decode: input => big5Decoder(input.bytes) },
	{ id: 'eucjp', label: 'euc-jp', group: 'common', shown: true, encode: eucjpEncoder, decode: input => eucjpDecoder(input.bytes) },
	{ id: 'iso2022jp', label: 'iso-2022-jp', group: 'common', shown: true, encode: iso2022jpEncoder, decode: input => iso2022jpDecoder(input.bytes) },
	{ id: 'shiftjis', label: 'shift_jis', group: 'common', shown: true, encode: sjisEncoder, decode: input => sjisDecoder(input.bytes) },
	{ id: 'euckr', label: 'euc-kr', group: 'common', shown: true, encode: euckrEncoder, decode: input => euckrDecoder(input.bytes) },
	// gb18030 与 gbk 只差一个开关，解码方向完全共用（与 legacy 一致）
	{ id: 'gb18030', label: 'gb18030', group: 'common', shown: true, encode: stream => gbEncoder(stream, false), decode: input => gbDecoder(input.bytes) },
	{ id: 'gbk', label: 'gbk', group: 'common', shown: true, encode: stream => gbEncoder(stream, true), decode: input => gbDecoder(input.bytes) },
	singleByte('koi8r', 'koi8-r', indexes.koi8r, 'common'),
	singleByte('koi8u', 'koi8-u', indexes.koi8u, 'common'),

	singleByte('windows1250', 'windows-1250', indexes.windows1250, 'windows'),
	singleByte('windows1251', 'windows-1251', indexes.windows1251, 'windows'),
	singleByte('windows1252', 'windows-1252/latin1', indexes.windows1252, 'windows', true),
	singleByte('windows1253', 'windows-1253', indexes.windows1253, 'windows'),
	singleByte('windows1254', 'windows-1254', indexes.windows1254, 'windows'),
	singleByte('windows1255', 'windows-1255', indexes.windows1255, 'windows'),
	singleByte('windows1256', 'windows-1256', indexes.windows1256, 'windows'),
	singleByte('windows1257', 'windows-1257', indexes.windows1257, 'windows'),
	singleByte('windows1258', 'windows-1258', indexes.windows1258, 'windows'),
	singleByte('windows874', 'windows-874', indexes.windows874, 'windows'),
	singleByte('macintosh', 'macintosh', indexes.macintosh, 'windows'),
	singleByte('ibm866', 'ibm866', indexes.ibm866, 'windows'),
	singleByte('xmaccyrillic', 'x-mac-cyrillic', indexes.xmaccyrillic, 'windows'),

	singleByte('iso88592', 'iso-8859-2', indexes.iso88592, 'iso'),
	singleByte('iso88593', 'iso-8859-3', indexes.iso88593, 'iso'),
	singleByte('iso88594', 'iso-8859-4', indexes.iso88594, 'iso'),
	singleByte('iso88595', 'iso-8859-5', indexes.iso88595, 'iso'),
	singleByte('iso88596', 'iso-8859-6', indexes.iso88596, 'iso'),
	singleByte('iso88597', 'iso-8859-7', indexes.iso88597, 'iso'),
	singleByte('iso88598', 'iso-8859-8', indexes.iso88598, 'iso'),
	// iso-8859-8-i 与 iso-8859-8 只有书写方向不同，共用同一张索引表（indexes 里没有 iso88598i）
	singleByte('iso88598i', 'iso-8859-8-i', indexes.iso88598, 'iso'),
	singleByte('iso885910', 'iso-8859-10', indexes.iso885910, 'iso'),
	singleByte('iso885913', 'iso-8859-13', indexes.iso885913, 'iso'),
	singleByte('iso885914', 'iso-8859-14', indexes.iso885914, 'iso'),
	singleByte('iso885915', 'iso-8859-15', indexes.iso885915, 'iso'),
	singleByte('iso885916', 'iso-8859-16', indexes.iso885916, 'iso')
	]
