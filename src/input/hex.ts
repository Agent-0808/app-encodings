// hex 输入前端：解码侧的唯一入口，只负责「文本 → 字节」（重构方案 §4）。
// 归一化优先于切分 —— 先剔除所有非十六进制字符，剩下的连续十六进制数字再按两位切分（§5.4）。
// 这里先只返回字节数组；§4 里 BytesInput.spans（每个字节回指输入文本区间）等 P4 做反向高亮时再加，
// 目前没有消费方，避免引入无人使用的字段。

/**
 * 把用户粘贴的十六进制文本解析成字节数组。
 *
 * 可接受的形式（空格均可省）：`E4 BD A0`、`e4bda0`、`%E4%BD%A0`、`0xE4 0xBD`、`\xE4\xBD`，
 * 分隔符也可以是换行、逗号或制表符 —— 所有非十六进制字符一律先剔除。
 *
 * 十六进制位数为奇数时抛错，不静默补位：补出来的字节看着合理却可能是错的，比直接报错更糟。
 */
export function parseHex (text: string): number[] {
	// 0x / \x 前缀必须在过滤之前去掉：x 不是十六进制数字，
	// 若交给下面的过滤处理，`0xE4` 会被拆成 `0E4` 这样多余的一位
	const digits = text
		.replace(/0[xX]/g, '')
		.replace(/\\[xX]/g, '')
		.replace(/[^0-9a-fA-F]/g, '')
	if (digits.length % 2 !== 0) {
		throw new Error(`odd number of hex digits (${digits.length})`)
		}
	const bytes: number[] = []
	for (let i = 0; i < digits.length; i += 2) bytes.push(parseInt(digits.slice(i, i + 2), 16))
	return bytes
	}
