import {normalizePrice,type PriceItem} from './prices';
export const DVM_ORIGIN='https://les-dvm.ru';
export const DVM_SOURCES=[DVM_ORIGIN+'/documents/',DVM_ORIGIN+'/catalog/khvoynye-porody-/',DVM_ORIGIN+'/catalog/khvoynye-porody-/?PAGEN_1=2',DVM_ORIGIN+'/catalog/doska-sukhaya-strogannaya/'];
const build=(g:string)=>/^(ABC|BC|C|СТРОИТЕЛЬНЫЙ)$/.test(g);
export function dvmNotes(o:PriceItem,l:PriceItem):string[]|null{
 if(l.seller!=='dvm'||l.fromPrice)return null;
 const notes:string[]=[];
 const mountedAB=l.group==='Брусок строганый'&&l.sourceKind==='file'&&l.grade==='НЕ УКАЗАН';
 const effectiveGrade=mountedAB?'AB':l.grade;
 if(mountedAB)notes.push('Монтажный брусок: сорт не указан в PDF, принимаем АВ по правилу пользователя');
 if(l.group==='Имитация бруса'&&build(l.grade)&&![3,6].includes(o.length))return null;
 const bars=['Брусок строганый','Рейка строганая'].includes(o.group)&&l.group==='Брусок строганый';
 if(o.group!==l.group&&!bars)return null;
 if(o.wood!==l.wood&&!(o.wood==='ель/сосна'&&['сосна','ель'].includes(l.wood)))return null;
 let geometry=o.thickness===l.thickness&&o.width===l.width;
 if(o.group==='Имитация бруса'&&o.thickness===20&&l.thickness===20&&(([145,146].includes(o.width)&&l.width===140)||([195,196].includes(o.width)&&l.width===190))){geometry=true;notes.push(`Соответствие пользователя: наша ширина ${o.width} мм ↔ ${l.width} мм конкурента`);}
 if(o.group.startsWith('Планкен')&&o.thickness===20&&l.thickness===20&&((o.width===96&&l.width===90)||(o.width===120&&l.width===110)||(o.width===145&&l.width===140))){geometry=true;notes.push(`Соответствие пользователя для планкена: наша ширина ${o.width} мм ↔ ${l.width} мм конкурента`);}
 if(bars&&o.thickness===l.width&&o.width===l.thickness){geometry=true;notes.push('Прямоугольное сечение совпадает после поворота; профиль конкурента не указан');}
 if(o.group==='Профилированный брус «Лунный паз»'&&o.thickness===45&&o.width===96&&l.thickness===44&&l.width===95){geometry=true;notes.push('Похожий профиль «Лунный паз»: наш45×96 ↔44×95 в PDF; размеры отличаются, это ориентир');}
 if(l.genericSection){if(!(o.thickness>0&&o.width>0))return null;geometry=true;notes.push(`Расчет стоимости по НАШЕМУ сечению ${o.thickness}×${o.width}; наличие этого сечения не подтверждено. В прайсе диапазон90–150 /150–600 мм`);}
 if(!geometry)return null;
 if(l.length>0&&o.length>0&&l.length!==o.length)return null;
 if(l.lengthMin&&o.length>0&&(o.length<l.lengthMin||o.length>(l.lengthMax||l.lengthMin)))return null;
 if(o.lengthMin&&l.length>0&&(l.length<o.lengthMin||l.length>(o.lengthMax||o.lengthMin)))return null;
 if(o.lengthMin&&l.lengthMin&&Math.max(o.lengthMin,l.lengthMin)>Math.min(o.lengthMax||o.lengthMin,l.lengthMax||l.lengthMin))return null;
 if(effectiveGrade==='НЕ УКАЗАН')notes.push(`Сорт конкурента не указан; наш ${o.grade}. Ценовой ориентир, сорт не подтвержден`);
 else if(o.grade!==effectiveGrade){if(build(o.grade)&&build(effectiveGrade))notes.push('2 сорт конкурента ↔ наш строительный АВС/ВС/С по правилу пользователя');else return null;}
 if(l.lengthMin!==l.lengthMax)notes.push(l.lengthMin?`Цена опубликована для длины ${l.lengthMin}–${l.lengthMax} м`:'Длина конкурента не указана');
 notes.push(l.taxBasis||'Налоговая база цены сайта не указана');
 return notes;
}
export function dvmConfirmed(o:PriceItem,l:PriceItem){return dvmNotes(o,l)!==null&&(l.grade!=='НЕ УКАЗАН'||l.group==='Брусок строганый'&&l.sourceKind==='file')&&!l.genericSection&&!(o.group==='Профилированный брус «Лунный паз»');}
export function dvmInUnit(o:PriceItem,l:PriceItem):PriceItem{
 const t=l.genericSection?o.thickness:l.thickness,w=l.genericSection?o.width:l.width;
 const length=o.length||l.length||l.lengthMin||o.lengthMin||1;
 return {...l,unit:o.unit,...normalizePrice(l.rawPrice,l.rawUnit,l.pack,t,w,length,o.unit)};
}
export type DvmRow={group:string;title:string;thickness:number;width:number;length:number;lengthMin?:number;lengthMax?:number;grade:string;wood:string;rawPrice:number;rawUnit:string;genericSection?:boolean;thicknessMin?:number;thicknessMax?:number;widthMin?:number;widthMax?:number;url?:string;fromPrice?:boolean;stock?:string};
export function parseDvmRows(rows:DvmRow[],at:string,sourceDate?:string,fileName?:string):PriceItem[]{return rows.flatMap(r=>{
 if(!Number.isFinite(r.rawPrice)||r.rawPrice<=0||!['м²','м³','пог. м','шт.'].includes(r.rawUnit)||r.thickness<0||r.width<0||r.length<0)return [];
 const url=r.url||DVM_ORIGIN+'/documents/';if(new URL(url).origin!==DVM_ORIGIN)return [];
 const id=[r.group,r.thickness,r.width,r.grade,r.wood,r.length,r.lengthMin,r.lengthMax].join(':');
 return [{...r,seller:'dvm' as const,itemId:`dvm:${sourceDate?'pdf':'web'}:${id}`,url,unit:r.rawUnit as PriceItem['unit'],price:r.rawPrice,pack:1,stock:r.stock||'Наличие требует проверки',formula:`${r.rawPrice} ₽/${r.rawUnit} — исходная цена ${sourceDate?'PDF':'сайта'}`,at,promo:false,sourceKind:sourceDate?'file' as const:undefined,sourceDate,fileName,taxBasis:sourceDate?'Без НДС — как указано в PDF':'Налоговая база сайта не указана',construction:r.group==='Клеёный брус'||r.group==='Клеёная балка'?'клеёная':'не указана'}];
 });}
export const DVM_WEB_SOURCES=[{group:'Клеёный брус',url:DVM_ORIGIN+'/catalog/detail/brus-kleenyy-konstruktsionnyy-khvoy-90-150-150-600/'},{group:'Профилированный брус «Лунный паз»',url:DVM_ORIGIN+'/catalog/detail/lunnyy-paz-khvoya-42kh95-115/'}];
