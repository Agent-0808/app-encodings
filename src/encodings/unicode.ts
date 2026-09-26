// Unicode 序号「伪编码」：不查索引表、不产生字节 —— 一个字符只对应它的码位（重构方案 §5.6）。
// 它与字节型编码共用同一套 Segment 模型（units 里放的是码位，而不是字节），
// 所以行内格式下拉框、↗/↖ 复制、成败着色这些 UI 都不用为它另写一份。
import { chars2cps, dec2char } from '../lib/codepoints.js'
import type { DecodeUnit, EncodeSegment } from './types.js'

/** 行内下拉框可选的展示格式：value 既标识格式，也决定解码时「无前缀记号」按几进制解释 */
export const unicodeVariants = [
	{ value: 'uplus', label: 'U+4F60' },
	{ value: 'hex', label: '4F60' },
	{ value: 'dec', label: '20320' },
	{ value: 'escape', label: '\\u4F60' }
	]

/** 默认格式：最通用，也最便于复制进别的工具 */
export const unicodeDefaultVariant = 'uplus'

/** 按所选格式渲染一个码位 */
function renderCodepoint (cp: number, variant: string): string {
	const hex = cp.toString(16).toUpperCase()
	switch (variant) {
		case 'hex': return hex.padStart(2, '0')  // 与字节行同构：都是空格分隔的十六进制
		case 'dec': return String(cp)
		case 'escape': return '\\u' + (cp > 0xFFFF ? '{' + hex + '}' : hex.padStart(4, '0'))
		default: return 'U+' + hex.padStart(4, '0')
		}
	}

/** 正向：每个字符一段，unit 的值就是码位 */
export function unicodeEncoder (stream: string, variant = unicodeDefaultVariant): EncodeSegment[] {
	const cps: number[] = chars2cps(stream)
	return cps.map((cp, cpIndex) => ({
		cpIndex,
		units: [{ value: cp, render: renderCodepoint(cp, variant) }],
		kind: 'data'
		}))
	}

/**
 * 一个码位记号的形态：可选前缀 + 数字 + 可选的后缀 `}` / `;`。
 * 前缀决定进制：`&#` 是十进制实体，`&#x` / `u+` / `0x` / `\u` 都是十六进制；
 * 没有前缀的记号按所选格式的进制解释（dec 格式按 10 进制，其余按 16 进制）。
 */
const tokenPattern = /([uU]\+|0[xX]|\\u\{?|&#[xX]?|)([0-9a-fA-F]+)\}?;?/g

/** 记号之间允许出现的分隔符；出现别的内容说明这段是垃圾 */
const separatorPattern = /[^\s,;|]/

/**
 * 反向：把码位记号还原成字符，`U+4F60 U+597D` / `20320 22909` / `&#20320;` 都能粘贴。
 *
 * 认不出的记号给一个 �（与其它 decoder 一致），而不是抛错 —— 行整行不着绿即已说明有失败者。
 * 本行没有字节，因此 inputRange 的下标空间是「第几个记号」，而不是字节下标。
 */
export function unicodeDecoder (text: string, variant = unicodeDefaultVariant): DecodeUnit[] {
	const radix = variant === 'dec' ? 10 : 16
	const units: DecodeUnit[] = []
	let token = 0     // 记号序号
	let scanned = 0   // 已扫描到的原文位置
	for (const match of text.matchAll(tokenPattern)) {
		// 记号之间只允许分隔符，别的内容（中文、g–z 之类）整段算一个坏记号
		if (separatorPattern.test(text.slice(scanned, match.index))) units.push(replacement(token++))
		scanned = match.index + match[0].length
		const [ , prefix, digits ] = match
		const tokenRadix = prefix === '' ? radix : prefix === '&#' ? 10 : 16
		const cp = parseInt(digits, tokenRadix)
		// 十进制记号里混进 a–f 说明它根本不是十进制，按坏记号处理，不猜
		const wrongRadix = tokenRadix === 10 && /[a-fA-F]/.test(digits)
		if (wrongRadix || cp > 0x10FFFF) units.push(replacement(token))
		else units.push({ inputRange: [token, token + 1], text: dec2char(cp), kind: 'data' })
		token++
		}
	// 末尾剩下的内容也是一个坏记号
	if (separatorPattern.test(text.slice(scanned))) units.push(replacement(token))
	return units
	}

/** 一个坏记号 */
function replacement (token: number): DecodeUnit {
	return { inputRange: [token, token + 1], text: '�', kind: 'replacement' }
	}
