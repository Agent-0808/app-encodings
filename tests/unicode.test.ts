// Unicode 序号「伪编码」：正向按所选格式写出码位，反向把码位记号还原成字符（重构方案 §5.6）。
import { describe, expect, it } from 'vitest'
import { unicodeEncoder, unicodeDecoder } from '../src/encodings/unicode.ts'
import { renderEncode, renderDecode } from '../src/conversion.ts'

describe('Unicode 序号：正向', () => {
	it('四种格式各按自己的写法渲染', () => {
		expect(renderEncode(unicodeEncoder('你好', 'uplus')).trim()).toBe('U+4F60 U+597D')
		expect(renderEncode(unicodeEncoder('你好', 'hex')).trim()).toBe('4F60 597D')
		expect(renderEncode(unicodeEncoder('你好', 'dec')).trim()).toBe('20320 22909')
		expect(renderEncode(unicodeEncoder('你好', 'escape')).trim()).toBe('\\u4F60 \\u597D')
	})

	it('默认格式是 U+，且不足四位补零', () => {
		expect(renderEncode(unicodeEncoder(' h')).trim()).toBe('U+0020 U+0068')
	})

	it('增补平面用 \\u{...}', () => {
		expect(renderEncode(unicodeEncoder('😀', 'escape')).trim()).toBe('\\u{1F600}')
	})

	it('每个字符一段，cpIndex 与输入字符一一对应', () => {
		const segments = unicodeEncoder('你好', 'uplus')
		expect(segments.map(segment => segment.cpIndex)).toEqual([0, 1])
		expect(segments.every(segment => segment.kind === 'data')).toBe(true)
	})
})

describe('Unicode 序号：反向', () => {
	it('带前缀的记号不论当前格式都按前缀解释', () => {
		expect(renderDecode(unicodeDecoder('U+4F60 U+597D'))).toBe('你好')
		expect(renderDecode(unicodeDecoder('u+4f60 u+597d'))).toBe('你好')
		expect(renderDecode(unicodeDecoder('0x4F60 0x597D'))).toBe('你好')
		expect(renderDecode(unicodeDecoder('\\u4F60\\u597D'))).toBe('你好')
	})

	it('十进制实体与十六进制实体', () => {
		expect(renderDecode(unicodeDecoder('&#20320; &#22909;'))).toBe('你好')
		expect(renderDecode(unicodeDecoder('&#x4F60;&#x597D;'))).toBe('你好')
	})

	it('无前缀的记号按所选格式的进制解释', () => {
		expect(renderDecode(unicodeDecoder('20320 22909', 'dec'))).toBe('你好')
		expect(renderDecode(unicodeDecoder('4F60 597D'))).toBe('你好')
	})

	it('增补平面往返一致', () => {
		expect(renderDecode(unicodeDecoder(renderEncode(unicodeEncoder('😀你好'))))).toBe('😀你好')
	})

	it('认不出的记号给 �，不猜也不抛错', () => {
		// g–z 不是十六进制数字，整段算一个坏记号
		expect(renderDecode(unicodeDecoder('xyz'))).toBe('�')
		// 十进制格式下混进 a–f，说明它不是十进制
		expect(renderDecode(unicodeDecoder('4F60', 'dec'))).toBe('�')
		// 超出 Unicode 范围
		expect(renderDecode(unicodeDecoder('U+FFFFFF'))).toBe('�')
	})

	it('inputRange 的下标空间是记号序号', () => {
		expect(unicodeDecoder('U+4F60 U+597D').map(unit => unit.inputRange)).toEqual([[0, 1], [1, 2]])
	})
})
