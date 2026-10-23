import json,math,random
p=json.load(open('images/assembly/circuit-paths.json'));r=p['routes'];n=len(r)
# Each edge mustbe travelled. F0/R1. Endpointbridges haveunweighted Euclideancost.
def ends(t):
 i,o=t;return (r[i][0],r[i][-1]) if o==0 else(r[i][-1],r[i][0])
def conn(a,b):return math.dist(ends(a)[1],ends(b)[0])
def cost(seq):return sum(conn(a,b) for a,b in zip(seq,seq[1:]+seq[:1]))
def flip(t):return(t[0],1-t[1])
random.seed(4);best=None
for st in range(47):
 remaining=set(range(n));first=sorted(remaining)[st];seq=[(first,0)];remaining.remove(first)
 while remaining:
  nxt=min(((i,o) for i in remaining for o in [0,1]),key=lambda t:conn(seq[-1],t))
  seq.append(nxt);remaining.remove(nxt[0])
 improvement=True
 while improvement:
  improvement=False
  for a in range(len(seq)-1):
   for b in range(a+1,len(seq)):
    cand=seq[:a]+[flip(t) for t in reversed(seq[a:b+1])]+seq[b+1:]
    if cost(cand)<cost(seq)-.0001:seq=cand;improvement=True
 if best is None or cost(seq)<cost(best):best=seq
print('Cost',cost(best))
print('sequence',','.join(str(i)+('R'if o else'F') for i,o in best))
for a,b in zip(best,best[1:]+best[:1]):
 d=conn(a,b)
 print(str(a[0])+('R'if a[1] else'F'),'->',str(b[0])+('R'if b[1] else'F'),round(d,1),ends(a)[1],ends(b)[0])
