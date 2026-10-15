import urllib.parse,urllib.request,pathlib,re,html,json,concurrent.futures,time
OWN='https://xn----7sbatncqcefhpkufy2nd.xn--p1ai';TER='https://terem-krym.ru';folder=pathlib.Path('.tmp');folder.mkdir(exist_ok=True)
roots=['vagonka','brus','doska_polovaya','doska_palubnaya','doska_terrasnaya','doska_strogannaya','planken','elementy-dlya-lestnic','izdelija_dlja_bani/pogonazh','plintusa','ugolki_naruzhnie','polok','pilomaterial_suhoy_obreznoy','pilomaterial_obreznoy']
def read(u):
 for n in range(2):
  try:
   r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=30);h=r.read().decode();return {'url':u,'finalUrl':r.url,'html':h,'complete':True}
  except Exception as e:err=str(e)
 return {'url':u,'error':err,'complete':False}
listing=read(OWN+'/products/');nums=[int(n) for n in re.findall(r'/products/page/(\d+)',listing.get('html',''))]; ownLists=[listing]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:ownLists+=list(ex.map(read,[OWN+'/products/page/'+str(i)+'/' for i in range(2,max(nums,default=1)+1)]))
links=set()
for p in ownLists:
 for u in re.findall(r'href=["\']([^"\']+/products/[^"\']+/)["\']',p.get('html','')):
  u=html.unescape(u)
  if not re.search(r'/page/|/feed/|products-category',u) and u.startswith(OWN):links.add(u)
print('Own listings',len(ownLists),'products',len(links),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex: ownPages=list(ex.map(read,sorted(links)))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex: first=list(ex.map(read,[TER+'/catalog/'+s for s in roots]+[TER+'/index.php?route=product/search&search='+urllib.parse.quote(q) for q in ['имитация','Доска сухая','Планкен']]))
pages=[];more=[]
for p in first:
 p['sourceUrl']=p['url'];pages.append(p);ns=[int(n) for n in re.findall(r'[?&](?:amp;)?page=(\d+)',p.get('html',''))];maxn=max(ns,default=1)
 for i in range(2,maxn+1):more.append(((p['url']+'&page='+str(i) if '?' in p['url'] else p['url'].rstrip('/')+'/?page='+str(i)),p['url']))
print('Terem roots',len(first),'other pages',len(more),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
 for i,(r,task) in enumerate(zip(ex.map(read,[x[0] for x in more]),more)):
  r['sourceUrl']=task[1];pages.append(r)
  if i%25==0:print('Terem read',i+1,flush=True)
packageLinks={}
for p in pages:
 for block in re.split(r'<div\s+class=["\']product-thumb uni-item["\'][^>]*>',p.get('html',''))[1:]:
  a=re.search(r'class=["\']product-thumb__name["\'][^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',block,re.S)
  if not a:continue
  title=html.unescape(re.sub('<[^>]+>','',a[2]))
  if re.search(r'\*\s*\d+\s*шт',title):packageLinks[html.unescape(a[1])]=title
print('Package cards to verify',len(packageLinks),flush=True)
packageCards=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
 for i,(r,u) in enumerate(zip(ex.map(read,packageLinks),packageLinks)):
  r['title']=packageLinks[u];r['at']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime());packageCards.append(r)
  if i%50==0:print('Package cards read',i+1,flush=True)
out={'at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'ownListings':ownLists,'own':ownPages,'terem':pages,'packageCards':packageCards}
pathlib.Path('.tmp/crimea-crawl.json').write_text(json.dumps(out,ensure_ascii=False));print('DONE',len(ownPages),len(pages),'failures',sum(not p['complete'] for p in ownPages+pages+packageCards),flush=True)
