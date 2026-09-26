// 注册表自检：它是两栏输出行与勾选面板的唯一数据源，这里锁住「清单本身自洽」这条不变量。
// 直接把 id 与 DOM id 绑定之后，bug 1（按钮指向别的行）与 bug 2（引用不存在的索引）
// 这一类「漏改某处」的问题从结构上就不再有生存空间，剩下要守的就是清单本身。
import { describe, expect, it } from 'vitest'
import { registry } from '../src/encodings/registry.ts'

describe('registry', () => {
	it('id 与显示名都唯一', () => {
		expect(new Set(registry.map(entry => entry.id)).size).toBe(registry.length)
		expect(new Set(registry.map(entry => entry.label)).size).toBe(registry.length)
		})

	it('每个编码对代表性输入都不抛错', () => {
		for (const entry of registry) {
			// 单字节编码装不下汉字，会走 unmappable 分支，但同样不该抛错
			for (const stream of ['你好', 'A', '｡｢', '']) expect(() => entry.encode(stream), entry.id).not.toThrow()
			for (const stream of ['41 42', 'E4 BD A0', '']) expect(() => entry.decode(stream), entry.id).not.toThrow()
			}
		})

	it('勾选面板的三列分组都非空', () => {
		for (const group of ['common', 'windows', 'iso']) {
			expect(registry.filter(entry => entry.group === group).length, group).toBeGreaterThan(0)
			}
		})

	it('默认展示的仍是改造前那套常用集', () => {
		expect(registry.filter(entry => entry.shown).map(entry => entry.id))
			.toEqual(['utf8', 'big5', 'eucjp', 'iso2022jp', 'shiftjis', 'euckr', 'gb18030', 'gbk', 'windows1252'])
		})
	})
