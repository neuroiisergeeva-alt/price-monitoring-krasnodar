import {GROUPS,POGONAZH_GROUPS,wood,inUnit,type PriceItem} from './prices';
export const MONITOR_GROUPS=[...GROUPS.map(g=>g[0]).filter(g=>!POGONAZH_GROUPS.includes(g)),'Лиственница','Вагонка осина','Погонаж'];
export function monitoringGroup(p:PriceItem){if(POGONAZH_GROUPS.includes(p.group))return 'Погонаж';if(p.group==='Евровагонка'&&p.wood==='осина')return 'Вагонка осина';return p.group==='Брусок строганый'&&p.wood==='лиственница'?'Лиственница':p.group;}
// User-selected rows on 08.10.2026. Preserve source observations, exclude them
// from the report on every read so a scheduled refresh cannot restore them.
export function excludedFromMonitoring(p:PriceItem){
 if(p.seller!=='ours'||p.group!=='Брусок строганый'||p.wood!=='ель/сосна')return false;
 const regular=!p.promo&&p.length===0&&['AB','BC'].includes(p.grade)&&((p.thickness===30&&[45,50,70].includes(p.width))||(p.thickness===50&&p.width===80));
 const promotional=p.promo&&p.thickness===45&&p.width===50&&p.grade==='AB'&&[2,4].includes(p.length);
 return regular||promotional;
}
export function monitoringItem(p:PriceItem){
 if(p.seller==='les'&&p.sourceKind==='file')p={...p,wood:wood(p.title)};
 // Keep rawPrice/rawUnit and identity for provenance and weekly history.
 return ((p.group==='Брусок строганый'&&p.unit==='м²')||(POGONAZH_GROUPS.includes(p.group)&&p.unit!=='пог. м'))?inUnit(p,'пог. м'):p;
}
export function monitoringItems(items:PriceItem[]){return items.filter(p=>!excludedFromMonitoring(p)).map(monitoringItem);}
