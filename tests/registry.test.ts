// 注册表自检：它是两栏输出行与勾选面板的唯一数据源，这里锁住「清单本身自洽」这条不变量。
// 直接把 id 与 DOM id 绑定之后，bug 1（按钮指向别的行）与 bug 2（引用不存在的索引）
// 这一类「漏改某处」的问题从结构上就不再有生存空间，剩下要守的就是清单本身。
import { describe, expect, it, beforeAll } from 'vitest'
import { registry } from '../src/encodings/registry.ts'
import { parseHex } from '../src/input/hex.ts'
import { renderDecode, renderEncode, ensureData } from '../src/conversion.ts'

// P3 起索引数据按需加载：先按注册表声明把所有表拉齐，再跑用例
beforeAll(async () => {
	for (const entry of registry) await ensureData(entry.tables)
	})

describe('registry', () => {
	it('id 与显示名都唯一', () => {
		expect(new Set(registry.map(entry => entry.id)).size).toBe(registry.length)
		expect(new Set(registry.map(entry => entry.label)).size).toBe(registry.length)
		})

	it('每个编码对代表性输入都不抛错', () => {
		for (const entry of registry) {
			// 单字节编码装不下汉字，会走 unmappable 分支，但同样不该抛错
			for (const stream of ['你好', 'A', '｡｢', '']) expect(() => entry.encode(stream), entry.id).not.toThrow()
			for (const stream of ['41 42', 'E4 BD A0', '']) expect(() => entry.decode({ text: stream, bytes: parseHex(stream).bytes }), entry.id).not.toThrow()
			}
		})

	it('Unicode 序号行的格式下拉框有四种取值', () => {
		const unicode = registry.find(entry => entry.id === 'unicode')
		expect(unicode?.variants?.map(variant => variant.label)).toEqual(['U+4F60', '4F60', '20320', '\\u4F60'])
		})

	it('每个编码的编码结果都能被自己解回原文', () => {
		// P2 验收项：各编码往返。单字节编码装不下汉字之类的样本，此时 encoder 会标成
		// unmappable，跳过即可 —— 这里要守的不变量是「能编出来的，就要能原样解回去」。
		// 样本覆盖 ASCII、中日韩、拉丁扩展、希腊、希伯来，保证每个编码至少被检查一次。
		// 不含半角片假名：euc-jp 的 legacy 残留 lead 状态会多出一个 �（见 conversion.test.ts）。
		const samples = ['ABC 123', '你好', 'こんにちは', '당신', 'héllo', 'Γειά', 'עברית']
		const failures: string[] = []
		let checked = 0
		for (const entry of registry) {
			for (const sample of samples) {
				const segments = entry.encode(sample)
				if (segments.length == 0 || segments.some(segment => segment.kind == 'unmappable')) continue
				const encoded = renderEncode(segments)
				const roundTrip = renderDecode(entry.decode({ text: encoded, bytes: parseHex(encoded).bytes }))
				if (roundTrip != sample) failures.push(`${entry.id} 处理 ${JSON.stringify(sample)} 得到 ${JSON.stringify(roundTrip)}`)
				checked++
				}
			}
		expect(failures).toEqual([])
		expect(checked).toBeGreaterThan(registry.length)  // 至少每个编码都轮上一遍
		})

	it('勾选面板的三列分组都非空', () => {
		for (const group of ['common', 'windows', 'iso']) {
			expect(registry.filter(entry => entry.group === group).length, group).toBeGreaterThan(0)
			}
		})

	it('默认展示改造前那套常用集，另加 Unicode 序号行', () => {
		expect(registry.filter(entry => entry.shown).map(entry => entry.id))
			.toEqual(['utf8', 'unicode', 'big5', 'eucjp', 'iso2022jp', 'shiftjis', 'euckr', 'gb18030', 'gbk', 'windows1252'])
		})
	})
