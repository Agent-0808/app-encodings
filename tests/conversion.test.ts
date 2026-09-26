// P1 冒烟测试：只锁住「平移前后行为一致」这条基线，断言值取自 P0 线上版本的实际输出。
// P2 起 encoder/decoder 返回 segment 数组，字符串视图由 renderEncode / renderDecode 提供；
// 解码侧收字节数组，十六进制文本先过 src/input/hex.ts 的 parseHex。
import { describe, expect, it, beforeAll } from 'vitest'
import {
	utf8Encoder, utf8Decoder, eucjpEncoder, eucjpDecoder, sjisEncoder, sjisDecoder,
	iso2022jpDecoder, renderEncode, renderDecode, ensureData
	} from '../src/conversion.ts'
import { parseHex } from '../src/input/hex.ts'

// P3 起索引数据按需加载：用到索引表的编码先 ensureData，再跑用例
beforeAll(async () => {
	await ensureData(['jis0208', 'jis0212'])
	})

describe('utf-8', () => {
	it('编码：把混合文本转成空格分隔的十六进制字节', () => {
		expect(renderEncode(utf8Encoder('你好 héllo')).trim()).toBe('e4 bd a0 e5 a5 bd 20 68 c3 a9 6c 6c 6f')
	})

	it('解码：十六进制字节还原为字符', () => {
		expect(renderDecode(utf8Decoder(parseHex('E4 BD A0 E5 A5 BD').bytes))).toBe('你好')
	})
})

describe('euc-jp / shift_jis', () => {
	it('日文往返一致', () => {
		expect(renderDecode(eucjpDecoder(parseHex(renderEncode(eucjpEncoder('こんにちは'))).bytes))).toBe('こんにちは')
		expect(renderDecode(sjisDecoder(parseHex(renderEncode(sjisEncoder('こんにちは'))).bytes))).toBe('こんにちは')
	})
})

describe('字节输出补零（有意的行为变更，legacy 不补）', () => {
	it('小于 0x10 的字节输出两位，与 Unicode 行的 4F60 格式一致', () => {
		// legacy 把 0x0E 显示成 `e`：去掉空格粘贴回解码框会被 parseHex 并成 0xE4，语义全变。
		// 补零后 `0e 04` 无论加不加空格都按两位切分，怎么粘都不会错位。
		expect(renderEncode(utf8Encoder('\x0e\x04')).trim()).toBe('0e 04')
	})
})

describe('旧 bug 修复回归', () => {
	it('shift_jis 半角片假名的字节之间带分隔符，可自身往返', () => {
		// legacy 漏掉了半角片假名之间的空格，导致输出 'a1a2a3…' 无法被 sjisDecoder 还原
		expect(renderDecode(sjisDecoder(parseHex(renderEncode(sjisEncoder('｡｢｣､･'))).bytes))).toBe('｡｢｣､･')
	})

	it('iso-2022-jp 遇到截断的换档序列不再死循环', () => {
		// legacy 在这些输入上会死循环；这里只要能在默认超时内正常返回即可
		for (const truncated of ['1B', '1B 24', '1B 28']) {
			expect(typeof renderDecode(iso2022jpDecoder(parseHex(truncated).bytes))).toBe('string')
			}
		})
})

describe('已知遗留行为（原样保留，是否修待定）', () => {
	it('euc-jp 半角片假名：残留的 lead 状态会多出一个 �', () => {
		// 半角片假名（8E A1…）解出字符后 eucjpLead 没有清空（legacy 如此，见 conversion.ts 里的注释）：
		// 紧跟着的那个 8E 先被当成「带 lead 的残缺序列」吐出一个 �，末尾残留的 0x8E 再吐一个。
		// 这条用例把现状钉住：哪天决定修它，这里会失败，提醒同步改掉。
		expect(renderDecode(eucjpDecoder(parseHex('8E A1 8E A2').bytes))).toBe('｡�｢�')
		})
})
