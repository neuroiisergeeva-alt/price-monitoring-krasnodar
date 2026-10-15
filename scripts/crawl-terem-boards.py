import urllib.request,urllib.parse,re,html,json,pathlib,time,concurrent.futures
ROOT='https://terem-krym.ru';FOLDER=pathlib.Path('.tmp');FOLDER.mkdir(exist_ok=True)
roots=[ROOT+'/catalog/doska_strogannaya',ROOT+'/catalog/planken',ROOT+'/index.php?route=product/search&search='+urllib.parse.quote('Доска сухая'),ROOT+'/index.php?route=product/search&search='+urllib.parse.quote('Планкен')]
def read(u):
 for n in range(2):
  try:
   r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=25);return {'url':u,'html':r.read().decode(),'complete':True,'at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
  except Exception as e:err=str(e)
 return {'url':u,'error':err,'complete':False}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:first=list(ex.map(read,roots))
pages=[];tasks=[]
for p in first:
 p['sourceUrl']=p['url'];pages.append(p);ns=[int(n) for n in re.findall(r'[?&](?:amp;)?page=(\d+)',p.get('html',''))]
 tasks += [((p['url']+'&page='+str(n) if '?' in p['url'] else p['url'].rstrip('/')+'/?page='+str(n)),p['url']) for n in range(2,max(ns,default=1)+1)]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
 for p,t in zip(ex.map(read,[t[0] for t in tasks]),tasks):p['sourceUrl']=t[1];pages.append(p)
links=set()
for p in pages:
 for u,t in re.findall(r'class=["\']product-thumb__name["\'][^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',p.get('html',''),re.S):
  t=html.unescape(t)
  if not re.search(r'(?<!\d)(20|45)[*xх×]',t):continue
  if not re.search('доска|планкен',t,re.I):continue
  u=urllib.parse.urlsplit(html.unescape(u));q=urllib.parse.parse_qs(u.query)
  for key in ['search','path','sort','order']:q.pop(key,None)
  links.add(urllib.parse.urlunsplit((u.scheme,u.netloc,u.path,urllib.parse.urlencode(q,doseq=True),'')))
print('Pages',len(pages),'cards',len(links),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:cards=list(ex.map(read,sorted(links)))
x={'at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'pages':pages,'cards':cards};pathlib.Path('.tmp/terem-boards.json').write_text(json.dumps(x,ensure_ascii=False));print('DONE errors',sum(not p['complete'] for p in pages+cards),flush=True)
