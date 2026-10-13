import {dims,grade,wood,groupOf,construction,edge,strip,normalizePrice,type PriceItem} from './prices';
export const DOM_ORIGIN='https://krasnodar.domstroiekb.ru';
const base=DOM_ORIGIN+'/services/pilomaterialyi_i_listovyie_materialyi/';
export const DOM_SOURCES=[...['imitaciya_brusa/','evrovagonka/','vagonka/','vagonka-shtil/','blok_haus/','doska_pola/','evrovagonka/sosna','evrovagonka/osina','evrovagonka/listvennica','evrovagonka/lipa_optom','kedr/','polok/'].map(s=>({group:'Каталог ДомСтрой',url:base+s})),{group:'Каталог ДомСтрой',url:DOM_ORIGIN+'/services/pogonazh/'},{group:'Каталог ДомСтрой',url:DOM_ORIGIN+'/services/stenovye-paneli-iz-lipy/balyasina_stolbyi_perila/'}];
export type DomPage={url:string;tables:string[][][];complete?:boolean;reason?:string};
const num=(s:string)=>{s=s.replace(/[\s\u00a0]/g,'');if(/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s))s=s.replace(/,/g,'');else s=s.replace(',','.');return /^\d+(\.\d+)?$/.test(s)?+s:NaN;};
export function domTables(html:string){return Array.from(html.matchAll(/<table\b[^>]*class=["'][^"']*tablepress[^"']*["'][^>]*>([\s\S]*?)<\/table>/gi)).map(t=>Array.from(t[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map(r=>Array.from(r[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)).map(c=>strip(c[1]))));}
export function parseDomPage(page:DomPage,at:string):PriceItem[]{
 if(!DOM_SOURCES.some(s=>s.url===page.url))throw Error('Источник ДомСтрой не подключен');
 const out:PriceItem[]=[];const occurrences=new Map<string,number>();
 for(const table of page.tables){const hi=table.findIndex(r=>r.some(c=>/наименование/i.test(c)));if(hi<0)continue;const h=table[hi].map(s=>s.replace(/\s+/g,' '));const context=table.slice(0,hi).flat().join(' ');
 const nameIdx=h.findIndex(c=>/наименование/i.test(c)),sizeIdx=h.findIndex(c=>/размер/i.test(c)&&!(/наименование/i.test(c))),gradeIdx=h.findIndex(c=>/^сорт$/i.test(c));
 const areaIdx=h.findIndex(c=>/стоим.*м[²2]/i.test(c)&&!/уп/.test(c)),linearIdx=h.findIndex(c=>/стоим.*пог|стоим.*п\.м/i.test(c)),packIdx=h.findIndex(c=>/кол.*шт/i.test(c)),packPriceIdx=h.findIndex(c=>/стоим.*уп/i.test(c)),pieceIdx=h.findIndex(c=>/стоим.*шт/i.test(c)),priceIdx=h.findIndex(c=>/^цена/i.test(c));
 for(let ri=hi+1;ri<table.length;ri++){const cells=table[ri],name=cells[nameIdx]||'';if(!name||/термо|импрегн|крашен/i.test(name))continue;
 const sourceTitle=[name,gradeIdx>=0?'сорт '+cells[gradeIdx]:'',sizeIdx>=0?cells[sizeIdx]:'',context].filter(Boolean).join(' ');let group=groupOf(sourceTitle);if(!group&&/галтель/i.test(name))group='Плинтус';if(!group&&/перила/i.test(name))group='Поручни';if(!group&&/столб начальный/i.test(name))group='Столбы для лестниц';if(!group)continue;
 const sizeText=sizeIdx>=0?cells[sizeIdx]||'':'';const geometry=dims(sizeText)||dims(name);const pair=(/\d\s*[хx×*]\s*\d/i.test(sizeText)?sizeText:name).match(/(\d+(?:[.,]\d+)?)\s*[хx×*]\s*(\d+(?:[.,]\d+)?)/i);
 if(!geometry&&!pair)continue;const t=geometry?.[0]||+(pair![1].replace(',','.')),w=geometry?.[1]||+(pair![2].replace(',','.'));
 const lengths=geometry?[geometry[2]]:Array.from((cells.find(c=>/^длины\s*:/i.test(c))||cells[h.findIndex(c=>/^длины/i.test(c))]||'').matchAll(/(\d+[.,]\d+)\s*м?/g)).map(m=>+(m[1].replace(',','.')));if(!lengths.length)lengths.push(0);
 const rawUnit:PriceItem['unit']|null=areaIdx>=0?'м²':linearIdx>=0?'пог. м':priceIdx>=0&&/шт/i.test(name)?'шт.':null;
 const pi=areaIdx>=0?areaIdx:linearIdx>=0?linearIdx:priceIdx;let rawPrice=pi>=0?num(cells[pi]||''):NaN;let unit:string=rawUnit||'';
 const pack=packIdx>=0?num(cells[packIdx]||''):1;
 if(!(rawPrice>0)&&packPriceIdx>=0&&num(cells[packPriceIdx]||'')>0&&pack>0){rawPrice=num(cells[packPriceIdx]);unit='уп.';}
 if(!(rawPrice>0)&&pieceIdx>=0&&num(cells[pieceIdx]||'')>0){rawPrice=num(cells[pieceIdx]);unit='шт.';}
 if(!(rawPrice>0)||!unit)continue;
 const g=grade(sourceTitle.match(/сорт\s+([А-ЯA-Z]+(?:\/[А-ЯA-Z]+)?)/i)?.[1]||sourceTitle.match(/(?:лиственница|кедр)\s+(АВ|AB|ВС|BC|А|A|В|B)(?:\s|$)/i)?.[1]||'НЕ УКАЗАН');
 let species=wood(sourceTitle);if(species==='ель'&&!/(?:^|[^а-я])ель(?:$|[^а-я])/i.test(sourceTitle))species='не указана';const notes=['Цена опубликована на краснодарской версии сайта; дата публикации таблицы не указана. Сайт предупреждает, что цены могут отличаться от актуального прайса.'];
 for(const l of Array.from(new Set(lengths))){const title=sourceTitle+(geometry?'':` × ${l||'длина не указана'} м`);const pp=packPriceIdx>=0?num(cells[packPriceIdx]||''):NaN;const area=pack*l*w/1000;if(unit==='м²'&&pp>0&&area>0&&Math.abs(pp/area/rawPrice-1)>.015)notes.push(`Цена за м² и упаковку расходятся: в таблице ${rawPrice} ₽/м²; упаковка ${pp} ₽ / ${pack} шт. / ${l} м / ${w/1000} м = ${(pp/area).toFixed(2)} ₽/м². Использована колонка розницы за м².`);
 const target=unit==='уп.'?'м²':unit as PriceItem['unit'];const baseId='dom:'+encodeURIComponent(page.url+'|'+title+'|'+(pack||1));const occurrence=occurrences.get(baseId)||0;occurrences.set(baseId,occurrence+1);try{const normalized=normalizePrice(rawPrice,unit,pack||1,t,w,l,target);out.push({seller:'dom',group,itemId:occurrence?baseId+':offer-'+occurrence:baseId,title,url:page.url,thickness:t,width:w,length:l,grade:g,wood:species,unit:target,...normalized,rawPrice,rawUnit:unit,pack:pack||1,stock:'Наличие на сайте не подтверждено',at,promo:false,edge:edge(title),construction:construction(title,group),sourceNotes:[...notes],sourceRow:cells});}catch{}}
 }
 }
 return out;
}
const building=(g:string)=>/^(ABC|BC|C|СТРОИТЕЛЬНЫЙ)$/.test(grade(g));
export function domGradeMatches(ours:string,theirs:string){const a=grade(ours),b=grade(theirs);return !['НЕ УКАЗАН','—',''].includes(a)&&!['НЕ УКАЗАН','—',''].includes(b)&&(a===b||building(a)&&building(b));}
export function domNotes(o:PriceItem,p:PriceItem):string[]|null{
 if(p.seller!=='dom'||p.fromPrice||p.unitAmbiguous)return null;const boardSheet=p.sourceKind==='file'&&p.fileSheet==='Доска, бруски';const railAlias=boardSheet&&p.fileRow===23&&o.group==='Рейка строганая'&&o.thickness===20&&o.width===40&&p.length===3;
 if(o.group!==p.group&&!railAlias)return null;const notes:string[]=[];
 const planedAlias=boardSheet&&o.group==='Доска строганая'&&p.group===o.group&&o.thickness===p.thickness&&((o.thickness===45&&((o.width===95&&p.width===90)||(o.width===145&&p.width===140)||(o.width===195&&p.width===190)))||(o.thickness===20&&o.width===96&&p.width===90));
 const alias=o.group==='Имитация бруса'&&((o.thickness===16&&p.thickness===16&&o.width===146&&p.width===143)||(o.thickness===20&&p.thickness===21&&[195,196].includes(o.width)&&p.width===193));
 const floorAlias=o.group==='Доска пола'&&[28,36].includes(o.thickness)&&o.thickness===p.thickness&&o.width===145&&p.width===143;
 const liningAlias=o.group==='Вагонка Штиль'&&((o.thickness===13&&p.thickness===13&&o.width===122&&p.width===116)||(o.thickness===14&&p.thickness===13&&[145,146].includes(o.width)&&p.width===145));
 const floorLengthTransfer=floorAlias&&o.grade==='AB'&&p.grade==='AB'&&o.length===6&&p.length===4&&o.unit==='м²';
 if(!alias&&!floorAlias&&!liningAlias&&!planedAlias&&!railAlias&&(o.thickness!==p.thickness||o.width!==p.width))return null;
 if(alias||floorAlias||liningAlias)notes.push(`Соответствие пользователя: наш ${o.group} ${o.thickness}×${o.width} ↔ ДомСтрой ${p.thickness}×${p.width}; сорт и длина проверяются отдельно, пересчет по реальным размерам конкурента`);
 if(floorLengthTransfer)notes.push('Особое правило пользователя для доски пола АВ: цену за м² предложения длиной4м применяем к нашей6м. Исходная длина4м сохранена; это перенос цены, не предложение6м.');
 if(planedAlias)notes.push(`Соответствие пользователя: наша строганая ${o.thickness}×${o.width} ↔ ${p.thickness}×${p.width} ДомСтроя`);
 if(railAlias)notes.push('Соответствие пользователя: Брусок45(40)×20×3000 ↔ наша рейка20×40; исходное название сохранено.');
 if(boardSheet)notes.push('Сухое антисептированное изделие допускается по правилу пользователя; обработка отличается от обычной доски/рейки.');
 const effectiveGrade=boardSheet&&p.grade==='A/B'?'AB':p.grade;if(effectiveGrade!==p.grade)notes.push('А/В в этой вкладке принимаем как наш АВ по отдельному подтверждению пользователя');
 if(o.grade==='НЕ УКАЗАН'||o.grade==='—'||p.grade==='НЕ УКАЗАН')return null;
 if(!domGradeMatches(o.grade,effectiveGrade))return null;
 if(building(o.grade)&&building(p.grade))notes.push(`Сорт С/ВС/АВС ДомСтроя соответствует нашему ВС/АВС/строительному: у нас ${o.grade}, у конкурента ${p.grade}. Исходные сорта сохранены.`);
 if(o.wood!==p.wood){if(o.wood==='ель/сосна'&&['ель','сосна'].includes(p.wood))notes.push(`Наш ель/сосна ↔ ${p.wood} ДомСтроя`);else return null;}
 if(o.length>0&&o.length!==p.length&&!floorLengthTransfer)return null;
 if(o.lengthMin&&(p.length<o.lengthMin||p.length>(o.lengthMax||o.lengthMin)))return null;
 if(!o.length&&!o.lengthMin)notes.push(`У нас длина не указана; ДомСтрой ${p.length||'не указана'} м`);
 if((o.edge||'обычный')!==(p.edge||'обычный'))return null;
 if(['Брусок строганый','Рейка строганая'].includes(o.group)&&p.construction==='сращенная')return null;
 if(['цельноламельная','сращенная'].includes(o.construction||'')&&o.construction!==p.construction)return null;
 if(/щит|Ступени|Подоконники|Тетива/.test(o.group))notes.push(`Склейка ДомСтроя: ${p.construction}; если у нас не указан вид, требуется проверка`);
 return [...notes,...(p.sourceNotes||[])];
}
export function domNear(o:PriceItem,p:PriceItem){if(p.seller!=='dom'||o.group!==p.group||domNotes(o,p)!==null)return false;if(o.wood!==p.wood&&!(o.wood==='ель/сосна'&&['сосна','ель','не указана'].includes(p.wood)))return false;if(o.length>0&&p.length>0&&o.length!==p.length)return false;if(o.lengthMin&&p.length>0&&(p.length<o.lengthMin||p.length>(o.lengthMax||o.lengthMin)))return false;return (!o.thickness||Math.abs(o.thickness-p.thickness)<=Math.max(2,o.thickness*.1))&&Math.abs(o.width-p.width)<=Math.max(p.fileSheet==='Доска, бруски'?12:8,o.width*.05);}
export function domInUnit(o:PriceItem,p:PriceItem):PriceItem{if(p.unitAmbiguous)throw Error('Единицу цены нужно уточнить');return {...p,unit:o.unit,...normalizePrice(p.rawPrice,p.rawUnit,p.pack,p.thickness,p.width,p.length,o.unit)};}
