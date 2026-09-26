// 索引数据加载器（方案 §7 P3）：indexes.js 原 517 KB 全量同步加载，
// 现在每张表一个 JSON，首次使用时动态 import 并缓存 —— 首屏索引数据降到 KB 量级，
// 勾选 big5/gb18030 这类大表时才付出对应的下载代价。
type Table = (number | null)[] | number[][]

const loaders: Record<string, () => Promise<{ default: Table }>> = {
	big5: () => import('./big5.json'),
	euckr: () => import('./euckr.json'),
	gb18030: () => import('./gb18030.json'),
	jis0208: () => import('./jis0208.json'),
	jis0212: () => import('./jis0212.json'),
	ibm866: () => import('./ibm866.json'),
	iso88592: () => import('./iso88592.json'),
	iso88593: () => import('./iso88593.json'),
	iso88594: () => import('./iso88594.json'),
	iso88595: () => import('./iso88595.json'),
	iso88596: () => import('./iso88596.json'),
	iso88597: () => import('./iso88597.json'),
	iso88598: () => import('./iso88598.json'),
	iso885910: () => import('./iso885910.json'),
	iso885913: () => import('./iso885913.json'),
	iso885914: () => import('./iso885914.json'),
	iso885915: () => import('./iso885915.json'),
	iso885916: () => import('./iso885916.json'),
	koi8r: () => import('./koi8r.json'),
	koi8u: () => import('./koi8u.json'),
	macintosh: () => import('./macintosh.json'),
	windows874: () => import('./windows874.json'),
	windows1250: () => import('./windows1250.json'),
	windows1251: () => import('./windows1251.json'),
	windows1252: () => import('./windows1252.json'),
	windows1253: () => import('./windows1253.json'),
	windows1254: () => import('./windows1254.json'),
	windows1255: () => import('./windows1255.json'),
	windows1256: () => import('./windows1256.json'),
	windows1257: () => import('./windows1257.json'),
	windows1258: () => import('./windows1258.json'),
	xmaccyrillic: () => import('./xmaccyrillic.json')
	}

const cache = new Map<string, Table>()

/** 取已加载的索引表；数据未就绪时明确报错，而不是让 encoder 悄悄产出全 unmappable */
export function getTable (name: string): (number | null)[] {
	const table = cache.get(name)
	if (table == null) throw new Error(`索引表 ${name} 尚未加载，先 await ensureData`)
	return table as (number | null)[]
	}

/** UI 侧判断要不要给某行显示 loading 态 */
export function isTableLoaded (name: string): boolean {
	return cache.has(name)
	}

/** 按需加载列出的索引表；已加载的表直接跳过（缓存即去重） */
export async function loadTables (names: readonly string[]): Promise<void> {
	await Promise.all(names.map(async name => {
		if (cache.has(name)) return
		const loader = loaders[name]
		if (loader == null) throw new Error(`没有名为 ${name} 的索引表`)
		cache.set(name, (await loader()).default)
		}))
	}
