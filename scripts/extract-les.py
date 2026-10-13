import sys,openpyxl,re,json
book=openpyxl.load_workbook(sys.argv[1],data_only=True);s=book.active
out=[];section='';unit='';wc=None;rc=None;publication=None
for rr in s:
 vals=[str(c.value or '').strip() for c in rr];n=rr[0].row;b=vals[1] if len(vals)>1 else ''
 for v in vals:
  m=re.search(r'(?:прайс|цены|дата).*?(\d{2})[.](\d{2})[.](20\d{2})',v,re.I)
  if m:publication=f'{m[3]}-{m[2]}-{m[1]}'
 if b and not re.search(r'\d\s*\*',b) and not re.search('толщина|Наименование',b,re.I):section=b;unit='';wc=None;rc=None
 for i,v in enumerate(vals):
  if v.lower()=='оптовая':wc=i
  if v.lower() in ['розничная','розница']:rc=i
  if 'руб./' in v.replace(' ',''):
   u=v.replace(' ','').split('руб./')[-1];unit='м²' if 'м2' in u or 'м²' in u else 'пог. м' if 'пог' in u else 'шт.' if 'шт' in u else 'м³' if 'м3' in u or 'м³' in u else ''
 if not re.search(r'\d\s*\*',b) or not unit or wc is None or rc is None:continue
 def num(v):
  try:return float(v.replace('\xa0','').replace(' ','').replace(',','.'))
  except:return None
 retail=num(vals[rc]);wholesale=num(vals[wc])
 if not retail:continue
 m=re.search(r'(\d+(?:[.,]\d+)?)\s*\*\s*(\d+(?:[.,]\d+)?)\s*\*\s*([\d /]+)',b)
 if not m:continue
 for length in re.findall(r'\d+',m[3]):
  head=section
  if 'Рейка' in section and 'Брусок' in section:head=('Рейка строганая' if float(m[1].replace(',','.'))<30 else 'Брусок строганый')+(' сращенный' if 'сращ' in section else '')+', '+section.split(',')[-1]
  if 'Наличник, Плинтус' in section:head=re.split(r'\d',b)[0]+(' сращенный' if 'сращ' in section else '')+', '+section.split(',')[-1]
  head=head.replace('Ступень,','Ступени,').replace('Блок - хаус','Блок-хаус').replace('Террасная доска "Палубная"','Палубная доска')
  out.append(dict(title=f'{head} {m[1]}*{m[2]}*{length} сорт {vals[6]} Производитель {vals[9]}',retail=retail,wholesale=wholesale,unit=unit,row=n))
if not publication:raise ValueError('В ячейках не найдена дата публикации прайса; имя файла не используется как дата')
if not out:raise ValueError('Колонки розничная/оптовая и единицы не распознаны')
json.dump({'sourceDate':publication,'rows':out},open(sys.argv[2],'w'),ensure_ascii=False)
