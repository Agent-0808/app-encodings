// P1 冒烟测试：只锁住「平移前后行为一致」这条基线，断言值取自 P0 线上版本的实际输出。
// P2 起 encoder/decoder 返回 segment 数组，字符串视图由 renderEncode / renderDecode 提供；
// 解码侧收字节数组，十六进制文本先过 src/input/hex.ts 的 parseHex。
import { describe, expect, it } from 'vitest'
import {
	utf8Encoder, utf8Decoder, eucjpEncoder, eucjpDecoder, sjisEncoder, sjisDecoder,
	iso2022jpDecoder, renderEncode, renderDecode
	} from '../src/conversion.ts'
import { parseHex } from '../src/input/hex.ts'

describe('utf-8', () => {
	it('编码：把混合文本转成空格分隔的十六进制字节', () => {
		expect(renderEncode(utf8Encoder('你好 héllo')).trim()).toBe('e4 bd a0 e5 a5 bd 20 68 c3 a9 6c 6c 6f')
	})

	it('解码：十六进制字节还原为字符', () => {
		expect(renderDecode(utf8Decoder(parseHex('E4 BD A0 E5 A5 BD')))).toBe('你好')
	})
})

describe('euc-jp / shift_jis', () => {
	it('日文往返一致', () => {
		expect(renderDecode(eucjpDecoder(parseHex(renderEncode(eucjpEncoder('こんにちは')))))).toBe('こんにちは')
		expect(renderDecode(sjisDecoder(parseHex(renderEncode(sjisEncoder('こんにちは')))))).toBe('こんにちは')
	})
})

describe('旧 bug 修复回归', () => {
	it('shift_jis 半角片假名的字节之间带分隔符，可自身往返', () => {
		// legacy 漏掉了半角片假名之间的空格，导致输出 'a1a2a3…' 无法被 sjisDecoder 还原
		expect(renderDecode(sjisDecoder(parseHex(renderEncode(sjisEncoder('｡｢｣､･')))))).toBe('｡｢｣､･')
	})

	it('iso-2022-jp 遇到截断的换档序列不再死循环', () => {
		// legacy 在这些输入上会死循环；这里只要能在默认超时内正常返回即可
		for (const truncated of ['1B', '1B 24', '1B 28']) {
			expect(typeof renderDecode(iso2022jpDecoder(parseHex(truncated)))).toBe('string')
		}
	})
})
