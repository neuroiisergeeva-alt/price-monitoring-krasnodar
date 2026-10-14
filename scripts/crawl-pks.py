import urllib.request,re,html,json,pathlib,time,concurrent.futures
ORIGIN='https://simferopol.pksmarket.ru';ROOT=ORIGIN+'/catalog/pilomaterialy/'
from urllib.parse import urljoin,urlparse
folder=pathlib.Path('.tmp');folder.mkdir(exist_ok=True)
def read(u):
 for n in range(2):
  try:
   r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=25)
   if urlparse(r.url).hostname!='simferopol.pksmarket.ru':raise ValueError('Источник сменил регион: '+r.url)
   h=r.read().decode();return {'url':u,'finalUrl':r.url,'html':h,'complete':True,'at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
  except Exception as e:err=str(e)
 return {'url':u,'error':err,'complete':False}
first=read(ROOT);pages=[first];ns=[int(n) for n in re.findall(r'PAGEN_\d+=(\d+)',first.get('html',''))]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:pages+=list(ex.map(read,[ROOT+'?PAGEN_1='+str(n) for n in range(2,max(ns,default=1)+1)]))
category=set()
for href in re.findall('href=["\']([^"\']+)',first.get('html','')):
 u=urljoin(ORIGIN,html.unescape(href));path=urlparse(u).path
 if u.startswith(ROOT) and len(path.strip('/').split('/'))==3:category.add(u)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:cats=list(ex.map(read,sorted(category)))
extra=[]
for c in cats:
 ns=[int(n) for n in re.findall(r'PAGEN_\d+=(\d+)',c.get('html',''))]
 extra += [c['url']+'?PAGEN_1='+str(n) for n in range(2,max(ns,default=1)+1)]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:cats+=list(ex.map(read,extra))
links=set()
for p in pages+cats:
 for href in re.findall('href=["\']([^"\']+)',p.get('html','')):
  u=urljoin(ORIGIN,html.unescape(href));path=urlparse(u).path
  if u.startswith(ROOT) and len(path.strip('/').split('/'))>=4 and '?' not in u and '/filter/' not in path:links.add(u)
print('Catalog pages',len(pages),'category pages',len(cats),'cards',len(links),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:cards=list(ex.map(read,sorted(links)))
x={'at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'region':'Симферополь','pages':pages+cats,'cards':cards};pathlib.Path('.tmp/pks-crawl.json').write_text(json.dumps(x,ensure_ascii=False));print('DONE','cards',len(cards),'errors',sum(not p['complete'] for p in pages+cats+cards),flush=True)
