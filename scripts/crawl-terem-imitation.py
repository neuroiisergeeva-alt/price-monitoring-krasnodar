import urllib.request,urllib.parse,re,html,json,pathlib,time,concurrent.futures
ROOT='https://terem-krym.ru/index.php?route=product/search&search='+urllib.parse.quote('имитация');FOLDER=pathlib.Path('.tmp');FOLDER.mkdir(exist_ok=True)
def read(u):
 for n in range(2):
  try:
   r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=25);h=r.read().decode();return {'url':u,'sourceUrl':ROOT,'html':h,'complete':True,'at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
  except Exception as e:err=str(e)
 return {'url':u,'sourceUrl':ROOT,'error':err,'complete':False}
first=read(ROOT);ns=[int(n) for n in re.findall(r'[?&](?:amp;)?page=(\d+)',first.get('html',''))];pages=[first]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:pages+=list(ex.map(read,[ROOT+'&page='+str(i) for i in range(2,max(ns,default=1)+1)]))
links=set()
for p in pages:
 for link,title in re.findall(r'class=["\']product-thumb__name["\'][^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',p.get('html',''),re.S):
  if not re.search('имитация|фальш',html.unescape(title),re.I):continue
  u=urllib.parse.urlsplit(html.unescape(link));qs=urllib.parse.parse_qs(u.query);qs.pop('search',None);links.add(urllib.parse.urlunsplit((u.scheme,u.netloc,u.path,urllib.parse.urlencode(qs,doseq=True),'')))
print('Pages',len(pages),'cards',len(links),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:cards=list(ex.map(read,sorted(links)))
x={'at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'sourceUrl':ROOT,'pages':pages,'cards':cards};pathlib.Path('.tmp/terem-imitation.json').write_text(json.dumps(x,ensure_ascii=False));print('DONE','failures',sum(not p['complete'] for p in pages+cards),flush=True)
