// Segment 模型：encoder / decoder 不再返回拼接好的字符串，而是返回结构化结果。
// 这是「高亮联动」「二进制视图」「成功/失败着色」共同的地基，对应重构方案 §3.2。

/**
 * 输出单元：结果里最小的可高亮单位。
 *
 * 之所以叫 units 而不是 bytes —— 字节型编码的单元是十六进制字节，
 * 「Unicode 序号」这类伪编码的单元是 `U+4F60`，二进制视图的单元是 `01001000`。
 * 泛化之后，「编码」「码位视图」「二进制视图」共用同一套渲染与高亮逻辑。
 */
export interface OutputUnit {
	/** 数值：字节值（0–255）或码位 */
	value: number
	/** 展示文本，如 'E4' / 'U+4F60' / '01001000' */
	render: string
	/**
	 * 状态切换字节：不归属任何输入字符，只有 iso-2022-jp 会产生。
	 * 它跟随其后的字符一起高亮，悬浮时可提示「切换到 JIS X 0208」。
	 */
	control?: boolean
}

/** encoder 的输出：一个输入码点（或一组码点）→ 一段输出 */
export interface EncodeSegment {
	/** 输入侧码点下标，供高亮反查；无法逐字对应时为 null */
	cpIndex: number | null
	/** 产出的输出单元；unmappable 时为空数组，文本看 literal */
	units: OutputUnit[]
	/**
	 * data：正常映射出的单元
	 * unmappable：该字符在本编码里无对应字节，原样输出 `&#20320;`
	 * control：不归属任何输入字符的状态切换字节（目前只有 iso-2022-jp 会产生）
	 */
	kind: 'data' | 'unmappable' | 'control'
	/** kind 为 unmappable 时的原文，如 '&#20320;' */
	literal?: string
}

/** decoder 的输出：一段输入 → 一个字符 */
export interface DecodeUnit {
	/** 输入字节下标区间，含首不含尾，供反向高亮 */
	inputRange: [number, number]
	text: string
	/** replacement 即 �，它可能一次吞掉多个输入字节 */
	kind: 'data' | 'replacement'
}

/**
 * 解码入口的输入：两栏共用同一份，由 UI 层解析一次后发给每一行。
 * 字节型的编码只看 bytes；不按字节解读的行（Unicode 序号）看 text —— 后者的输入本来就不必是 hex。
 */
export interface DecodeInput {
	/** 用户输入的原文 */
	text: string
	/** 原文按 hex 归一化后的字节；解析失败时是空数组，原因由 UI 层另行提示 */
	bytes: number[]
}
