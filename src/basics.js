import { indexes } from './data/indexes.js'
import {
	utf8Encoder, big5Encoder, eucjpEncoder, iso2022jpEncoder, sjisEncoder, euckrEncoder, gbEncoder, sbEncoder,
	utf8Decoder, big5Decoder, eucjpDecoder, iso2022jpDecoder, sjisDecoder, euckrDecoder, gbDecoder, sbDecoder,
	renderEncode, renderDecode
	} from './conversion.ts'

export function encode ( stream ) {
	// clear out the previous results
	var spans = document.getElementById('encodingcolumn').querySelectorAll('span')
	for (var s=0;s<spans.length;s++) if (spans[s].textContent != '↗') spans[s].textContent = ''
	if (live.utf8) document.getElementById('utf8encResult').textContent = renderEncode(utf8Encoder(stream))
	if (live.big5) document.getElementById('big5encResult').textContent = renderEncode(big5Encoder(stream))
	if (live.eucjp) document.getElementById('eucjpencResult').textContent = renderEncode(eucjpEncoder(stream))
	if (live.iso2022jp) document.getElementById('iso2022jpencResult').textContent = renderEncode(iso2022jpEncoder(stream))
	if (live.shiftjis) document.getElementById('sjisencResult').textContent = renderEncode(sjisEncoder(stream))
	if (live.euckr) document.getElementById('euckrencResult').textContent = renderEncode(euckrEncoder(stream))
	if (live.gb18030) document.getElementById('gb18030encResult').textContent = renderEncode(gbEncoder(stream, false))
	if (live.gbk) document.getElementById('gbkencResult').textContent = renderEncode(gbEncoder(stream, true))
	if (live.koi8r) document.getElementById('koi8rencResult').textContent = renderEncode(sbEncoder(stream, indexes.koi8r))
	if (live.koi8u) document.getElementById('koi8uencResult').textContent = renderEncode(sbEncoder(stream, indexes.koi8u))
	if (live.windows1250) document.getElementById('win1250encResult').textContent = renderEncode(sbEncoder(stream, indexes.windows1250))
	if (live.windows1251) document.getElementById('win1251encResult').textContent = renderEncode(sbEncoder(stream, indexes.windows1251))
	if (live.windows1252) document.getElementById('win1252encResult').textContent = renderEncode(sbEncoder(stream, indexes.windows1252))
	if (live.windows1253) document.getElementById('win1253encResult').textContent = renderEncode(sbEncoder(stream, indexes.windows1253))
	if (live.windows1254) document.getElementById('win1254encResult').textContent = renderEncode(sbEncoder(stream, indexes.windows1254))
	if (live.windows1255) document.getElementById('win1255encResult').textContent = renderEncode(sbEncoder(stream, indexes.windows1255))
	if (live.windows1256) document.getElementById('win1256encResult').textContent = renderEncode(sbEncoder(stream, indexes.windows1256))
	if (live.windows1257) document.getElementById('win1257encResult').textContent = renderEncode(sbEncoder(stream, indexes.windows1257))
	if (live.windows1258) document.getElementById('win1258encResult').textContent = renderEncode(sbEncoder(stream, indexes.windows1258))
	if (live.windows874) document.getElementById('win874encResult').textContent = renderEncode(sbEncoder(stream, indexes.windows874))
	if (live.macintosh) document.getElementById('macintoshencResult').textContent = renderEncode(sbEncoder(stream, indexes.macintosh))
	if (live.ibm866) document.getElementById('ibm866encResult').textContent = renderEncode(sbEncoder(stream, indexes.ibm866))
	if (live.xmaccyrillic) document.getElementById('xmaccyrillicencResult').textContent = renderEncode(sbEncoder(stream, indexes.xmaccyrillic))
	if (live.iso88592) document.getElementById('iso88592encResult').textContent = renderEncode(sbEncoder(stream, indexes.iso88592))
	if (live.iso88593) document.getElementById('iso88593encResult').textContent = renderEncode(sbEncoder(stream, indexes.iso88593))
	if (live.iso88594) document.getElementById('iso88594encResult').textContent = renderEncode(sbEncoder(stream, indexes.iso88594))
	if (live.iso88595) document.getElementById('iso88595encResult').textContent = renderEncode(sbEncoder(stream, indexes.iso88595))
	if (live.iso88596) document.getElementById('iso88596encResult').textContent = renderEncode(sbEncoder(stream, indexes.iso88596))
	if (live.iso88597) document.getElementById('iso88597encResult').textContent = renderEncode(sbEncoder(stream, indexes.iso88597))
	if (live.iso88598) document.getElementById('iso88598encResult').textContent = renderEncode(sbEncoder(stream, indexes.iso88598))
	if (live.iso88598i) document.getElementById('iso88598iencResult').textContent = renderEncode(sbEncoder(stream, indexes.iso88598))
	if (live.iso885910) document.getElementById('iso885910encResult').textContent = renderEncode(sbEncoder(stream, indexes.iso885910))
	if (live.iso885913) document.getElementById('iso885913encResult').textContent = renderEncode(sbEncoder(stream, indexes.iso885913))
	if (live.iso885914) document.getElementById('iso885914encResult').textContent = renderEncode(sbEncoder(stream, indexes.iso885914))
	if (live.iso885915) document.getElementById('iso885915encResult').textContent = renderEncode(sbEncoder(stream, indexes.iso885915))
	if (live.iso885916) document.getElementById('iso885916encResult').textContent = renderEncode(sbEncoder(stream, indexes.iso885916))
	
	// paint the background green if there isn't an escape character
	var tests = document.getElementById('encodingcolumn').querySelectorAll('.output')
	for (var t=0;t<tests.length;t++) {
		if (tests[t].textContent.match('&')) tests[t].className = 'output'
		else if (tests[t].childNodes[3].textContent != '') tests[t].className = 'output yes'
		}
	}

export function decode ( stream ) {
	var spans = document.getElementById('decodingcolumn').querySelectorAll('span')
	for (var s=0;s<spans.length;s++) spans[s].textContent = ''
	if (live.utf8) document.getElementById('utf8decResult').textContent = renderDecode(utf8Decoder(stream))
	if (live.big5) document.getElementById('big5decResult').textContent = renderDecode(big5Decoder(stream))
	if (live.eucjp) document.getElementById('eucjpdecResult').textContent = renderDecode(eucjpDecoder(stream))
	if (live.iso2022jp) document.getElementById('iso2022jpdecResult').textContent = renderDecode(iso2022jpDecoder(stream))
	if (live.shiftjis) document.getElementById('sjisdecResult').textContent = renderDecode(sjisDecoder(stream))
	if (live.euckr) document.getElementById('euckrdecResult').textContent = renderDecode(euckrDecoder(stream))
	if (live.gb18030) document.getElementById('gb18030decResult').textContent = renderDecode(gbDecoder(stream))
	if (live.gbk) document.getElementById('gbkdecResult').textContent = renderDecode(gbDecoder(stream))
	if (live.koi8r) document.getElementById('koi8rdecResult').textContent = renderDecode(sbDecoder(stream, indexes.koi8r))
	if (live.koi8u) document.getElementById('koi8udecResult').textContent = renderDecode(sbDecoder(stream, indexes.koi8u))
	if (live.windows1250) document.getElementById('win1250decResult').textContent = renderDecode(sbDecoder(stream, indexes.windows1250))
	if (live.windows1251) document.getElementById('win1251decResult').textContent = renderDecode(sbDecoder(stream, indexes.windows1251))
	if (live.windows1252) document.getElementById('win1252decResult').textContent = renderDecode(sbDecoder(stream, indexes.windows1252))
	if (live.windows1253) document.getElementById('win1253decResult').textContent = renderDecode(sbDecoder(stream, indexes.windows1253))
	if (live.windows1254) document.getElementById('win1254decResult').textContent = renderDecode(sbDecoder(stream, indexes.windows1254))
	if (live.windows1255) document.getElementById('win1255decResult').textContent = renderDecode(sbDecoder(stream, indexes.windows1255))
	if (live.windows1256) document.getElementById('win1256decResult').textContent = renderDecode(sbDecoder(stream, indexes.windows1256))
	if (live.windows1257) document.getElementById('win1257decResult').textContent = renderDecode(sbDecoder(stream, indexes.windows1257))
	if (live.windows1258) document.getElementById('win1258decResult').textContent = renderDecode(sbDecoder(stream, indexes.windows1258))
	if (live.windows874) document.getElementById('win874decResult').textContent = renderDecode(sbDecoder(stream, indexes.windows874))
	if (live.macintosh) document.getElementById('macintoshdecResult').textContent = renderDecode(sbDecoder(stream, indexes.macintosh))
	if (live.ibm866) document.getElementById('ibm866decResult').textContent = renderDecode(sbDecoder(stream, indexes.ibm866))
	if (live.xmaccyrillic) document.getElementById('xmaccyrillicdecResult').textContent = renderDecode(sbDecoder(stream, indexes.xmaccyrillic))
	if (live.iso88592) document.getElementById('iso88592decResult').textContent = renderDecode(sbDecoder(stream, indexes.iso88592))
	if (live.iso88593) document.getElementById('iso88593decResult').textContent = renderDecode(sbDecoder(stream, indexes.iso88593))
	if (live.iso88594) document.getElementById('iso88594decResult').textContent = renderDecode(sbDecoder(stream, indexes.iso88594))
	if (live.iso88595) document.getElementById('iso88595decResult').textContent = renderDecode(sbDecoder(stream, indexes.iso88595))
	if (live.iso88596) document.getElementById('iso88596decResult').textContent = renderDecode(sbDecoder(stream, indexes.iso88596))
	if (live.iso88597) document.getElementById('iso88597decResult').textContent = renderDecode(sbDecoder(stream, indexes.iso88597))
	if (live.iso88598) document.getElementById('iso88598decResult').textContent = renderDecode(sbDecoder(stream, indexes.iso88598))
	if (live.iso88598i) document.getElementById('iso88598idecResult').textContent = renderDecode(sbDecoder(stream, indexes.iso88598))
	if (live.iso885910) document.getElementById('iso885910decResult').textContent = renderDecode(sbDecoder(stream, indexes.iso885910))
	if (live.iso885913) document.getElementById('iso885913decResult').textContent = renderDecode(sbDecoder(stream, indexes.iso885913))
	if (live.iso885914) document.getElementById('iso885914decResult').textContent = renderDecode(sbDecoder(stream, indexes.iso885914))
	if (live.iso885915) document.getElementById('iso885915decResult').textContent = renderDecode(sbDecoder(stream, indexes.iso885915))
	if (live.iso885916) document.getElementById('iso885916decResult').textContent = renderDecode(sbDecoder(stream, indexes.iso885916))

	var tests = document.getElementById('decodingcolumn').querySelectorAll('.output')
	for (var t=0;t<tests.length;t++) {
		if (tests[t].textContent.match('�')) tests[t].className = 'output'
		else if (tests[t].childNodes[3].textContent != '') tests[t].className = 'output yes'
		}
	}




var live = { utf8: true, big5: true, eucjp:true, iso2022jp:true, shiftjis:true, euckr: true, gb18030:true, gbk:true, koi8r:false, windows1250:false, windows1251:false, windows1252:true, windows1253:false, windows1254:false, windows1255:false, windows1256:false, windows1257:false, windows1258:false, windows874:false, macintosh:false, ibm866:false, xmaccyrillic:false, iso88592:false, iso88593:false, iso88594:false, iso88595:false, iso88596:false, iso88597:false, iso88598:false, iso88598i:false, iso885910:false, iso885913:false, iso885914:false, iso885915:false, iso885916:false }

export function toggleEnc (enc) {
	var encnode = document.getElementById(enc+'enc')
	var decnode = document.getElementById(enc+'dec')
	if (encnode.style.display == 'none') {
		encnode.style.display = 'block'
		decnode.style.display = 'block'
		live[enc] = true
		}
	else {
		encnode.style.display = 'none'
		decnode.style.display = 'none'
		live[enc] = false
		}
	}

function closeEnc (enc) {
	var encnode = document.getElementById(enc+'enc')
	var decnode = document.getElementById(enc+'dec')
	if (encnode) encnode.style.display = 'none'
	if (decnode) decnode.style.display = 'none'
	document.getElementById(enc).checked = false
	live[enc] = false
	}

function openEnc (enc) {
	var encnode = document.getElementById(enc+'enc')
	var decnode = document.getElementById(enc+'dec')
	if (encnode) encnode.style.display = 'block'
	if (decnode) decnode.style.display = 'block'
	document.getElementById(enc).checked = true
	live[enc] = true
	}

export function closeAll () {
	var tds = document.getElementById('customsettings').querySelectorAll('input')
	for (var e=0;e<tds.length;e++) {
		if (tds[e].id != 'utf8') closeEnc(tds[e].id)
		}
	}

export function selectAll () {
	var tds = document.getElementById('customsettings').querySelectorAll('input')
	for (var e=0;e<tds.length;e++) {
		if (tds[e].id != 'utf8') openEnc(tds[e].id)
		}
	}

export function toggleCustomList () {
	var node = document.getElementById('customsettings')
	if (node.style.display == 'none') node.style.display = 'block'
	else node.style.display = 'none'
	}


export function toggleNotes () {
	var notes = document.getElementById('detailednotes')
	var showNotes = document.getElementById('showNotes')
	if (notes.style.display=='block') {
		notes.style.display='none' 
		showNotes.querySelector('span').textContent='show notes'
		} 
	else {
		notes.style.display='block'
		showNotes.querySelector('span').textContent='hide notes'
		} 
	}

export function toDec (id) {
	document.getElementById('lBytes').value = document.getElementById(id).textContent
	}

export function toEnc (id) {
	document.getElementById('uChar').value = document.getElementById(id).textContent
	}


export function showEncoding (enc) {
	switch (enc) {
		case 'big5': dbdisplay( 'encoding/legacy-mb-tchinese/big5/tools/make-big5-utf8-list'); break
		case 'eucjp': dbdisplay( 'encoding/legacy-mb-japanese/euc-jp/tools/make-eucjp-utf8-list'); break
		case 'iso2022jp': dbdisplay( 'encoding/legacy-mb-japanese/iso-2022-jp/tools/make-iso2022jp-utf8-list'); break
		case 'shiftjis': dbdisplay( 'encoding/legacy-mb-japanese/shift_jis/tools/make-sjis-utf8-list'); break
		case 'euckr': dbdisplay( 'encoding/legacy-mb-korean/euc-kr/tools/make-euckr-utf8-list'); break
		case 'gb18030': dbdisplay( 'encoding/legacy-mb-schinese/gb18030/tools/make-gb18030-utf8-list'); break
		case 'gbk': dbdisplay( 'encoding/legacy-mb-schinese/gbk/tools/make-gbk-utf8-list'); break
		case 'koi8r': sbdisplay(indexes.koi8r); break
		case 'koi8u': sbdisplay(indexes.koi8u); break
		case 'windows1250': sbdisplay(indexes.windows1250); break
		case 'windows1251': sbdisplay(indexes.windows1251); break
		case 'windows1252': sbdisplay(indexes.windows1252); break
		case 'windows1253': sbdisplay(indexes.windows1253); break
		case 'windows1254': sbdisplay(indexes.windows1254); break
		case 'windows1255': sbdisplay(indexes.windows1255); break
		case 'windows1256': sbdisplay(indexes.windows1256); break
		case 'windows1257': sbdisplay(indexes.windows1257); break
		case 'windows1258': sbdisplay(indexes.windows1258); break
		case 'macintosh': sbdisplay(indexes. macintosh); break
		case 'ibm866': sbdisplay(indexes.ibm866); break
		case 'windows874': sbdisplay(indexes.windows874); break
		case 'xmaccyrillic': sbdisplay(indexes.xmaccyrillic); break
		case 'iso88592': sbdisplay(indexes.iso88592); break
		case 'iso88593': sbdisplay(indexes.iso88593); break
		case 'iso88594': sbdisplay(indexes.iso88594); break
		case 'iso88595': sbdisplay(indexes.iso88595); break
		case 'iso88596': sbdisplay(indexes.iso88596); break
		case 'iso88597': sbdisplay(indexes.iso88597); break
		case 'iso88598': sbdisplay(indexes.iso88598); break
		case 'iso88598i': sbdisplay(indexes.iso88598); break // iso-8859-8-i 与 iso-8859-8 共用同一张索引（indexes.iso88598i 并不存在）
		case 'iso885910': sbdisplay(indexes.iso885910); break
		case 'iso885913': sbdisplay(indexes.iso885913); break
		case 'iso885914': sbdisplay(indexes.iso885914); break
		case 'iso885915': sbdisplay(indexes.iso885915); break
		case 'iso885916': sbdisplay(indexes.iso885916); break
		}
	}


function sbdisplay (enc) {
	// opens the character list tool in another window to display the characters in the encoding
	
	var characters = ''
	for (var i=0;i<enc.length;i++) {
		characters += String.fromCodePoint(enc[i])
		}
	var charDisplay = window.open('https://r12a.github.io/apps/listcharacters?chars='+encodeURIComponent(characters), 'charDisplay')
	charDisplay.focus()
	}


function dbdisplay (url) {
	// opens the character list tool in another window to display the characters in the encoding
	
	var charDisplay = window.open('http://www.w3.org/International/tests/repo/'+url, 'charDisplay')
	charDisplay.focus()
	}