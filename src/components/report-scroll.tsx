'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
export function ReportScroll({children}:{children:ReactNode}){
 const root=useRef<HTMLDivElement>(null);const [position,setPosition]=useState(0),[maximum,setMaximum]=useState(0);
 useEffect(()=>{const viewport=root.current?.querySelector<HTMLElement>('[data-slot="table-container"]');const table=viewport?.querySelector('table');if(!viewport||!table)return;
 const headers=table.querySelectorAll<HTMLElement>('thead .col-product,thead .col-unit,thead .col-ours');
 const measureFrozen=()=>{const product=table.querySelector<HTMLElement>('thead .col-product'),unit=table.querySelector<HTMLElement>('thead .col-unit');const productWidth=product?.getBoundingClientRect().width||0,unitWidth=unit?.getBoundingClientRect().width||0;table.style.setProperty('--frozen-unit-left',productWidth+'px');table.style.setProperty('--frozen-ours-left',(productWidth+unitWidth)+'px');};
 const update=()=>{setMaximum(Math.max(0,viewport.scrollWidth-viewport.clientWidth));setPosition(viewport.scrollLeft);};const observer=new ResizeObserver(()=>{measureFrozen();update();});observer.observe(viewport);observer.observe(table);headers.forEach(h=>observer.observe(h));measureFrozen();viewport.addEventListener('scroll',update,{passive:true});update();return()=>{observer.disconnect();viewport.removeEventListener('scroll',update);};},[children]);
 function move(value:number){const viewport=root.current?.querySelector<HTMLElement>('[data-slot="table-container"]');if(viewport)viewport.scrollLeft=value;}
 return <div className="report-scroll" ref={root}><div className="scroll-controls"><span>{maximum>0?'Прокрутка таблицы':'Все выбранные колонки помещаются'}</span><button onClick={()=>move(position-350)} disabled={position<=0} aria-label="Прокрутить таблицу влево">Влево</button><input aria-label="Горизонтальная прокрутка таблицы" type="range" min={0} max={Math.max(maximum,1)} value={Math.min(position,Math.max(maximum,1))} onChange={e=>move(+e.target.value)} disabled={maximum===0}/><button onClick={()=>move(position+350)} disabled={position>=maximum} aria-label="Прокрутить таблицу вправо">Вправо</button></div>{children}</div>;
}
