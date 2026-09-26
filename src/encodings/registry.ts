// 编码注册表：编码清单的唯一真相来源，两栏输出行与勾选面板都由它生成。
// 新增一个编码只需要在这里加一项 —— 不必再同步修改 live 对象、encode()、decode()、
// customsettings 复选框、两列输出行、showEncoding 的 switch（对应重构方案 §5.1）。
import { getTable } from '../data/load.ts'
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
	/** 依赖的索引表名（src/data/*.json，P3 起按需加载）；utf-8 与 Unicode 序号行为空 */
	tables: readonly string[]
	encode: (stream: string, variant?: string) => EncodeSegment[]
	/** 解码侧统一收 DecodeInput：字节型编码用 bytes，Unicode 序号行用 text */
	decode: (input: DecodeInput, variant?: string) => DecodeUnit[]
	}

/** 24 个单字节编码共用同一组编解码器，区别只在索引表；表在 encode/decode 时经 getTable 就绪检查 */
function singleByte (id: string, label: string, table: string, group: RegistryGroup, shown = false): EncodingEntry {
	return { id, label, group, shown, tables: [table], encode: stream => sbEncoder(stream, getTable(table)), decode: input => sbDecoder(input.bytes, getTable(table)) }
	}

export const registry: EncodingEntry[] = [
	{ id: 'utf8', label: 'utf-8', group: 'common', shown: true, tables: [], encode: utf8Encoder, decode: input => utf8Decoder(input.bytes) },
	// Unicode 序号是「伪编码」：不产生字节，只把码位按所选格式写出来（5.6）
	{ id: 'unicode', label: 'Unicode', group: 'common', shown: true, tables: [], variants: unicodeVariants, encode: unicodeEncoder, decode: (input, variant) => unicodeDecoder(input.text, variant) },
	{ id: 'big5', label: 'big5', group: 'common', shown: true, tables: ['big5'], encode: big5Encoder, decode: input => big5Decoder(input.bytes) },
	{ id: 'eucjp', label: 'euc-jp', group: 'common', shown: true, tables: ['jis0208', 'jis0212'], encode: eucjpEncoder, decode: input => eucjpDecoder(input.bytes) },
	{ id: 'iso2022jp', label: 'iso-2022-jp', group: 'common', shown: true, tables: ['jis0208'], encode: iso2022jpEncoder, decode: input => iso2022jpDecoder(input.bytes) },
	{ id: 'shiftjis', label: 'shift_jis', group: 'common', shown: true, tables: ['jis0208'], encode: sjisEncoder, decode: input => sjisDecoder(input.bytes) },
	{ id: 'euckr', label: 'euc-kr', group: 'common', shown: true, tables: ['euckr'], encode: euckrEncoder, decode: input => euckrDecoder(input.bytes) },
	// gb18030 与 gbk 只差一个开关，解码方向完全共用（与 legacy 一致）
	{ id: 'gb18030', label: 'gb18030', group: 'common', shown: true, tables: ['gb18030'], encode: stream => gbEncoder(stream, false), decode: input => gbDecoder(input.bytes) },
	{ id: 'gbk', label: 'gbk', group: 'common', shown: true, tables: ['gb18030'], encode: stream => gbEncoder(stream, true), decode: input => gbDecoder(input.bytes) },
	singleByte('koi8r', 'koi8-r', 'koi8r', 'common'),
	singleByte('koi8u', 'koi8-u', 'koi8u', 'common'),

	singleByte('windows1250', 'windows-1250', 'windows1250', 'windows'),
	singleByte('windows1251', 'windows-1251', 'windows1251', 'windows'),
	singleByte('windows1252', 'windows-1252/latin1', 'windows1252', 'windows', true),
	singleByte('windows1253', 'windows-1253', 'windows1253', 'windows'),
	singleByte('windows1254', 'windows-1254', 'windows1254', 'windows'),
	singleByte('windows1255', 'windows-1255', 'windows1255', 'windows'),
	singleByte('windows1256', 'windows-1256', 'windows1256', 'windows'),
	singleByte('windows1257', 'windows-1257', 'windows1257', 'windows'),
	singleByte('windows1258', 'windows-1258', 'windows1258', 'windows'),
	singleByte('windows874', 'windows-874', 'windows874', 'windows'),
	singleByte('macintosh', 'macintosh', 'macintosh', 'windows'),
	singleByte('ibm866', 'ibm866', 'ibm866', 'windows'),
	singleByte('xmaccyrillic', 'x-mac-cyrillic', 'xmaccyrillic', 'windows'),

	singleByte('iso88592', 'iso-8859-2', 'iso88592', 'iso'),
	singleByte('iso88593', 'iso-8859-3', 'iso88593', 'iso'),
	singleByte('iso88594', 'iso-8859-4', 'iso88594', 'iso'),
	singleByte('iso88595', 'iso-8859-5', 'iso88595', 'iso'),
	singleByte('iso88596', 'iso-8859-6', 'iso88596', 'iso'),
	singleByte('iso88597', 'iso-8859-7', 'iso88597', 'iso'),
	singleByte('iso88598', 'iso-8859-8', 'iso88598', 'iso'),
	// iso-8859-8-i 与 iso-8859-8 只有书写方向不同，共用同一张索引表（indexes 里没有 iso88598i）
	singleByte('iso88598i', 'iso-8859-8-i', 'iso88598', 'iso'),
	singleByte('iso885910', 'iso-8859-10', 'iso885910', 'iso'),
	singleByte('iso885913', 'iso-8859-13', 'iso885913', 'iso'),
	singleByte('iso885914', 'iso-8859-14', 'iso885914', 'iso'),
	singleByte('iso885915', 'iso-8859-15', 'iso885915', 'iso'),
	singleByte('iso885916', 'iso-8859-16', 'iso885916', 'iso')
	]
