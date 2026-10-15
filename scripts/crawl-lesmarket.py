import urllib.request,urllib.parse,re,html,json,pathlib,time,concurrent.futures
ROOT='https://lesmarket43.ru';F=pathlib.Path('.tmp');F.mkdir(exist_ok=True)
def read(u):
 for _ in range(2):
  try:
   r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=25);return {'url':u,'html':r.read().decode(),'complete':True,'at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
  except Exception as e:err=str(e)
 return {'url':u,'complete':False,'error':err}
main=read(ROOT+'/');links={ROOT+'/prices.js',ROOT+'/data/prices.json'}
for u in re.findall(r'href=["\']([^"\']+)',main.get('html','')):
 u=urllib.parse.urljoin(ROOT,html.unescape(u));p=urllib.parse.urlsplit(u)
 if p.netloc=='lesmarket43.ru' and (p.path in ['/vagonka/','/blok-haus/','/imitaciya-brusa/','/doska-pola/','/planken/','/terrasnaya-doska/'] or p.path.startswith('/calculators/')):links.add(urllib.parse.urlunsplit((p.scheme,p.netloc,p.path,'','')))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:pages=[main]+list(ex.map(read,sorted(links)))
# Follow every publicly linked calculator page; catalogue extra cards are already in homepage HTML.
extra=set()
for p in pages:
 for u in re.findall(r'href=["\']([^"\']+)',p.get('html','')):
  u=urllib.parse.urljoin(ROOT,html.unescape(u));v=urllib.parse.urlsplit(u)
  if v.netloc=='lesmarket43.ru' and v.path.startswith('/calculators/') and u not in {p['url'] for p in pages}:extra.add(u.split('#')[0])
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:pages+=list(ex.map(read,sorted(extra)))
x={'at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'pages':pages};F.joinpath('lesmarket-crawl.json').write_text(json.dumps(x,ensure_ascii=False));print('Sources',len(pages),'errors',sum(not p['complete'] for p in pages))
