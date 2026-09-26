// hex 输入前端：无空格兼容（重构方案 §5.4）。
// 归一化优先于切分，因此这里逐条锁住「哪些写法应当被接受」「哪些应当报错」。
import { describe, expect, it } from 'vitest'
import { parseHex } from '../src/input/hex.ts'

describe('parseHex', () => {
	it('空格分隔的传统写法', () => {
		expect(parseHex('E4 BD A0')).toEqual([0xE4, 0xBD, 0xA0])
	})

	it('大小写与单字符空格都接受', () => {
		expect(parseHex('e4  bd\na0')).toEqual([0xE4, 0xBD, 0xA0])
	})

	it('无空格连写', () => {
		expect(parseHex('e4bda0')).toEqual([0xE4, 0xBD, 0xA0])
	})

	it('百分号分隔与无空格百分号（URL 编码）都能粘贴', () => {
		expect(parseHex('%E4%BD%A0')).toEqual([0xE4, 0xBD, 0xA0])
		expect(parseHex('%E4 %BD %A0')).toEqual([0xE4, 0xBD, 0xA0])
	})

	it('0x 与 \\x 前缀', () => {
		expect(parseHex('0xE4 0xBD 0xA0')).toEqual([0xE4, 0xBD, 0xA0])
		expect(parseHex('\\xE4\\xBD\\xA0')).toEqual([0xE4, 0xBD, 0xA0])
		// 前缀若被当成普通字符剔除，0xE4 会变成 0E4 这样多出一位，因此单独锁一条
		expect(parseHex('0xe4bd')).toEqual([0xE4, 0xBD])
	})

	it('逗号、换行等分隔符一律剔除', () => {
		expect(parseHex('E4,BD,A0')).toEqual([0xE4, 0xBD, 0xA0])
	})

	it('空输入得到空字节数组', () => {
		expect(parseHex('')).toEqual([])
		expect(parseHex('  \n ')).toEqual([])
	})

	it('十六进制位数为奇数时报错，不静默补位', () => {
		expect(() => parseHex('E4 BD A')).toThrow('odd number of hex digits (5)')
		expect(() => parseHex('e4bda')).toThrow('odd number of hex digits (5)')
	})
})
