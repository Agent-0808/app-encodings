// 码位与字符互转的公共助手（原定义在 basics.js）。
// 之所以单独成模块：basics.js（UI 层）与 conversion.ts（算法层）都要用它们，
// 留在任一侧都会形成循环依赖。对应重构方案 §5.1 的 lib/codepoints。

export function chars2cps ( chars ) { 
	// this is needed because of javascript's handling of supplementary characters
	// char: a string of unicode characters
	// returns an array of decimal code point values
	var haut = 0
	var n = 0
	var out = []
	for (var i = 0; i < chars.length; i++) {
		var b = chars.charCodeAt(i)
		if (b < 0 || b > 0xFFFF) {
			alert( 'Error in chars2cps: byte out of range ' + b.toString(16) + '!' )
			}
		if (haut != 0) {
			if (0xDC00 <= b && b <= 0xDFFF) {
				out.push(0x10000 + ((haut - 0xD800) << 10) + (b - 0xDC00))
				haut = 0
				continue
				}
			else {
				alert( 'Error in chars2cps: surrogate out of range ' + haut.toString(16) + '!' )
				haut = 0
				}
			}
		if (0xD800 <= b && b <= 0xDBFF) {
			haut = b
			}
		else {
			out.push( b )
			}
		}
	return out
	}

/** 字符串 → 码点的原文区间列表（UTF-16 下标，含首不含尾）。
 *  分割规则与 chars2cps 完全一致：代理对合并为一个码点，孤立代理丢弃 ——
 *  保证左栏镜像层的区间下标与 encoder 的 cpIndex 对齐（P4 高亮联动）。 */
export function cpSpans ( chars ) {
	var spans = []
	var i = 0
	while (i < chars.length) {
		var b = chars.charCodeAt(i)
		if (0xD800 <= b && b <= 0xDBFF && i + 1 < chars.length && 0xDC00 <= chars.charCodeAt(i + 1) && chars.charCodeAt(i + 1) <= 0xDFFF) {
			spans.push([i, i + 2])
			i += 2
			continue
			}
		if (0xD800 <= b && b <= 0xDFFF) { i++; continue }  // 孤立代理：chars2cps 也会丢掉它
		spans.push([i, i + 1])
		i++
		}
	return spans
	}

export function cps2chars ( str ) {
	// converts to characters a sequence of space-separated hex numbers representing bytes in utf8
	// str: string, the sequence to be converted
	var out = ""
	var counter = 0
	var n = 0
	
	// remove leading and trailing spaces
	str = str.replace(/^\s+/, '')
	str = str.replace(/\s+$/,'')
	if (str.length == 0) { return "" }
	str = str.replace(/\s+/g, ' ')
  
	var listArray = str.split(' ')
	for ( var i = 0; i < listArray.length; i++ ) {
		var b = parseInt(listArray[i], 16)  // console.log('b:'+dec2hex(b));
		switch (counter) {
			case 0:
				if (0 <= b && b <= 0x7F) {  // 0xxxxxxx
					out += dec2char(b) } 
				else if (0xC0 <= b && b <= 0xDF) {  // 110xxxxx
					counter = 1
					n = b & 0x1F }
				else if (0xE0 <= b && b <= 0xEF) {  // 1110xxxx
					counter = 2
					n = b & 0xF }
				else if (0xF0 <= b && b <= 0xF7) {  // 11110xxx
					counter = 3
					n = b & 0x7 }
				else {
					out += '�'
					}
				break;
			case 1:
				if (b < 0x80 || b > 0xBF) {
					out += '�'
					}
				counter--
				out += dec2char((n << 6) | (b-0x80))
				n = 0
				break
			case 2: case 3:
				if (b < 0x80 || b > 0xBF) {
					out += '�'
					}
				n = (n << 6) | (b-0x80)
				counter--
				break
			}
		}
		return out.trim()
	}

export function dec2char ( n ) {
	// converts a decimal number to a Unicode character
	// n: the dec codepoint value to be converted
    var out
    if (n <= 0xFFFF) { out = String.fromCharCode(n) } 
	else if (n <= 0x10FFFF) {
		n -= 0x10000
		out = String.fromCharCode(0xD800 | (n >> 10)) + String.fromCharCode(0xDC00 | (n & 0x3FF))
    	} 
	else out = 'dec2char error: Code point out of range: '+n
	return out
	}


export function getIndexPtr (cp, index) {
	 for (var p=0;p<index.length;p++) {
		if (index[p] == cp) {
			return p
			}
		}
	return null
	}
