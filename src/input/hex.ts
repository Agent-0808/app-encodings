// hex 输入前端：解码侧的唯一入口，只负责「文本 → 字节」（重构方案 §4）。
// 归一化优先于切分 —— 先剔除所有非十六进制字符，剩下的连续十六进制数字再按两位切分（§5.4）。

/** parseHex 的结果：字节流 + 每个字节回指原文的区间（P4 反向高亮用，§4 的 spans 字段） */
export interface HexParseResult {
	/** 归一化后的字节流 */
	bytes: number[]
	/** 每个字节在原文中的区间 [start, end)，含首不含尾；与 bytes 一一对应 */
	spans: Array<[number, number]>
}

/**
 * 把用户粘贴的十六进制文本解析成字节流。
 *
 * 可接受的形式（空格均可省）：`E4 BD A0`、`e4bda0`、`%E4%BD%A0`、`0xE4 0xBD`、`\xE4\xBD`，
 * 分隔符也可以是换行、逗号或制表符 —— 所有非十六进制字符一律剔除。
 *
 * 十六进制位数为奇数时抛错，不静默补位：补出来的字节看着合理却可能是错的，比直接报错更糟。
 */
export function parseHex (text: string): HexParseResult {
	// 逐字符扫描并记录每个十六进制位的原文位置：spans 要回指原文，归一化不能先于定位。
	// 0x / \x 前缀必须整段跳过：x 不是十六进制数字，若当作垃圾剔除，`0xE4` 会拆出多余的 `0`
	const digitPos: number[] = []
	for (let i = 0; i < text.length; i++) {
		if ((text[i] === '0' || text[i] === '\\') && (text[i + 1] === 'x' || text[i + 1] === 'X')) { i++; continue }
		if (/[0-9a-fA-F]/.test(text[i])) digitPos.push(i)
		}
	if (digitPos.length % 2 !== 0) {
		throw new Error(`odd number of hex digits (${digitPos.length})`)
		}
	const bytes: number[] = []
	const spans: Array<[number, number]> = []
	for (let k = 0; k < digitPos.length; k += 2) {
		bytes.push(parseInt(text[digitPos[k]] + text[digitPos[k + 1]], 16))
		spans.push([digitPos[k], digitPos[k + 1] + 1])
		}
	return { bytes, spans }
	}
