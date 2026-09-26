// JSON 索引表按宽松的联合类型对待：不开启 resolveJsonModule（几十万条目会让 tsc
// 把每张表推断成巨型元组类型），由 Vite 在构建时负责真实解析。
declare module '*.json' {
	const value: (number | null)[] | number[][]
	export default value
	}
