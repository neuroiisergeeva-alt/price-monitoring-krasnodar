import sys,json,openpyxl
v=openpyxl.load_workbook(sys.argv[1],data_only=True);sheets=[]
for s in v:
 resolved=[[c.value for c in row] for row in s.iter_rows()];anchors={}
 for r in s.merged_cells.ranges:
  val=s.cell(r.min_row,r.min_col).value
  if r.min_col==r.max_col:
   for n in range(r.min_row,r.max_row+1):resolved[n-1][r.min_col-1]=val;anchors[f'{n}:{r.min_col}']=s.cell(r.min_row,r.min_col).coordinate
 sheets.append({'name':s.title,'rows':[{'row':n,'cells':r,'resolved':resolved[n-1]} for n,r in enumerate([[c.value for c in row] for row in s.iter_rows()],1)],'mergedAnchors':anchors})
json.dump({'fileName':'Price_2023_DomStroy_Krasnodar.xlsx','sheets':sheets},open(sys.argv[2],'w'),ensure_ascii=False,default=str)
