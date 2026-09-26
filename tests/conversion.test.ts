// P1 冒烟测试：只锁住「平移前后行为一致」这条基线，断言值取自 P0 线上版本的实际输出。
import { describe, expect, it } from 'vitest'
import { utf8Encoder, utf8Decoder, eucjpEncoder, eucjpDecoder, sjisEncoder, sjisDecoder } from '../src/conversion.js'

describe('utf-8', () => {
	it('编码：把混合文本转成空格分隔的十六进制字节', () => {
		expect(utf8Encoder('你好 héllo').trim()).toBe('e4 bd a0 e5 a5 bd 20 68 c3 a9 6c 6c 6f')
	})

	it('解码：十六进制字节还原为字符', () => {
		expect(utf8Decoder('E4 BD A0 E5 A5 BD')).toBe('你好')
	})
})

describe('euc-jp / shift_jis', () => {
	it('日文往返一致', () => {
		expect(eucjpDecoder(eucjpEncoder('こんにちは'))).toBe('こんにちは')
		expect(sjisDecoder(sjisEncoder('こんにちは'))).toBe('こんにちは')
	})
})
