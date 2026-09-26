// hex 输入前端：无空格兼容（重构方案 §5.4）与 spans 回指（P4 反向高亮，§4）。
// 归一化优先于切分，因此这里逐条锁住「哪些写法应当被接受」「哪些应当报错」。
import { describe, expect, it } from 'vitest'
import { parseHex } from '../src/input/hex.ts'

describe('parseHex', () => {
	it('空格分隔的传统写法', () => {
		expect(parseHex('E4 BD A0').bytes).toEqual([0xE4, 0xBD, 0xA0])
	})

	it('大小写与单字符空格都接受', () => {
		expect(parseHex('e4  bd\na0').bytes).toEqual([0xE4, 0xBD, 0xA0])
	})

	it('无空格连写', () => {
		expect(parseHex('e4bda0').bytes).toEqual([0xE4, 0xBD, 0xA0])
	})

	it('百分号分隔与无空格百分号（URL 编码）都能粘贴', () => {
		expect(parseHex('%E4%BD%A0').bytes).toEqual([0xE4, 0xBD, 0xA0])
		expect(parseHex('%E4 %BD %A0').bytes).toEqual([0xE4, 0xBD, 0xA0])
	})

	it('0x 与 \\x 前缀', () => {
		expect(parseHex('0xE4 0xBD 0xA0').bytes).toEqual([0xE4, 0xBD, 0xA0])
		expect(parseHex('\\xE4\\xBD\\xA0').bytes).toEqual([0xE4, 0xBD, 0xA0])
		// 前缀若被当成普通字符剔除，0xE4 会变成 0E4 这样多出一位，因此单独锁一条
		expect(parseHex('0xe4bd').bytes).toEqual([0xE4, 0xBD])
	})

	it('逗号、换行等分隔符一律剔除', () => {
		expect(parseHex('E4,BD,A0').bytes).toEqual([0xE4, 0xBD, 0xA0])
	})

	it('空输入得到空字节数组', () => {
		expect(parseHex('')).toEqual({ bytes: [], spans: [] })
		expect(parseHex('  \n ')).toEqual({ bytes: [], spans: [] })
	})

	it('十六进制位数为奇数时报错，不静默补位', () => {
		expect(() => parseHex('E4 BD A')).toThrow('odd number of hex digits (5)')
		expect(() => parseHex('e4bda')).toThrow('odd number of hex digits (5)')
	})

	it('spans：每个字节回指原文区间，供解码侧反向高亮（P4）', () => {
		// 空格分隔：区间恰好盖住各自的两位
		expect(parseHex('E4 BD A0').spans).toEqual([[0, 2], [3, 5], [6, 8]])
		// 连写：区间首尾相接
		expect(parseHex('e4bda0').spans).toEqual([[0, 2], [2, 4], [4, 6]])
		// 前缀不算进区间
		expect(parseHex('0xE4').spans).toEqual([[2, 4]])
		expect(parseHex('%E4%BD%A0').spans).toEqual([[1, 3], [4, 6], [7, 9]])
		// 垃圾字符夹在中间也不影响对应关系
		expect(parseHex('xx E4 yy BD zz').spans).toEqual([[3, 5], [9, 11]])
	})
})
