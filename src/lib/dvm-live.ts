import {strip,number} from './prices';
import {parseDvmRows,type DvmRow} from './dvm';
export function dvmHtml(html:string,url:string,at:string){const title=strip(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'');const text=strip(html);const match=text.match(/([\d\s]+(?:[,.]\d+)?)\s*₽\s*\/\s*м[³3]/);if(!title||!match)return[];const rawPrice=number(match[1]);
 const common={title,url,grade:'НЕ УКАЗАН',wood:'ель/сосна',rawPrice,rawUnit:'м³',stock:/Есть в наличии/i.test(text)?'Есть в наличии':'Наличие не указано'};
 let rows:DvmRow[]=[];
 if(url.includes('brus-kleenyy'))rows=[{...common,group:'Клеёный брус',thickness:0,width:0,length:0,lengthMin:2,lengthMax:6,genericSection:true,thicknessMin:90,thicknessMax:150,widthMin:150,widthMax:600}];
 if(url.includes('lunnyy-paz'))rows=[95,115].map(width=>({...common,group:'Профилированный брус «Лунный паз»',thickness:42,width,length:0}));
 return parseDvmRows(rows,at);
}
