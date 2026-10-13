import {dims,grade,wood,groupOf,construction,edge,strip,decode,normalizePrice,type PriceItem} from './prices';
export const TECH_ORIGIN='https://krn.texnodrev.ru';
export const TECH_CATALOG=TECH_ORIGIN+'/store/catalog/derevo_1/';
export const TECH_SOURCES=[{group:'Каталог Технодрев',url:TECH_CATALOG}];
export const TECH_PROFILE=TECH_ORIGIN+'/katalog/derevo/profili/skandinavskiy-profil/skandinavskiy-profil-sosna-el-20kh146-mm/';
export type TechPage={url:string;html:string;complete?:boolean;reason?:string};
export function techUrl(url:string){try{const u=new URL(url);return u.origin===TECH_ORIGIN&&u.pathname.startsWith('/store/catalog/derevo_1/')&&!u.search&&!u.hash&&u.pathname!==new URL(TECH_CATALOG).pathname;}catch{return false;}}
export function techProductLinks(html:string){return [...new Set(Array.from(html.matchAll(/href=["'](\/store\/catalog\/derevo_1\/[^"']+\/)["']\s+title=/gi)).map(m=>TECH_ORIGIN+decode(m[1])))];}
export function techPagination(html:string){return [...new Set(Array.from(html.matchAll(/href=["']([^"']*\?PAGEN_1=\d+)["']/gi)).map(m=>new URL(decode(m[1]),TECH_CATALOG).href).filter(u=>new URL(u).pathname===new URL(TECH_CATALOG).pathname))];}
const number=(s:string)=>+s.replace(/[^\d.,]/g,'').replace(',','.');
export function parseTechPage(page:TechPage,at:string):PriceItem[]{
 if(!techUrl(page.url))throw Error('Неизвестный источник Технодрев');
 const html=page.html,title=strip(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'');
 let group=groupOf(title);if(/щит мебельный/i.test(title))group='Мебельный щит';if(/строган+ая доска/i.test(title))group='Доска строганая';if(/террасная доска/i.test(title)&&!group)group='Террасная доска (профиль не указан)';if(/вагонка софт/i.test(title)&&!group)group='Вагонка Софт-лайн';if(/скандинавск/i.test(title))group='Скандинавская доска';if(!group&&/брус.*сращ/i.test(title))return [];if(!group&&/брус.*строган/i.test(title))group='Брусок строганый';if(!group&&/брусок|рейка/i.test(title))group=/рейка/i.test(title)?'Рейка строганая':'Брусок строганый';
 const d=dims(title);if(!group||!d)return [];
 const head=html.slice(html.indexOf('<h1'),html.indexOf('<h1')+15000);
 const quote=head.match(/<span class="number">([\s\S]*?)<\/span>\s*<\/span>/i)?.[1]||'';
 const text=strip(quote),unit:PriceItem['unit']|null=/\/\s*м[²2]/i.test(text)?'м²':/\/\s*пог/i.test(text)?'пог. м':/\/\s*м[³3]/i.test(text)?'м³':null;
 const piece=head.match(/class="product-item-detail-price-current[^>]*>([\s\S]*?)<\/div>/i)?.[1];
 const piecePrice=piece?number(strip(piece)):0;
 let rawUnit:string=unit||'шт.',rawPrice=unit?number(text.split('/')[0]):piecePrice;
 // The explicit unit quote avoids rounding a displayed piece price back to area.
 if(!(rawPrice>0)||(!unit&&!(piecePrice>0&&(/class="piece">\s*\/шт/i.test(head)||/_quant_measure["'][^>]*>\s*шт/i.test(head)))))return [];
 const target=unit||'шт.';const g=grade(title.match(/сорт\s+([А-ЯA-Z0-9]+(?:\/[А-ЯA-Z]+)?)/i)?.[1]||'НЕ УКАЗАН');
 let species=wood(title);if(species==='ель'&&!/(?:^|[^а-я])ель(?:$|[^а-я])/i.test(title))species='не указана';
 const notes=['Краснодарская версия интернет-магазина Технодрев. Дата публикации цены не указана.'];
 if(unit&&piecePrice>0)notes.push(`Также опубликовано ${piecePrice} ₽/шт.; для расчета взята явная цена ${rawPrice} ₽/${unit}, чтобы не переносить округление цены штуки.`);
 const pack=+(title.match(/упак[^\d]*(\d+)\s*шт/i)?.[1]||'1');
 return [{seller:'tech',group,itemId:'tech:'+page.url,title,url:page.url,thickness:d[0],width:d[1],length:d[2],grade:g,wood:species,unit:target,...normalizePrice(rawPrice,rawUnit,1,...d as [number,number,number],target),rawPrice,rawUnit,pack,stock:strip(head.match(/class="product-card_available">([\s\S]*?)<\/span>\s*<\/span>/i)?.[1]||'Наличие не подтверждено'),at,promo:/product-card_old-price/.test(head),edge:edge(title),construction:construction(title,group),sourceNotes:notes,sourceRow:[title,text,piecePrice?`${piecePrice} ₽/шт.`:''],sourceUrl:TECH_CATALOG}];
}
const building=(s:string)=>/^(ABC|BC|C|СТРОИТЕЛЬНЫЙ)$/.test(grade(s));
export function techNotes(o:PriceItem,p:PriceItem):string[]|null{
 if(p.seller!=='tech'||p.fromPrice||p.unitAmbiguous||o.group!==p.group)return null;
 const scandinavianAlias=o.group==='Скандинавская доска'&&o.thickness===21&&o.width===146&&p.thickness===20&&p.width===146;
 if(!scandinavianAlias&&(o.thickness!==p.thickness||o.width!==p.width))return null;
 if(!o.grade||!p.grade||['НЕ УКАЗАН','—'].includes(o.grade)||['НЕ УКАЗАН','—'].includes(p.grade)||!(o.grade===p.grade||building(o.grade)&&building(p.grade)))return null;
 if(o.wood!==p.wood&&!(o.wood==='ель/сосна'&&['ель','сосна'].includes(p.wood)))return null;
 if(o.length>0&&o.length!==p.length)return null;
 if(o.lengthMin&&(p.length<o.lengthMin||p.length>(o.lengthMax||o.lengthMin)))return null;
 if((o.edge||'обычный')!==(p.edge||'обычный'))return null;
 if(['Брусок строганый','Рейка строганая'].includes(o.group)&&p.construction==='сращенная')return null;
 if(['цельноламельная','сращенная'].includes(o.construction||'')&&o.construction!==p.construction)return null;
 const notes=[...(p.sourceNotes||[])];if(scandinavianAlias)notes.push('Соответствие пользователя от13.10.2026: наша скандинавская доска21×146 ↔ скандинавский профиль Технодрев20×146. Сорт и длина проверяются отдельно; пересчет по реальному сечению конкурента.');if(!o.length&&!o.lengthMin)notes.push(`У нас длина не указана; Технодрев ${p.length} м`);
 if(o.grade!==p.grade)notes.push(`Строительные сорта: наш ${o.grade} ↔ ${p.grade} Технодрев`);
 if(o.wood!==p.wood)notes.push(`Наш ель/сосна ↔ ${p.wood}`);
 if(/щит|Ступени|Подоконники|Тетива|Клеёный/.test(o.group))notes.push(`Вид склейки Технодрев: ${p.construction}; если у нас не указан, требуется проверка.`);
 return notes;
}
export function techNear(o:PriceItem,p:PriceItem){return p.seller==='tech'&&o.group===p.group&&techNotes(o,p)===null&&(o.wood===p.wood||o.wood==='ель/сосна'&&['ель','сосна'].includes(p.wood))&&Math.abs(o.thickness-p.thickness)<=2&&Math.abs(o.width-p.width)<=8&&(!o.length||o.length===p.length);}
export function techInUnit(o:PriceItem,p:PriceItem):PriceItem{return {...p,unit:o.unit,...normalizePrice(p.rawPrice,p.rawUnit,p.pack,p.thickness,p.width,p.length,o.unit)};}
