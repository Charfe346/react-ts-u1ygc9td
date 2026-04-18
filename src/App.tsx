// VolcanoCraft Pro v3.4.0 — COMPLETE: all v2.3.1 features + all v3.3 improvements
// BLOC 1/4: Imports, types, constants, CSS, math, file, gprofiler, export, drawing
import React,{useState,useRef,useEffect,useMemo,useCallback} from 'react';
import{Upload,Download,Settings2,Eye,Sigma,FlaskConical,Mountain,BarChart3,Table2,Layers,ArrowUpDown,X,Menu,ChevronDown,ChevronRight,Search,RefreshCw,Undo2,Redo2,RotateCcw}from'lucide-react';
import Papa from'papaparse';
import{saveAs}from'file-saver';
import*as XLSX from'xlsx';

type Mode='single'|'compare';type Tab='volcano'|'enrichment'|'analysis'|'stats'|'data';
type CM='bh'|'bonferroni'|'holm'|'by';type GoM='overlay'|'replace';
interface TC{bg:string;surfaceBg:string;surfaceBorder:string;title:string;axes:string;grid:string;thr:string;up:string;down:string;ns:string;accent:string}
interface GD{gene:string;log2fc:number;pval:number;padj:number;neglog10p:number;status:'UP'|'DOWN'|'NS';baseMean?:number;ci_lo?:number;ci_hi?:number}
interface GPT{native:string;name:string;source:string;p_value:number;term_size:number;intersection_size:number;query_size:number;precision:number;recall:number;significant:boolean;description:string;parents:string[]}
interface GPR{terms:GPT[];genes_in_term:Map<string,Set<string>>;query_genes:string[]}
interface ES{organism:string;sources:string[];userThreshold:number;significanceMethod:string;noIea:boolean;resultA:GPR|null;resultB:GPR|null;selectedTermsA:string[];selectedTermsB:string[]}
interface LI{color:string;label:string;count?:number;type:'status'|'goterm'|'separator'|'compare'}
interface TT{gene:string;log2fc:number;pval:number;padj:number;status:string;x:number;y:number}
interface Snap{thrL:number;thrR:number;sig:number;fdr:boolean;cm:CM;ps:string;sz:number;al:number;sh:string}
interface MG{gene:string;lfc_A:number;lfc_B:number;nlp_A:number;nlp_B:number;status_A:string;status_B:string}

const LW=160;const SK='vc34';const FA='.csv,.tsv,.txt,.xlsx,.xls';
const TH:Record<string,TC>={
dark:{bg:'#0f1117',surfaceBg:'#1a1d27',surfaceBorder:'#2a2d3a',title:'#e2e8f0',axes:'#94a3b8',grid:'#1e2130',thr:'#475569',up:'#f43f5e',down:'#3b82f6',ns:'#334155',accent:'#a78bfa'},
light:{bg:'#f8fafc',surfaceBg:'#ffffff',surfaceBorder:'#e2e8f0',title:'#1e293b',axes:'#64748b',grid:'#f1f5f9',thr:'#94a3b8',up:'#dc2626',down:'#2563eb',ns:'#cbd5e1',accent:'#7c3aed'},
neon:{bg:'#0a0a0f',surfaceBg:'#111118',surfaceBorder:'#1f1f2e',title:'#f0abfc',axes:'#c084fc',grid:'#15151f',thr:'#6b21a8',up:'#fb923c',down:'#22d3ee',ns:'#1e1b4b',accent:'#e879f9'},
colorblind:{bg:'#0f1117',surfaceBg:'#1a1d27',surfaceBorder:'#2a2d3a',title:'#e2e8f0',axes:'#94a3b8',grid:'#1e2130',thr:'#475569',up:'#d55e00',down:'#0072b2',ns:'#334155',accent:'#cc79a7'},
publication:{bg:'#ffffff',surfaceBg:'#fafafa',surfaceBorder:'#e5e5e5',title:'#171717',axes:'#525252',grid:'#f5f5f5',thr:'#a3a3a3',up:'#b91c1c',down:'#1d4ed8',ns:'#d4d4d4',accent:'#6d28d9'}};
const CLL:Record<CM,string>={bh:'Benjamini-Hochberg',bonferroni:'Bonferroni',holm:'Holm',by:'Benjamini-Yekutieli'};
const GSR=[{id:'GO:BP',l:'GO BP'},{id:'GO:MF',l:'GO MF'},{id:'GO:CC',l:'GO CC'},{id:'KEGG',l:'KEGG'},{id:'REAC',l:'Reactome'},{id:'WP',l:'WikiPathways'},{id:'TF',l:'Transfac'}];
const TPL=['#e6194b','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#42d4f4','#f032e6','#bfef45','#fabed4','#469990','#dcbeff','#9A6324','#fffac8','#800000','#aaffc3','#808000','#ffd8b1','#000075','#a9a9a9'];
const FCS=(t:TC,dk:boolean)=>`
:root{color-scheme:${dk?'dark':'light'}}
input[type="range"].vs{-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;outline:none;cursor:pointer}
input[type="range"].vs::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;border:2px solid ${t.accent};background:#fff;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.3)}
input[type="range"].vs::-moz-range-thumb{width:16px;height:16px;border-radius:50%;border:2px solid ${t.accent};background:#fff;cursor:pointer}
.dt::-webkit-slider-runnable-track{height:6px;border-radius:3px;background:linear-gradient(90deg,#334155,${t.accent})}
.lt::-webkit-slider-runnable-track{height:6px;border-radius:3px;background:linear-gradient(90deg,#cbd5e1,${t.accent})}
.vc input[type="number"],.vc input[type="text"],.vc select,.vc textarea{background-color:${t.surfaceBg}!important;color:${t.title}!important;border-color:${t.surfaceBorder}!important;color-scheme:${dk?'dark':'light'};-webkit-appearance:none}
.vc input::placeholder,.vc textarea::placeholder{color:${t.axes}!important;opacity:0.5}
.vc select option{background-color:${t.surfaceBg};color:${t.title}}
.vc .sb{background:transparent!important;border:none!important;box-shadow:none!important}
`;

// MATH
function nI(p:number):number{if(p<=0)return-Infinity;if(p>=1)return Infinity;if(p===0.5)return 0;const a=[-3.969683028665376e1,2.209460984245205e2,-2.759285104469687e2,1.383577518672690e2,-3.066479806614716e1,2.506628277459239e0],b=[-5.447609879822406e1,1.615858368580409e2,-1.556989798598866e2,6.680131188771972e1,-1.328068155288572e1],c=[-7.784894002430293e-3,-3.223964580411365e-1,-2.400758277161838e0,-2.549732539343734e0,4.374664141464968e0,2.938163982698783e0],d=[7.784695709041462e-3,3.224671290700398e-1,2.445134137142996e0,3.754408661907416e0];const pL=0.02425;let q:number;if(p<pL){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}else if(p<=1-pL){q=p-0.5;const r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);}else{q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}}
function aP(pv:number[],m:CM):number[]{const n=pv.length;if(!n)return[];const ix=pv.map((p,i)=>({p,i}));switch(m){case'bonferroni':return pv.map(p=>Math.min(1,p*n));case'holm':{ix.sort((a,b)=>a.p-b.p);const r=new Array(n);let cm=0;for(let k=0;k<n;k++){cm=Math.max(cm,ix[k].p*(n-k));r[ix[k].i]=Math.min(1,cm);}return r;}case'by':{ix.sort((a,b)=>b.p-a.p);const r=new Array(n);let c2=0;for(let i=1;i<=n;i++)c2+=1/i;let cm=1;for(let k=0;k<n;k++){cm=Math.min(cm,(ix[k].p*n*c2)/(n-k));r[ix[k].i]=Math.min(1,cm);}return r;}default:{ix.sort((a,b)=>b.p-a.p);const r=new Array(n);let cm=1;for(let k=0;k<n;k++){cm=Math.min(cm,(ix[k].p*n)/(n-k));r[ix[k].i]=Math.min(1,cm);}return r;}}}
function pD(raw:GD[],tL:number,tR:number,sig:number,fdr:boolean,cm:CM):GD[]{const adj=aP(raw.map(g=>g.pval),cm);return raw.map((g,i)=>{const pa=adj[i],sv=fdr?pa:g.pval,nl=-Math.log10(Math.max(g.pval,1e-300));let s:'UP'|'DOWN'|'NS'='NS';if(sv<sig){if(g.log2fc>=tR)s='UP';else if(g.log2fc<=-tL)s='DOWN';}const se=g.pval>0&&g.pval<1?Math.abs(g.log2fc/nI(1-g.pval/2)):0;return{...g,padj:pa,neglog10p:nl,status:s,ci_lo:g.log2fc-1.96*se,ci_hi:g.log2fc+1.96*se};});}
function cSt(d:GD[]){const t=d.length,u=d.filter(g=>g.status==='UP').length,dn=d.filter(g=>g.status==='DOWN').length,lf=d.map(g=>g.log2fc).sort((a,b)=>a-b),nl=d.map(g=>g.neglog10p);return{total:t,up:u,down:dn,medianLfc:lf.length?lf[Math.floor(lf.length/2)]:0,meanNlp:nl.length?nl.reduce((a,b)=>a+b,0)/nl.length:0};}
function cHi(v:number[],bins=50):{x:number;y:number}[]{if(!v.length)return[];const mn=Math.min(...v),mx=Math.max(...v),rng=mx-mn||1,bw=rng/bins,ct=new Array(bins).fill(0);for(const vl of v)ct[Math.min(bins-1,Math.floor((vl-mn)/bw))]++;return ct.map((c,i)=>({x:mn+(i+.5)*bw,y:c/v.length}));}
function cQQ(pv:number[]):{expected:number;observed:number}[]{const s=[...pv].filter(p=>p>0&&p<=1).sort((a,b)=>a-b),n=s.length;if(!n)return[];const step=Math.max(1,Math.floor(n/500)),pts:{expected:number;observed:number}[]=[];for(let i=0;i<n;i+=step)pts.push({expected:-Math.log10((i+.5)/n),observed:-Math.log10(s[i])});return pts;}
function cLG(pv:number[]):number{const v=pv.filter(p=>p>0&&p<1);if(!v.length)return 1;const c=v.map(p=>{const z=nI(1-p/2);return z*z;}).sort((a,b)=>a-b);return c[Math.floor(c.length/2)]/.4549364;}
function cKS(pv:number[]):{D:number;pv:number}{const s=[...pv].filter(p=>p>=0&&p<=1).sort((a,b)=>a-b),n=s.length;if(!n)return{D:0,pv:1};let mx=0;for(let i=0;i<n;i++)mx=Math.max(mx,Math.abs((i+1)/n-s[i]),Math.abs(s[i]-i/n));const sq=Math.sqrt(n),lm=(sq+.12+.11/sq)*mx;let pv2=0;for(let k=1;k<=100;k++)pv2+=2*Math.pow(-1,k+1)*Math.exp(-2*k*k*lm*lm);return{D:mx,pv:Math.max(0,Math.min(1,pv2))};}
function cP0(pv:number[]):{pi0:number;curve:{lambda:number;pi0:number}[]}{const v=pv.filter(p=>p>=0&&p<=1),m=v.length;if(!m)return{pi0:1,curve:[]};const ls:number[]=[];for(let l=.05;l<=.95;l+=.05)ls.push(+l.toFixed(2));const pl=ls.map(l=>({lambda:l,pi0:v.filter(p=>p>l).length/(m*(1-l))}));return{pi0:Math.min(1,Math.max(0,Math.min(...pl.map(x=>x.pi0)))),curve:pl};}
function cCC(data:GD[],fdr:boolean){return(['bh','bonferroni','holm','by']as CM[]).map(m=>{const p=pD(data,1,1,.05,fdr,m),pa=p.map(g=>g.padj).sort((a,b)=>a-b);return{method:CLL[m],n:p.filter(g=>g.padj<.05).length,min:pa[0]||1};});}
function cCn(mg:MG[]){if(mg.length<2)return null;const n=mg.length,xA=mg.map(m=>m.lfc_A),yA=mg.map(m=>m.lfc_B),mx=xA.reduce((a,b)=>a+b,0)/n,my=yA.reduce((a,b)=>a+b,0)/n;let nm=0,dx=0,dy=0;for(let i=0;i<n;i++){nm+=(xA[i]-mx)*(yA[i]-my);dx+=(xA[i]-mx)**2;dy+=(yA[i]-my)**2;}const pR=dx>0&&dy>0?nm/Math.sqrt(dx*dy):0;const rk=(a:number[])=>{const s=a.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v),r=new Array(a.length);s.forEach((x,i)=>r[x.i]=i+1);return r;};const rx=rk(xA),ry=rk(yA);let d2=0;for(let i=0;i<n;i++)d2+=(rx[i]-ry[i])**2;const sR=1-(6*d2)/(n*(n*n-1));const cats=['UP','DOWN','NS'],mt:number[][]=cats.map(()=>cats.map(()=>0));for(const m of mg){const ia=cats.indexOf(m.status_A),ib=cats.indexOf(m.status_B);if(ia>=0&&ib>=0)mt[ia][ib]++;}let po=0,pe=0;for(let i=0;i<3;i++)po+=mt[i][i];po/=n;for(let i=0;i<3;i++){pe+=(mt[i].reduce((a,b)=>a+b,0)*mt.map(r=>r[i]).reduce((a,b)=>a+b,0))/(n*n);}const kp=pe<1?(po-pe)/(1-pe):0;return{total:n,pearsonR:pR,spearmanRho:sR,kappa:kp,concordant:mg.filter(m=>m.status_A===m.status_B).length,discordant:mg.filter(m=>(m.status_A==='UP'&&m.status_B==='DOWN')||(m.status_A==='DOWN'&&m.status_B==='UP')).length,pctConc:(mg.filter(m=>m.status_A===m.status_B).length/n)*100};}

// FILE PARSING
function parseFile(file:File):Promise<Record<string,unknown>[]>{return new Promise((res,rej)=>{const ext=file.name.split('.').pop()?.toLowerCase()||'';if(ext==='xlsx'||ext==='xls'){const r=new FileReader();r.onload=e=>{try{const d=new Uint8Array(e.target?.result as ArrayBuffer);const wb=XLSX.read(d,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];res(XLSX.utils.sheet_to_json<Record<string,unknown>>(ws,{defval:null}));}catch(err){rej(err);}};r.onerror=()=>rej(new Error('Read error'));r.readAsArrayBuffer(file);}else{Papa.parse(file,{header:true,skipEmptyLines:true,dynamicTyping:true,delimiter:ext==='tsv'?'\t':undefined,complete:r=>res(r.data as Record<string,unknown>[]),error:(e:{message:string})=>rej(new Error(e.message))});}});}
function r2g(rows:Record<string,unknown>[]):{genes:GD[];error?:string}{if(!rows.length)return{genes:[],error:'Empty'};const h=Object.keys(rows[0]);const fc=(cs:string[])=>{for(const c of cs){const f=h.find(x=>x.toLowerCase()===c.toLowerCase());if(f)return f;}for(const c of cs){const f=h.find(x=>x.toLowerCase().includes(c.toLowerCase()));if(f)return f;}return undefined;};const gc=fc(['gene','gene_name','gene_symbol','symbol','genename','gene_id','geneid','id','identifier','feature','probe','name','transcript','ensembl','ensg','entrez','refseq','X','ID','Name','Symbol','SYMBOL','Gene','GENE'])||h[0];const lc=fc(['log2FoldChange','log2fc','logFC','log2FC','lfc','LFC','log2_fold_change','fold_change','FC','fc','effect','coefficient','coef','beta','estimate','avg_log2FC']);const pc=fc(['pvalue','pval','p_value','PValue','Pvalue','P.Value','p.value','pValue','raw_pvalue','rawp','p','P','pvalues','p_val']);const ac=fc(['padj','p_adj','FDR','fdr','qvalue','q_value','qval','adj.P.Val','adjp','adj_pval','padjust','p.adjust','BH','bonferroni','BY','adj_p','fdr_bh','q','Q']);const bc=fc(['baseMean','basemean','AveExpr','logCPM','meanExpr','rpkm','RPKM','fpkm','FPKM','tpm','TPM','cpm','CPM','counts','expression']);if(!lc||!pc)return{genes:[],error:`Missing log2FC or p-value. Cols:[${h.join(',')}]`};const genes:GD[]=rows.filter(r=>r[gc]!=null&&r[lc]!=null&&r[pc]!=null).map(r=>({gene:String(r[gc]),log2fc:Number(r[lc])||0,pval:Math.max(0,Math.min(1,Number(r[pc])||1)),padj:ac?Math.max(0,Math.min(1,Number(r[ac])||1)):1,neglog10p:0,status:'NS'as const,baseMean:bc?Number(r[bc]):undefined}));return genes.length?{genes}:{genes:[],error:'No valid rows'};}

// g:Profiler
async function gpr(genes:string[],org:string,src:string[],thr:number,sm:string,noIea:boolean):Promise<{terms:GPT[];tgm:Map<string,string[]>}>{const r=await fetch('https://biit.cs.ut.ee/gprofiler/api/gost/profile/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({organism:org,query:genes,sources:src.length?src:[],user_threshold:thr,significance_threshold_method:sm,no_iea:noIea,no_evidences:false})});if(!r.ok)throw new Error(`g:Profiler ${r.status}`);const j=await r.json(),res=j.result||[],meta=j.meta||{},gm=meta.genes_metadata||{},qk=Object.keys(gm.query||{})[0]||'',mp:Record<string,string[]>=qk?(gm.query[qk]?.mapping||{}):{},e2s=new Map<string,string>();for(const[s,es]of Object.entries(mp))if(Array.isArray(es))for(const e of es)e2s.set(e,s);const eo:string[]=qk?(gm.query[qk]?.ensgs||[]):[],terms:GPT[]=[],tgm=new Map<string,string[]>();for(const x of res){terms.push({native:x.native||'',name:x.name||'',source:x.source||'',p_value:x.p_value||1,term_size:x.term_size||0,intersection_size:x.intersection_size||0,query_size:x.query_size||0,precision:x.precision||0,recall:x.recall||0,significant:x.significant!==false,description:x.description||x.name||'',parents:x.parents||[]});const gi:string[]=[];if(x.intersections&&Array.isArray(x.intersections))for(let i=0;i<x.intersections.length;i++){const inter=x.intersections[i];if(inter&&Array.isArray(inter)&&inter.length>0){const en=eo[i];if(en){const sym=e2s.get(en);if(sym)gi.push(sym);}}}tgm.set(x.native||'',gi);}return{terms:terms.filter(t=>t.significant).sort((a,b)=>a.p_value-b.p_value),tgm};}

// EXPORT 600DPI
function exR(ref:React.RefObject<HTMLDivElement|null>,name:string,fmt:'png'|'svg'){if(!ref.current)return;const cv=ref.current.querySelector('canvas');if(!cv)return;if(fmt==='png'){const dpr=window.devicePixelRatio||1,scale=600/96;const hrc=document.createElement('canvas');hrc.width=Math.round((cv.width/dpr)*scale);hrc.height=Math.round((cv.height/dpr)*scale);const hc=hrc.getContext('2d');if(hc){hc.imageSmoothingEnabled=true;hc.imageSmoothingQuality='high';hc.drawImage(cv,0,0,cv.width,cv.height,0,0,hrc.width,hrc.height);hrc.toBlob(b=>{if(b)saveAs(b,`${name}_600dpi.png`)},'image/png');}}else{const du=cv.toDataURL('image/png');const dpr=window.devicePixelRatio||1;const w=cv.width/dpr,h=cv.height/dpr;saveAs(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}"><image xlink:href="${du}" width="${w}" height="${h}"/></svg>`],{type:'image/svg+xml'}),`${name}.svg`);}}

// DRAWING
function dRR(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();}
function dPt(c:CanvasRenderingContext2D,x:number,y:number,s:string,z:number){switch(s){case'diamond':c.beginPath();c.moveTo(x,y-z);c.lineTo(x+z*.7,y);c.lineTo(x,y+z);c.lineTo(x-z*.7,y);c.closePath();c.fill();break;case'square':c.fillRect(x-z*.6,y-z*.6,z*1.2,z*1.2);break;case'triangle':c.beginPath();c.moveTo(x,y-z);c.lineTo(x+z*.85,y+z*.7);c.lineTo(x-z*.85,y+z*.7);c.closePath();c.fill();break;default:c.beginPath();c.arc(x,y,z,0,Math.PI*2);c.fill();}}
function dMk(c:CanvasRenderingContext2D,cx:number,cy:number,s:string,sz:number,fc:string,sc:string){c.fillStyle=fc;c.strokeStyle=sc;c.lineWidth=1.2;switch(s){case'diamond':c.beginPath();c.moveTo(cx,cy-sz);c.lineTo(cx+sz*.7,cy);c.lineTo(cx,cy+sz);c.lineTo(cx-sz*.7,cy);c.closePath();c.fill();c.stroke();break;case'square':c.fillRect(cx-sz*.6,cy-sz*.6,sz*1.2,sz*1.2);c.strokeRect(cx-sz*.6,cy-sz*.6,sz*1.2,sz*1.2);break;case'triangle':c.beginPath();c.moveTo(cx,cy-sz);c.lineTo(cx+sz*.85,cy+sz*.7);c.lineTo(cx-sz*.85,cy+sz*.7);c.closePath();c.fill();c.stroke();break;case'star':{c.beginPath();for(let i=0;i<10;i++){const r2=i%2===0?sz:sz*.45,a=(i*Math.PI/5)-Math.PI/2;i===0?c.moveTo(cx+r2*Math.cos(a),cy+r2*Math.sin(a)):c.lineTo(cx+r2*Math.cos(a),cy+r2*Math.sin(a));}c.closePath();c.fill();c.stroke();break;}case'hexagon':{c.beginPath();for(let i=0;i<6;i++){const a=(i*Math.PI/3)-Math.PI/6;i===0?c.moveTo(cx+sz*Math.cos(a),cy+sz*Math.sin(a)):c.lineTo(cx+sz*Math.cos(a),cy+sz*Math.sin(a));}c.closePath();c.fill();c.stroke();break;}case'cross':c.lineWidth=2;c.beginPath();c.moveTo(cx-sz*.7,cy);c.lineTo(cx+sz*.7,cy);c.stroke();c.beginPath();c.moveTo(cx,cy-sz*.7);c.lineTo(cx,cy+sz*.7);c.stroke();break;case'ring':c.lineWidth=2.5;c.beginPath();c.arc(cx,cy,sz*.75,0,Math.PI*2);c.stroke();c.beginPath();c.arc(cx,cy,sz*.3,0,Math.PI*2);c.fill();break;default:c.beginPath();c.arc(cx,cy,sz,0,Math.PI*2);c.fill();c.stroke();}}
function dSt(c:CanvasRenderingContext2D,g:GD,px:number,py:number,ps:string,sh:string,sz:number,al:number,mL:number,mN:number,up:string,dn:string){let r=sz;if(ps==='heatmap'){const h=(g.log2fc+mL)/(2*mL);c.fillStyle=`rgb(${Math.round(255*Math.min(1,h*2))},${Math.round(255*(1-Math.abs(h-.5)*2))},${Math.round(255*Math.min(1,(1-h)*2))})`;} else if(ps==='significance'){const i=Math.min(1,g.neglog10p/mN);const cl=g.status==='UP'?up:dn;const rr=parseInt(cl.slice(1,3),16)||0,gg=parseInt(cl.slice(3,5),16)||0,bb=parseInt(cl.slice(5,7),16)||0;c.fillStyle=`rgba(${rr},${gg},${bb},${.3+i*.7})`;r=sz*(.6+i*.8);} else if(ps==='bubble'){c.fillStyle=g.status==='UP'?up:dn;r=sz*(.5+Math.abs(g.log2fc)*.5);} else{c.fillStyle=g.status==='UP'?up:dn;}c.globalAlpha=al;dPt(c,px,py,sh,r);}

// LEGEND — FIX: shows ALL items
function dLg(c:CanvasRenderingContext2D,x:number,y:number,bw:number,mH:number,items:LI[],t:TC){
  if(!items.length)return;const px=10,py=8,tH=16,iH=14,sH=5;
  let needH=py+tH;for(const it of items)needH+=it.type==='separator'?sH:iH;needH+=py;
  const h=Math.min(needH,mH);
  c.save();c.globalAlpha=.93;c.fillStyle=t.surfaceBg;c.shadowColor='rgba(0,0,0,.15)';c.shadowBlur=10;c.shadowOffsetY=2;dRR(c,x,y,bw,h,8);c.fill();c.restore();
  c.globalAlpha=1;c.strokeStyle=t.surfaceBorder;c.lineWidth=1;dRR(c,x,y,bw,h,8);c.stroke();
  c.fillStyle=t.title;c.font='bold 9px Inter,sans-serif';c.textAlign='left';c.fillText('Legend',x+px,y+py+9);
  let cy=y+py+tH+2;const mw=bw-px*2-18;
  for(const it of items){if(cy+iH>y+h)break;if(it.type==='separator'){cy+=sH;continue;}
    const iy=cy+iH/2;c.fillStyle=it.color;c.globalAlpha=.9;c.beginPath();c.arc(x+px+4,iy,3,0,Math.PI*2);c.fill();c.globalAlpha=1;
    c.font=it.type==='goterm'?'italic 7px Inter,sans-serif':'bold 8px Inter,sans-serif';
    c.fillStyle=it.type==='goterm'?it.color:t.axes;c.textAlign='left';
    let lb=it.label;if(it.count!=null)lb+=` (${it.count})`;
    while(c.measureText(lb).width>mw&&lb.length>5)lb=lb.slice(0,-2)+'…';
    c.fillText(lb,x+px+11,iy+3);cy+=iH;}
}

// UI
function Sec({title,icon:Ic,open,toggle,children,color}:{title:string;icon:React.ElementType;open:boolean;toggle:()=>void;children:React.ReactNode;color:string}){return(<div className="mb-2"><button onClick={toggle} className="sb flex items-center gap-2 w-full py-2 text-xs font-semibold uppercase tracking-wider hover:opacity-80" style={{color,background:'transparent',border:'none'}}><Ic size={13}/><span className="flex-1 text-left">{title}</span>{open?<ChevronDown size={13}/>:<ChevronRight size={13}/>}</button>{open&&<div className="space-y-2.5 pb-3">{children}</div>}</div>);}
function Lb({children,color}:{children:React.ReactNode;color:string}){return<div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{color,opacity:.7}}>{children}</div>;}
// ═══ END BLOC 1 — continue with BLOC 2 ═══
// ═══ BLOC 2/4: App state, computed, sidebar render ═══

export default function App(){
  // ── state ──
  const[tn,setTn]=useState('dark');const[mode,setMode]=useState<Mode>('single');const[tab,setTab]=useState<Tab>('volcano');const[sO,setSO]=useState(true);
  const[dA,setDA]=useState<GD[]>([]);const[dB,setDB]=useState<GD[]>([]);const[lA,setLA]=useState('Dataset A');const[lB,setLB]=useState('Dataset B');const[fE,setFE]=useState<string|null>(null);
  const[tL,sTL]=useState(1);const[tR,sTR]=useState(1);const[sg,sSg]=useState(.05);const[fd,sFd]=useState(true);const[cm,sCm]=useState<CM>('bh');
  const[ps,sPs]=useState('categorical');const[sz,sSz]=useState(4);const[al,sAl]=useState(.7);
  const[cU,sCU]=useState('');const[cD,sCD]=useState('');const[cN,sCN]=useState('');
  const[sh,sSh]=useState<string>('circle');
  const[lm,sLm]=useState<'topn'|'manual'|'threshold'>('topn');const[tN,sTN]=useState(10);const[mT,sMT]=useState('');const[lfM,sLfM]=useState(2);const[nlM,sNlM]=useState(5);const[lS,sLS]=useState(9);
  const[cmpN,sCmpN]=useState(20);const[cmpM,sCmpM]=useState('');const[cmpMd,sCmpMd]=useState<'auto'|'manual'>('auto');
  // compare design
  const[cls,sCls]=useState<string>('bezier');const[clm,sClm]=useState<string>('mixed');
  const[cld,sCld]=useState<string>('solid');const[clw,sClw]=useState(2);
  const[cpSz,sCpSz]=useState(4);const[cpSh,sCpSh]=useState<string>('circle');
  const[cns,sCns]=useState(true);
  const[dsc,sDsc]=useState('#f59e0b');const[buC,sBuC]=useState('');const[bdC,sBdC]=useState('');
  // sections
  const[sD,sSd]=useState(true);const[sT,sSt]=useState(true);const[sS,sSs]=useState(false);const[sC,sSc]=useState(false);const[sL,sSl]=useState(false);const[sStat,sSStat]=useState(false);const[sE,sSe]=useState(false);const[sCS,sScs]=useState(false);
  // data table
  const[fSt,sFSt]=useState<string[]>(['UP','DOWN','NS']);const[sCol,sSCol]=useState<'gene'|'log2fc'|'neglog10p'>('neglog10p');const[sDir,sSDir]=useState<'asc'|'desc'>('desc');
  // enrichment
  const[enr,sEnr]=useState<ES>({organism:'hsapiens',sources:['GO:BP','GO:MF','GO:CC','KEGG','REAC'],userThreshold:.05,significanceMethod:'g_SCS',noIea:false,resultA:null,resultB:null,selectedTermsA:[],selectedTermsB:[]});
  const[enrL,sEnrL]=useState(false);const[enrE,sEnrE]=useState<string|null>(null);const[shEV,sShEV]=useState(false);
  const[ctc,sCtc]=useState<Record<string,string>>({});
  const[sES,sSES]=useState('');const[sEF,sSEF]=useState('all');
  const[srG,sSrG]=useState('');const[gM,sGM]=useState<GoM>('overlay');
  // undo
  const[hst,sHst]=useState<Snap[]>([]);const[hI,sHI]=useState(-1);const snR=useRef<Snap|null>(null);
  const mkS=useCallback(():Snap=>({thrL:tL,thrR:tR,sig:sg,fdr:fd,cm,ps,sz,al,sh}),[tL,tR,sg,fd,cm,ps,sz,al,sh]);
  const rsS=useCallback((s:Snap)=>{sTL(s.thrL);sTR(s.thrR);sSg(s.sig);sFd(s.fdr);sCm(s.cm);sPs(s.ps);sSz(s.sz);sAl(s.al);sSh(s.sh);},[]);
  useEffect(()=>{const s=mkS();if(JSON.stringify(s)!==JSON.stringify(snR.current)){snR.current=s;sHst(h=>[...h.slice(0,hI+1),s].slice(-50));sHI(i=>Math.min(i+1,49));}},[tL,tR,sg,fd,cm,ps,sz,al,sh]);
  const undo=useCallback(()=>{if(hI>0){sHI(hI-1);rsS(hst[hI-1]);}},[hI,hst,rsS]);
  const redo=useCallback(()=>{if(hI<hst.length-1){sHI(hI+1);rsS(hst[hI+1]);}},[hI,hst,rsS]);
  
  // refs
  const cR=useRef<HTMLDivElement>(null);const qR=useRef<HTMLDivElement>(null);const mR=useRef<HTMLDivElement>(null);const fR=useRef<HTMLDivElement>(null);const wR=useRef<HTMLDivElement>(null);const csR=useRef<HTMLDivElement>(null);const vnR=useRef<HTMLDivElement>(null);const piR=useRef<HTMLDivElement>(null);
  
  // theme
  const bt=TH[tn]||TH.dark;const theme:TC=useMemo(()=>({...bt,up:cU||bt.up,down:cD||bt.down,ns:cN||bt.ns}),[bt,cU,cD,cN]);
  const dk=theme.bg<'#30';const buR=buC||theme.up;const bdR=bdC||theme.down;
  
  // OS theme + localStorage
  useEffect(()=>{if(!localStorage.getItem(SK)){const mq=window.matchMedia('(prefers-color-scheme: dark)');setTn(mq.matches?'dark':'light');const h=(e:MediaQueryListEvent)=>setTn(e.matches?'dark':'light');mq.addEventListener('change',h);return()=>mq.removeEventListener('change',h);}},[]);
  useEffect(()=>{try{const s=localStorage.getItem(SK);if(s){const d=JSON.parse(s);if(d.tn)setTn(d.tn);}}catch{}},[]);
  useEffect(()=>{try{localStorage.setItem(SK,JSON.stringify({tn}));}catch{}},[tn]);
  
  // file handler
  const hF=useCallback(async(e:React.ChangeEvent<HTMLInputElement>,t:'A'|'B')=>{const f=e.target.files?.[0];if(!f)return;setFE(null);try{const rows=await parseFile(f);const{genes,error}=r2g(rows);if(error){setFE(error);return;}if(t==='A'){setDA(genes);setLA(f.name.replace(/\.\w+$/,''));}else{setDB(genes);setLB(f.name.replace(/\.\w+$/,''));}}catch(err){setFE((err as Error).message);}},[]);
  
  // demo data
  useEffect(()=>{if(dA.length>0)return;
  const kn=[{g:'TP53',l:-3.2,p:1e-45},{g:'EGFR',l:4.1,p:1e-38},{g:'BRCA1',l:-2.8,p:1e-32},{g:'MYC',l:3.5,p:1e-29},{g:'KRAS',l:2.9,p:1e-25},{g:'PIK3CA',l:2.4,p:1e-22},{g:'PTEN',l:-3.8,p:1e-41},{g:'RB1',l:-2.5,p:1e-19},{g:'APC',l:-2.1,p:1e-17},{g:'VEGFA',l:3.7,p:1e-35},{g:'CDH1',l:-2.9,p:1e-28},{g:'ERBB2',l:4.5,p:1e-42},{g:'ALK',l:2.2,p:1e-14},{g:'BRAF',l:2.8,p:1e-21},{g:'IDH1',l:-1.8,p:1e-11},{g:'NRAS',l:2.1,p:1e-13},{g:'ATM',l:-2.3,p:1e-16},{g:'CDK4',l:3.1,p:1e-24},{g:'FGFR1',l:2.6,p:1e-18},{g:'MET',l:3.3,p:1e-27},{g:'RET',l:2.0,p:1e-12},{g:'KIT',l:2.7,p:1e-20},{g:'FLT3',l:3.0,p:1e-23},{g:'JAK2',l:2.3,p:1e-15},{g:'STAT3',l:1.9,p:1e-10},{g:'NOTCH1',l:-2.6,p:1e-22},{g:'CTNNB1',l:2.5,p:1e-19},{g:'BRCA2',l:-3.0,p:1e-30},{g:'PDGFRA',l:2.4,p:1e-16},{g:'CCND1',l:3.4,p:1e-26},{g:'CDK6',l:2.8,p:1e-20},{g:'FGFR2',l:2.1,p:1e-13},{g:'ROS1',l:2.3,p:1e-14},{g:'MAP2K1',l:1.7,p:1e-9}];
  const da:GD[]=[],db:GD[]=[];const disc=new Set(['ALK','IDH1','RET','STAT3','ROS1']);
  for(const k of kn){const bm=500+Math.random()*9500;da.push({gene:k.g,log2fc:k.l,pval:k.p,padj:1,neglog10p:0,status:'NS',baseMean:bm});const fl=disc.has(k.g);db.push({gene:k.g,log2fc:fl?-(k.l*(.7+Math.random()*.4)):k.l*(.6+Math.random()*.6)+(Math.random()-.5)*.6,pval:Math.min(1,Math.max(1e-300,k.p*Math.pow(10,(Math.random()-.5)*3))),padj:1,neglog10p:0,status:'NS',baseMean:bm*(.7+Math.random()*.6)});}
  for(let i=0;i<200;i++){const dir=Math.random()>.5?1:-1;const lfc=dir*(1.2+Math.random()*2.5);const pv=Math.pow(10,-(2+Math.random()*8));const bm=200+Math.random()*5e3;da.push({gene:`DEG${i+1}`,log2fc:lfc,pval:pv,padj:1,neglog10p:0,status:'NS',baseMean:bm});db.push({gene:`DEG${i+1}`,log2fc:lfc*(.5+Math.random()*.8)+(Math.random()-.5)*.5,pval:Math.min(1,pv*Math.pow(10,(Math.random()-.5)*2)),padj:1,neglog10p:0,status:'NS',baseMean:bm*(.8+Math.random()*.4)});}
  for(let i=0;i<300;i++){da.push({gene:`BRD${i+1}`,log2fc:(Math.random()-.5)*4,pval:Math.pow(10,-(1+Math.random()*3)),padj:1,neglog10p:0,status:'NS',baseMean:100+Math.random()*3e3});db.push({gene:`BRD${i+1}`,log2fc:(Math.random()-.5)*4,pval:Math.pow(10,-(1+Math.random()*3)),padj:1,neglog10p:0,status:'NS',baseMean:100+Math.random()*3e3});}
  for(let i=0;i<4500;i++){const lfc=((Math.random()-.5)*2)*.8;const pv=Math.random()<.15?Math.pow(10,-(0.5+Math.random()*2)):0.05+Math.random()*.95;const bm=50+Math.random()*8e3;da.push({gene:`Gene${i+1}`,log2fc:lfc,pval:pv,padj:1,neglog10p:0,status:'NS',baseMean:bm});db.push({gene:`Gene${i+1}`,log2fc:lfc+(Math.random()-.5)*.4,pval:Math.min(1,Math.max(1e-300,pv*(.5+Math.random()))),padj:1,neglog10p:0,status:'NS',baseMean:bm*(.9+Math.random()*.2)});}
  setDA(da);setDB(db);setLA('RNA-seq Tumor vs Normal');setLB('RNA-seq Drug Treatment');},[dA.length]);
  
  // computed
  const pA=useMemo(()=>pD(dA,tL,tR,sg,fd,cm),[dA,tL,tR,sg,fd,cm]);
  const pB=useMemo(()=>pD(dB,tL,tR,sg,fd,cm),[dB,tL,tR,sg,fd,cm]);
  const stA=useMemo(()=>cSt(pA),[pA]);const stB=useMemo(()=>cSt(pB),[pB]);
  const merged=useMemo(():MG[]=>{if(mode!=='compare'||!pB.length)return[];const mb=new Map(pB.map(g=>[g.gene,g]));return pA.filter(g=>mb.has(g.gene)).map(g=>{const b=mb.get(g.gene)!;return{gene:g.gene,lfc_A:g.log2fc,lfc_B:b.log2fc,nlp_A:g.neglog10p,nlp_B:b.neglog10p,status_A:g.status,status_B:b.status};});},[mode,pA,pB]);
  const manGenes=useMemo(()=>{if(lm==='manual'){const names=mT.split(/[\n,;\t\s]+/).map(g=>g.trim()).filter(Boolean);const gm=new Map<string,string>();for(const g of pA)gm.set(g.gene.toUpperCase(),g.gene);return names.map(n=>gm.get(n.toUpperCase())).filter((g):g is string=>!!g);}if(lm==='threshold')return pA.filter(g=>Math.abs(g.log2fc)>=lfM&&g.neglog10p>=nlM).map(g=>g.gene);return[];},[lm,mT,pA,lfM,nlM]);
  const corrG=useMemo(():MG[]=>{if(cmpMd==='manual'&&cmpM.trim()){const names=cmpM.split(/[\n,;\t\s]+/).map(g=>g.trim()).filter(Boolean);const mm=new Map(merged.map(m=>[m.gene.toUpperCase(),m]));return names.map(n=>mm.get(n.toUpperCase())).filter((m):m is MG=>!!m);}return[...merged].sort((a,b)=>(b.nlp_A+b.nlp_B)-(a.nlp_A+a.nlp_B)).slice(0,cmpN);},[cmpMd,cmpM,merged,cmpN]);
  const srSet=useMemo(()=>{if(!srG.trim())return new Set<string>();const q=srG.trim().toUpperCase();return new Set(pA.filter(g=>g.gene.toUpperCase().includes(q)).map(g=>g.gene.toUpperCase()));},[srG,pA]);
  const lfcH=useMemo(()=>cHi(pA.map(g=>g.log2fc),60),[pA]);const pvH=useMemo(()=>cHi(pA.map(g=>g.pval),50),[pA]);
  const qqDt=useMemo(()=>cQQ(pA.map(g=>g.pval)),[pA]);const lGC=useMemo(()=>cLG(pA.map(g=>g.pval)),[pA]);const ksR=useMemo(()=>cKS(pA.map(g=>g.pval)),[pA]);const pi0=useMemo(()=>cP0(pA.map(g=>g.pval)),[pA]);const ccm=useMemo(()=>cCC(dA,fd),[dA,fd]);const conc=useMemo(()=>cCn(merged),[merged]);
  const tData=useMemo(()=>{let f=pA.filter(g=>fSt.includes(g.status));f.sort((a,b)=>{const m=sDir==='asc'?1:-1;if(sCol==='gene')return m*a.gene.localeCompare(b.gene);if(sCol==='log2fc')return m*(a.log2fc-b.log2fc);return m*(a.neglog10p-b.neglog10p);});return f;},[pA,fSt,sCol,sDir]);
  
  // enrichment
  const runE=useCallback(async(ds:'A'|'B'|'both')=>{sEnrL(true);sEnrE(null);try{const run=async(p:GD[])=>{const sg2=p.filter(g=>g.status!=='NS').sort((a,b)=>b.neglog10p-a.neglog10p).map(g=>g.gene);if(!sg2.length)throw new Error('No sig genes');const{terms,tgm}=await gpr(sg2,enr.organism,enr.sources,enr.userThreshold,enr.significanceMethod,enr.noIea);const git=new Map<string,Set<string>>();for(const[t2,gs]of tgm)git.set(t2,new Set(gs.map(g=>g.toUpperCase())));return{terms,genes_in_term:git,query_genes:sg2}as GPR;};if(ds==='A'||ds==='both'){const r=await run(pA);sEnr(p=>({...p,resultA:r}));}if((ds==='B'||ds==='both')&&pB.length>0){const r=await run(pB);sEnr(p=>({...p,resultB:r}));}}catch(e){sEnrE((e as Error).message);}finally{sEnrL(false);}},[pA,pB,enr.organism,enr.sources,enr.userThreshold,enr.significanceMethod,enr.noIea]);
  const tcm=useMemo(()=>{const m=new Map<string,string>();[...new Set([...enr.selectedTermsA,...enr.selectedTermsB])].forEach((id,i)=>{m.set(id,ctc[id]||TPL[i%TPL.length]);});return m;},[enr.selectedTermsA,enr.selectedTermsB,ctc]);
  const eHL=useMemo(():Map<string,{color:string;termName:string}>=>{const m=new Map<string,{color:string;termName:string}>();if(!shEV)return m;const proc=(r:GPR|null,sel:string[])=>{if(!r)return;for(const tid of sel){const c=tcm.get(tid)||'#fff';const t2=r.terms.find(x=>x.native===tid);const g=r.genes_in_term.get(tid);if(g)for(const gn of g)if(!m.has(gn))m.set(gn,{color:c,termName:t2?.name||tid});}};proc(enr.resultA,enr.selectedTermsA);if(mode==='compare')proc(enr.resultB,enr.selectedTermsB);return m;},[shEV,enr,tcm,mode]);
  
  // legends — NO slice limit
  const sLeg=useMemo(():LI[]=>{const it:LI[]=[{color:theme.up,label:'▲ Upregulated',count:stA.up,type:'status'},{color:theme.down,label:'▼ Downregulated',count:stA.down,type:'status'},{color:theme.ns,label:'● NS',count:stA.total-stA.up-stA.down,type:'status'}];if(shEV&&enr.selectedTermsA.length>0){it.push({color:'',label:'',type:'separator'});for(const tid of enr.selectedTermsA){const t2=enr.resultA?.terms.find(x=>x.native===tid);it.push({color:tcm.get(tid)||'#888',label:t2?.name||tid,count:enr.resultA?.genes_in_term.get(tid)?.size,type:'goterm'});}}return it;},[theme,stA,shEV,enr,tcm]);
  const cLeg=useMemo(():LI[]=>{const it:LI[]=[{color:theme.up,label:'▲ UP',type:'status'},{color:theme.down,label:'▼ DOWN',type:'status'},{color:theme.ns,label:'● NS',type:'status'},{color:'',label:'',type:'separator'},{color:buR,label:'▲▲ Both UP',type:'compare'},{color:bdR,label:'▼▼ Both DOWN',type:'compare'},{color:dsc,label:'⚠ Discordant',type:'compare'}];if(shEV&&enr.selectedTermsA.length>0){it.push({color:'',label:'',type:'separator'});for(const tid of enr.selectedTermsA){const t2=enr.resultA?.terms.find(x=>x.native===tid);it.push({color:tcm.get(tid)||'#888',label:t2?.name||tid,count:enr.resultA?.genes_in_term.get(tid)?.size,type:'goterm'});}}return it;},[theme,buR,bdR,dsc,shEV,enr,tcm]);
  
  // exports
  const ePng=useCallback(()=>exR(cR,'volcano','png'),[]);
  const eCsv=useCallback(()=>{saveAs(new Blob([Papa.unparse(pA.map(g=>({gene:g.gene,log2FC:g.log2fc,pvalue:g.pval,padj:g.padj,status:g.status})))],{type:'text/csv'}),'volcano.csv');},[pA]);
  
  // helper components
  const Sl=({label,value,min,max,step,onChange}:{label:string;value:number;min:number;max:number;step:number;onChange:(v:number)=>void})=>(<div><div className="flex justify-between items-center"><Lb color={theme.title}>{label}</Lb><span className="text-xs font-mono" style={{color:theme.accent}}>{value}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} className={`vs w-full ${dk?'dt':'lt'}`}/></div>);
  const Dl=({r,n}:{r:React.RefObject<HTMLDivElement|null>;n:string})=>(<div className="flex items-center gap-1.5 mt-2 pt-2 border-t" style={{borderColor:`${theme.surfaceBorder}60`}}><span className="text-[9px] opacity-40 mr-auto" style={{color:theme.axes}}>600dpi</span><button onClick={()=>exR(r,n,'png')} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border" style={{borderColor:theme.surfaceBorder,color:theme.axes,background:'transparent'}}><Download size={10}/>PNG</button><button onClick={()=>exR(r,n,'svg')} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border" style={{borderColor:theme.surfaceBorder,color:theme.axes,background:'transparent'}}><Download size={10}/>SVG</button></div>);
  const MH=({data,color,label,maxH=100}:{data:{x:number;y:number}[];color:string;label:string;maxH?:number})=>{if(!data.length)return null;const mx=Math.max(...data.map(d=>d.y));return(<div><h4 className="text-sm font-semibold mb-2" style={{color:theme.title}}>{label}</h4><div className="flex items-end gap-px" style={{height:maxH}}>{data.map((d,i)=>(<div key={i} className="flex-1 rounded-t-sm" style={{height:`${(d.y/mx)*100}%`,backgroundColor:color,opacity:.7,minWidth:2}}/>))}</div></div>);};
  const Btn=({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode})=>(<button onClick={onClick} className="py-1.5 rounded-md text-[10px] font-medium border" style={{backgroundColor:active?`${theme.accent}20`:'transparent',borderColor:active?theme.accent:theme.surfaceBorder,color:active?theme.accent:theme.title}}>{children}</button>);
  
  // ══════ RENDER ══════
  return(<div className="flex h-screen overflow-hidden" style={{backgroundColor:theme.bg,fontFamily:'Inter,system-ui,sans-serif'}}>
  <style>{FCS(theme,dk)}</style>
  
  {/* ═══ SIDEBAR ═══ */}
  <aside className="vc flex-shrink-0 overflow-y-auto transition-all duration-300 border-r" style={{width:sO?320:0,backgroundColor:theme.surfaceBg,borderColor:theme.surfaceBorder,color:theme.title}}>{sO&&(<div className="p-4">
    <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{borderColor:theme.surfaceBorder}}><div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{background:`linear-gradient(135deg,${theme.accent},${theme.up})`}}>🌋</div><div><h1 className="text-sm font-bold" style={{color:theme.title}}>VolcanoCraft Pro</h1><p className="text-[10px] font-mono opacity-50" style={{color:theme.axes}}>v3.4</p></div></div>
    <div className="flex rounded-lg p-0.5 mb-3" style={{backgroundColor:theme.bg}}>{(['single','compare']as Mode[]).map(m=>(<button key={m} onClick={()=>setMode(m)} className="flex-1 py-1.5 rounded-md text-xs font-semibold" style={{backgroundColor:mode===m?theme.accent:'transparent',color:mode===m?'#fff':theme.axes}}>{m==='single'?'🔬 Single':'⚖️ Compare'}</button>))}</div>
    <div className="flex items-center gap-1 mb-3">{Object.keys(TH).map(t=>(<button key={t} onClick={()=>setTn(t)} className="flex-1 py-1 rounded text-[10px] font-medium border" style={{backgroundColor:tn===t?theme.accent:'transparent',color:tn===t?'#fff':theme.axes,borderColor:tn===t?theme.accent:theme.surfaceBorder}}>{t==='dark'?'🌙':t==='light'?'☀️':t==='neon'?'⚡':t==='colorblind'?'👁':'🔬'}</button>))}</div>
    <div className="flex gap-1 mb-3"><button onClick={undo} disabled={hI<=0} className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] border disabled:opacity-30" style={{borderColor:theme.surfaceBorder,color:theme.title,background:'transparent'}}><Undo2 size={11}/>Undo</button><button onClick={redo} disabled={hI>=hst.length-1} className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] border disabled:opacity-30" style={{borderColor:theme.surfaceBorder,color:theme.title,background:'transparent'}}><Redo2 size={11}/>Redo</button><button onClick={()=>{try{localStorage.removeItem(SK);}catch{}}} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border" style={{borderColor:theme.surfaceBorder,color:theme.title,background:'transparent'}}><RotateCcw size={11}/></button></div>
  
    {/* Data */}
    <Sec title="Data" icon={Upload} open={sD} toggle={()=>sSd(!sD)} color={theme.title}><div className="space-y-2"><div><Lb color={theme.title}>{mode==='compare'?'Dataset A':'Dataset'}</Lb><label className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs" style={{backgroundColor:theme.surfaceBg,borderColor:theme.surfaceBorder,color:theme.title}}><Upload size={14}/><span className="truncate flex-1">{lA}</span><input type="file" accept={FA} className="hidden" onChange={e=>hF(e,'A')}/></label></div>{mode==='compare'&&<div><Lb color={theme.title}>Dataset B</Lb><label className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs" style={{backgroundColor:theme.surfaceBg,borderColor:theme.surfaceBorder,color:theme.title}}><Upload size={14}/><span className="truncate flex-1">{lB}</span><input type="file" accept={FA} className="hidden" onChange={e=>hF(e,'B')}/></label></div>}{fE&&<div className="text-xs p-2 rounded-lg" style={{backgroundColor:`${theme.up}15`,color:theme.up}}>{fE}</div>}<div className="text-xs p-2 rounded-lg" style={{backgroundColor:`${theme.accent}10`,color:theme.accent}}>A:{stA.total.toLocaleString()}{mode==='compare'&&` · B:${stB.total.toLocaleString()}`} genes</div></div></Sec>
  
    {/* Thresholds */}
    <Sec title="Thresholds" icon={Settings2} open={sT} toggle={()=>sSt(!sT)} color={theme.title}><div className="grid grid-cols-2 gap-2"><div><Lb color={theme.title}>DOWN</Lb><input type="number" min={0} max={10} step={.1} value={tL} onChange={e=>sTL(+e.target.value||0)} className="w-full px-2 py-1.5 rounded-md text-xs border font-mono"/></div><div><Lb color={theme.title}>UP</Lb><input type="number" min={0} max={10} step={.1} value={tR} onChange={e=>sTR(+e.target.value||0)} className="w-full px-2 py-1.5 rounded-md text-xs border font-mono"/></div></div><div><Lb color={theme.title}>Significance</Lb><input type="number" min={.001} max={1} step={.005} value={sg} onChange={e=>sSg(+e.target.value||.05)} className="w-full px-2 py-1.5 rounded-md text-xs border font-mono"/></div><div className="flex items-center gap-2"><button onClick={()=>sFd(!fd)} className="relative w-9 h-5 rounded-full" style={{backgroundColor:fd?theme.accent:theme.grid}}><div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow" style={{left:fd?18:2}}/></button><span className="text-xs" style={{color:theme.title}}>FDR</span></div><div><Lb color={theme.title}>Method</Lb><select value={cm} onChange={e=>sCm(e.target.value as CM)} className="w-full px-2 py-1.5 rounded-md text-xs border font-mono">{Object.entries(CLL).map(([k,l])=>(<option key={k} value={k}>{l}</option>))}</select></div></Sec>
  
    {/* Points & Style — with Shape */}
    <Sec title="Points & Style" icon={Eye} open={sS} toggle={()=>sSs(!sS)} color={theme.title}>
      <div className="grid grid-cols-2 gap-1">{[{id:'categorical',l:'⬤ Classic'},{id:'heatmap',l:'🌡️ Heatmap'},{id:'bubble',l:'◉ Bubble'},{id:'significance',l:'📊 Signif.'}].map(s=>(<Btn key={s.id} active={ps===s.id} onClick={()=>sPs(s.id)}>{s.l}</Btn>))}</div>
      <div><Lb color={theme.title}>Point Shape</Lb><div className="grid grid-cols-2 gap-1">{(['circle','diamond','square','triangle']).map(id=>(<Btn key={id} active={sh===id} onClick={()=>sSh(id)}>{id==='circle'?'● Circle':id==='diamond'?'◆ Diamond':id==='square'?'■ Square':'▲ Triangle'}</Btn>))}</div></div>
      <Sl label="Size" value={sz} min={1} max={15} step={.5} onChange={sSz}/>
      <Sl label="Opacity" value={al} min={.1} max={1} step={.05} onChange={sAl}/>
    </Sec>
  
    {/* Colors */}
    <Sec title="Colors" icon={Eye} open={sC} toggle={()=>sSc(!sC)} color={theme.title}><div className="grid grid-cols-3 gap-2"><div><Lb color={theme.title}>▲ UP</Lb><input type="color" value={cU||theme.up} onChange={e=>sCU(e.target.value)} className="w-8 h-7 rounded border-0 cursor-pointer bg-transparent"/></div><div><Lb color={theme.title}>▼ DOWN</Lb><input type="color" value={cD||theme.down} onChange={e=>sCD(e.target.value)} className="w-8 h-7 rounded border-0 cursor-pointer bg-transparent"/></div><div><Lb color={theme.title}>● NS</Lb><input type="color" value={cN||theme.ns} onChange={e=>sCN(e.target.value)} className="w-8 h-7 rounded border-0 cursor-pointer bg-transparent"/></div></div>{mode==='compare'&&(<><div className="pt-2 mt-1 border-t" style={{borderColor:theme.surfaceBorder}}><Lb color={theme.title}>Compare</Lb></div><div className="grid grid-cols-3 gap-2"><div><Lb color={theme.title}>⚠</Lb><input type="color" value={dsc} onChange={e=>sDsc(e.target.value)} className="w-8 h-7 rounded border-0 cursor-pointer bg-transparent"/></div><div><Lb color={theme.title}>▲▲</Lb><input type="color" value={buC||theme.up} onChange={e=>sBuC(e.target.value)} className="w-8 h-7 rounded border-0 cursor-pointer bg-transparent"/></div><div><Lb color={theme.title}>▼▼</Lb><input type="color" value={bdC||theme.down} onChange={e=>sBdC(e.target.value)} className="w-8 h-7 rounded border-0 cursor-pointer bg-transparent"/></div></div></>)}<button onClick={()=>{sCU('');sCD('');sCN('');sDsc('#f59e0b');sBuC('');sBdC('');}} className="w-full py-1.5 rounded-md text-[10px] border" style={{borderColor:theme.surfaceBorder,color:theme.title,background:'transparent'}}>Reset</button></Sec>
  
    {/* Labels + Corridor */}
    <Sec title="Labels" icon={Sigma} open={sL} toggle={()=>sSl(!sL)} color={theme.title}>
      <div className="flex rounded-lg p-0.5" style={{backgroundColor:theme.bg}}>{(['topn','manual','threshold']as const).map(m=>(<button key={m} onClick={()=>sLm(m)} className="flex-1 py-1 rounded-md text-[10px] font-medium" style={{backgroundColor:lm===m?theme.accent:'transparent',color:lm===m?'#fff':theme.axes}}>{m==='topn'?'Top N':m==='manual'?'Manual':'Thr'}</button>))}</div>
      {lm==='topn'&&<Sl label="N" value={tN} min={0} max={50} step={1} onChange={v=>sTN(Math.round(v))}/>}
      {lm==='manual'&&(<div><textarea value={mT} onChange={e=>sMT(e.target.value)} placeholder={"TP53\nEGFR\nBRCA1"} rows={4} className="w-full px-2 py-1.5 rounded-md text-xs border font-mono resize-none"/>{manGenes.length>0&&<div className="text-[10px] mt-1 p-1.5 rounded" style={{backgroundColor:`${theme.accent}10`,color:theme.accent}}>✓ {manGenes.length} found: {manGenes.slice(0,5).join(', ')}{manGenes.length>5?'…':''}</div>}{mT.trim()&&manGenes.length===0&&<div className="text-[10px] mt-1 p-1.5 rounded" style={{backgroundColor:`${theme.up}15`,color:theme.up}}>⚠ No match</div>}</div>)}
      {lm==='threshold'&&<div className="grid grid-cols-2 gap-2"><div><Lb color={theme.title}>|FC|≥</Lb><input type="number" value={lfM} onChange={e=>sLfM(+e.target.value)} className="w-full px-2 py-1 rounded text-xs border font-mono"/></div><div><Lb color={theme.title}>-log₁₀p≥</Lb><input type="number" value={nlM} onChange={e=>sNlM(+e.target.value)} className="w-full px-2 py-1 rounded text-xs border font-mono"/></div></div>}
      <Sl label="Font" value={lS} min={6} max={14} step={1} onChange={v=>sLS(Math.round(v))}/>
      {mode==='compare'&&(<div className="space-y-2 pt-2 mt-1 border-t" style={{borderColor:theme.surfaceBorder}}>
        <Lb color={theme.title}>Compare Corridor</Lb>
        <div className="flex rounded-lg p-0.5" style={{backgroundColor:theme.bg}}>
          <button onClick={()=>sCmpMd('auto')} className="flex-1 py-1 rounded-md text-[10px] font-medium" style={{backgroundColor:cmpMd==='auto'?theme.accent:'transparent',color:cmpMd==='auto'?'#fff':theme.axes}}>Auto Top-N</button>
          <button onClick={()=>sCmpMd('manual')} className="flex-1 py-1 rounded-md text-[10px] font-medium" style={{backgroundColor:cmpMd==='manual'?theme.accent:'transparent',color:cmpMd==='manual'?'#fff':theme.axes}}>Manual Pick</button>
        </div>
        {cmpMd==='auto'?<Sl label="Top N" value={cmpN} min={3} max={60} step={1} onChange={v=>sCmpN(Math.round(v))}/>:(
          <div><textarea value={cmpM} onChange={e=>sCmpM(e.target.value)} placeholder={"TP53\nEGFR\nKRAS"} rows={4} className="w-full px-2 py-1.5 rounded-md text-xs border font-mono resize-none"/>
          {corrG.length>0&&<div className="text-[10px] mt-1 p-1.5 rounded" style={{backgroundColor:`${theme.accent}10`,color:theme.accent}}>✓ {corrG.length} common: {corrG.slice(0,5).map(g=>g.gene).join(', ')}{corrG.length>5?'…':''}</div>}
          {cmpM.trim()&&corrG.length===0&&<div className="text-[10px] mt-1 p-1.5 rounded" style={{backgroundColor:`${theme.up}15`,color:theme.up}}>⚠ No common genes</div>}</div>
        )}
      </div>)}
    </Sec>
  
    {/* Compare Design — ALL options */}
    {mode==='compare'&&<Sec title="Compare Design" icon={Eye} open={sCS} toggle={()=>sScs(!sCS)} color={theme.title}>
      <div><Lb color={theme.title}>Line Type</Lb><div className="grid grid-cols-2 gap-1">{(['bezier','straight','step','arc']).map(id=>(<Btn key={id} active={cls===id} onClick={()=>sCls(id)}>{id==='bezier'?'〰️ Curves':id==='straight'?'📏 Straight':id==='step'?'📐 Steps':'🌈 Arcs'}</Btn>))}</div></div>
      <div><Lb color={theme.title}>Dash</Lb><div className="grid grid-cols-2 gap-1">{(['solid','dashed','dotted','dashdot']).map(id=>(<Btn key={id} active={cld===id} onClick={()=>sCld(id)}>{id==='solid'?'── Solid':id==='dashed'?'- - Dash':id==='dotted'?'··· Dot':'-.  Mix'}</Btn>))}</div></div>
      <div><Lb color={theme.title}>Link Marker</Lb><div className="grid grid-cols-3 gap-1">{(['mixed','circle','diamond','square','triangle','star']).map(id=>(<Btn key={id} active={clm===id} onClick={()=>sClm(id)}>{id==='mixed'?'🎲':id==='circle'?'●':id==='diamond'?'◆':id==='square'?'■':id==='triangle'?'▲':'★'}</Btn>))}</div></div>
      <Sl label="Line Width" value={clw} min={.5} max={5} step={.5} onChange={sClw}/>
      <div className="pt-2 mt-1 border-t" style={{borderColor:theme.surfaceBorder}}>
        <Lb color={theme.title}>Panel Points</Lb>
        <div className="grid grid-cols-2 gap-1">{(['circle','diamond','square','triangle']).map(id=>(<Btn key={id} active={cpSh===id} onClick={()=>sCpSh(id)}>{id==='circle'?'●':id==='diamond'?'◆':id==='square'?'■':'▲'} {id}</Btn>))}</div>
        <Sl label="Panel Size" value={cpSz} min={1} max={12} step={.5} onChange={sCpSz}/>
        <div className="flex items-center gap-2 mt-1"><button onClick={()=>sCns(!cns)} className="relative w-9 h-5 rounded-full" style={{backgroundColor:cns?theme.accent:theme.grid}}><div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow" style={{left:cns?18:2}}/></button><span className="text-xs" style={{color:theme.title}}>Show NS</span></div>
      </div>
    </Sec>}
  
    {/* g:Profiler */}
    <Sec title="g:Profiler" icon={FlaskConical} open={sE} toggle={()=>sSe(!sE)} color={theme.title}><div className="space-y-2">
      <div><Lb color={theme.title}>Organism</Lb><select value={enr.organism} onChange={e=>sEnr(p=>({...p,organism:e.target.value}))} className="w-full px-2 py-1.5 rounded-md text-xs border font-mono"><option value="hsapiens">H.sapiens</option><option value="mmusculus">M.musculus</option><option value="drerio">D.rerio</option></select></div>
      <div><Lb color={theme.title}>Sources</Lb><div className="flex flex-wrap gap-1">{GSR.map(s=>(<Btn key={s.id} active={enr.sources.includes(s.id)} onClick={()=>sEnr(p=>({...p,sources:p.sources.includes(s.id)?p.sources.filter(x=>x!==s.id):[...p.sources,s.id]}))}>{s.id}</Btn>))}</div></div>
      <button onClick={()=>runE(mode==='compare'?'both':'A')} disabled={enrL} className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2" style={{backgroundColor:enrL?theme.grid:theme.accent,color:'#fff'}}>{enrL?<><RefreshCw size={13} className="animate-spin"/>Running...</>:<><FlaskConical size={13}/>Run</>}</button>
      {enrE&&<div className="text-xs p-2 rounded-lg" style={{backgroundColor:`${theme.up}15`,color:theme.up}}>{enrE}</div>}
      {(enr.resultA||enr.resultB)&&(<div className="space-y-2">
        <div className="flex items-center gap-2"><button onClick={()=>sShEV(!shEV)} className="relative w-9 h-5 rounded-full" style={{backgroundColor:shEV?theme.accent:theme.grid}}><div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow" style={{left:shEV?18:2}}/></button><span className="text-xs" style={{color:theme.title}}>On Volcano</span></div>
        {shEV&&(<div><Lb color={theme.title}>GO Mode</Lb><div className="grid grid-cols-2 gap-1"><Btn active={gM==='overlay'} onClick={()=>sGM('overlay')}>🔵 Overlay</Btn><Btn active={gM==='replace'} onClick={()=>sGM('replace')}>🎨 Replace</Btn></div><div className="text-[9px] mt-1 opacity-60" style={{color:theme.axes}}>{gM==='overlay'?'Rings on top':'Colors replace all'}</div></div>)}
      </div>)}
      {enr.resultA&&<div className="text-xs p-2 rounded-lg" style={{backgroundColor:`${theme.accent}10`,color:theme.accent}}>{enr.resultA.terms.length} terms · {enr.selectedTermsA.length} sel</div>}
      {enr.resultA&&(<div className="space-y-1.5 pt-1 border-t" style={{borderColor:theme.surfaceBorder}}>
        <div className="relative"><Search size={11} className="absolute left-2 top-2 opacity-40" style={{color:theme.axes}}/><input type="text" value={sES} onChange={e=>sSES(e.target.value)} placeholder="Search..." className="w-full pl-7 pr-2 py-1.5 rounded-md text-[10px] border"/></div>
        <div className="flex flex-wrap gap-0.5">{['all','GO:BP','GO:MF','GO:CC','KEGG','REAC'].map(s=>(<Btn key={s} active={sEF===s} onClick={()=>sSEF(s)}>{s==='all'?'All':s}</Btn>))}</div>
        <div className="max-h-52 overflow-y-auto space-y-0.5">{enr.resultA.terms.filter(t2=>(sES===''||t2.name.toLowerCase().includes(sES.toLowerCase()))&&(sEF==='all'||t2.source===sEF)).slice(0,60).map(term=>{const sel=enr.selectedTermsA.includes(term.native);const tc=tcm.get(term.native)||(sel?TPL[enr.selectedTermsA.indexOf(term.native)%TPL.length]:theme.axes);return(<div key={term.native} className="flex items-center gap-0.5"><button onClick={()=>sEnr(p=>({...p,selectedTermsA:sel?p.selectedTermsA.filter(x=>x!==term.native):[...p.selectedTermsA,term.native]}))} className="flex-1 text-left px-1.5 py-1 rounded text-[9px] hover:opacity-80 min-w-0" style={{backgroundColor:sel?`${tc}20`:'transparent',borderLeft:sel?`3px solid ${tc}`:'3px solid transparent'}}><div className="flex items-center gap-1"><span className="font-mono text-[7px] px-0.5 rounded" style={{backgroundColor:`${theme.accent}15`,color:theme.accent}}>{term.source}</span><span className="font-semibold truncate" style={{color:sel?tc:theme.title}}>{term.name}</span></div><span className="font-mono opacity-60 text-[8px]" style={{color:theme.axes}}>p={term.p_value.toExponential(1)} · {term.intersection_size}/{term.term_size}</span></button>{sel&&<input type="color" value={ctc[term.native]||tc} onChange={e=>sCtc(p=>({...p,[term.native]:e.target.value}))} className="w-4 h-4 rounded-full border-0 cursor-pointer bg-transparent p-0 flex-shrink-0"/>}</div>);})}</div>
        {enr.selectedTermsA.length>0&&<button onClick={()=>sEnr(p=>({...p,selectedTermsA:[]}))} className="w-full py-1 rounded text-[9px] border" style={{borderColor:theme.surfaceBorder,color:theme.title,background:'transparent'}}>Clear</button>}
      </div>)}
    </div></Sec>
  
    {/* Statistics sidebar */}
    <Sec title="Statistics" icon={FlaskConical} open={sStat} toggle={()=>sSStat(!sStat)} color={theme.title}><div className="space-y-1 text-xs"><div className="flex justify-between"><span style={{color:theme.title}}>π₀</span><span className="font-mono font-semibold" style={{color:theme.accent}}>{pi0.pi0.toFixed(4)}</span></div><div className="flex justify-between"><span style={{color:theme.title}}>λ_GC</span><span className="font-mono" style={{color:lGC>1.1?theme.up:theme.accent}}>{lGC.toFixed(4)}</span></div><div className="flex justify-between"><span style={{color:theme.title}}>KS D</span><span className="font-mono" style={{color:theme.axes}}>{ksR.D.toFixed(4)}</span></div></div></Sec>
  </div>)}</aside>
  {/* ═══ END SIDEBAR — continue with BLOC 3 for main content ═══ */}


<main className="flex-1 flex flex-col overflow-hidden">
<header className="flex items-center px-4 py-2.5 border-b flex-shrink-0 gap-2" style={{borderColor:theme.surfaceBorder,backgroundColor:theme.surfaceBg}}>
  <button onClick={()=>setSO(!sO)} className="p-1.5 rounded-lg" style={{color:theme.axes,background:'transparent'}}>{sO?<X size={18}/>:<Menu size={18}/>}</button>
  <div className="flex gap-1">{([
    {id:'volcano'as Tab,icon:Mountain,l:'Volcano'},
    {id:'enrichment'as Tab,icon:FlaskConical,l:'g:Profiler'},
    {id:'analysis'as Tab,icon:BarChart3,l:'Analysis'},
    {id:'stats'as Tab,icon:Sigma,l:'Stats'},
    {id:'data'as Tab,icon:Table2,l:'Data'}
  ]).map(t2=>(<button key={t2.id} onClick={()=>setTab(t2.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{backgroundColor:tab===t2.id?`${theme.accent}20`:'transparent',color:tab===t2.id?theme.accent:theme.axes}}><t2.icon size={14}/>{t2.l}</button>))}</div>
  <div className="vc relative ml-2"><Search size={12} className="absolute left-2 top-2" style={{color:theme.axes,opacity:.5}}/><input type="text" value={srG} onChange={e=>sSrG(e.target.value)} placeholder="Search gene..." className="pl-7 pr-2 py-1.5 rounded-lg text-xs border w-36"/></div>
  <div className="flex-1"/>
  <div className="flex items-center gap-1.5">
    <button onClick={ePng} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border" style={{borderColor:theme.surfaceBorder,color:theme.axes,background:'transparent'}}><Download size={13}/>PNG 600dpi</button>
    <button onClick={()=>exR(cR,'volcano','svg')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border" style={{borderColor:theme.accent,color:theme.accent,background:'transparent'}}><Download size={13}/>SVG</button>
    <button onClick={eCsv} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border" style={{borderColor:theme.surfaceBorder,color:theme.axes,background:'transparent'}}><Download size={13}/>CSV</button>
  </div>
</header>

<div className="flex-1 overflow-y-auto p-4">

{/* ═══ VOLCANO TAB ═══ */}
{tab==='volcano'&&(<div className="space-y-4">
  {/* Stats cards */}
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[{l:'Total',v:stA.total.toLocaleString(),ic:Layers,c:theme.axes},{l:'Up',v:stA.up.toLocaleString(),ic:ArrowUpDown,c:theme.up},{l:'Down',v:stA.down.toLocaleString(),ic:ArrowUpDown,c:theme.down},{l:'Sig',v:`${stA.up+stA.down}`,ic:Sigma,c:theme.accent}].map((s,i)=>(<div key={i} className="rounded-xl p-3 border" style={{backgroundColor:theme.surfaceBg,borderColor:theme.surfaceBorder}}><div className="flex items-center gap-2 mb-1"><s.ic size={14} style={{color:s.c}}/><span className="text-[10px] opacity-60" style={{color:theme.title}}>{s.l}</span></div><div className="text-xl font-bold" style={{color:s.c}}>{s.v}</div></div>))}</div>

  {/* GO terms banner */}
  {shEV&&eHL.size>0&&(<div className="rounded-xl border p-3" style={{borderColor:theme.surfaceBorder,backgroundColor:theme.surfaceBg}}>
    <div className="flex items-center gap-2 mb-2"><FlaskConical size={14} style={{color:theme.accent}}/><span className="text-xs font-semibold" style={{color:theme.title}}>GO on Volcano ({eHL.size} genes)</span></div>
    <div className="flex flex-wrap gap-2">{[...tcm.entries()].map(([id,color])=>{const tr=(enr.resultA||enr.resultB)?.terms.find(x=>x.native===id);return<div key={id} className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px]" style={{backgroundColor:`${color}20`,border:`1px solid ${color}40`}}><input type="color" value={color} onChange={e=>sCtc(p=>({...p,[id]:e.target.value}))} className="w-3 h-3 rounded-full border-0 cursor-pointer bg-transparent p-0"/><span style={{color:theme.axes}}>{tr?.name||id}</span></div>;})}</div>
  </div>)}

  {/* SINGLE MODE */}
  {mode==='single'?(
    <div ref={cR} className="rounded-xl border overflow-hidden" style={{borderColor:theme.surfaceBorder}}>
      <div className="px-4 py-2 border-b flex items-center gap-2" style={{borderColor:theme.surfaceBorder,backgroundColor:theme.surfaceBg}}><Mountain size={15} style={{color:theme.accent}}/><span className="text-sm font-semibold" style={{color:theme.title}}>{lA}</span></div>
      <VCan data={pA} t={theme} tL={tL} tR={tR} sig={sg} sz={sz} al={al} ps={ps} topN={lm==='topn'?tN:0} manG={manGenes} lSz={lS} eHL={eHL} sh={sh} leg={sLeg} srHL={srSet} gM={gM}/>
      <Dl r={cR} n="volcano"/>
    </div>
  ):(
  /* COMPARE MODE */
  <div className="space-y-4">
    <div ref={cR} className="rounded-xl border overflow-hidden" style={{borderColor:theme.surfaceBorder}}>
      <div className="px-4 py-2 border-b flex items-center justify-between" style={{borderColor:theme.surfaceBorder,backgroundColor:theme.surfaceBg}}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{color:theme.title}}>Compare</span>
          <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{backgroundColor:`${theme.up}20`,color:theme.up}}>{lA}:▲{stA.up}▼{stA.down}</span>
          <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{backgroundColor:`${theme.down}20`,color:theme.down}}>{lB}:▲{stB.up}▼{stB.down}</span>
        </div>
        <span className="text-[10px] font-mono opacity-50" style={{color:theme.axes}}>{merged.length} common · {corrG.length} corridor</span>
      </div>
      <CCan dA={pA} dB={pB} mg={merged} t={theme} tL={tL} tR={tR} sig={sg} sz={sz} al={al} lA={lA} lB={lB} cG={corrG} eHL={eHL} ls={cls} ms={clm} ld={cld} lw={clw} cpSz={cpSz} cpSh={cpSh} ps={ps} nV={cns} dC={dsc} bU={buR} bD={bdR} leg={cLeg} srHL={srSet} manG={manGenes} gM={gM}/>
      <Dl r={cR} n="compare"/>
    </div>

    {/* Concordance stats */}
    {conc&&(<div className="rounded-xl border p-4" style={{borderColor:theme.surfaceBorder,backgroundColor:theme.surfaceBg}}>
      <h3 className="text-sm font-bold mb-3" style={{color:theme.title}}>Concordance ({conc.total})</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{[{l:'Pearson',v:conc.pearsonR.toFixed(3)},{l:'Spearman',v:conc.spearmanRho.toFixed(3)},{l:'κ',v:conc.kappa.toFixed(3)},{l:'Conc%',v:`${conc.pctConc.toFixed(1)}%`},{l:'Discord',v:String(conc.discordant)}].map((s,i)=>(<div key={i} className="rounded-lg p-3" style={{backgroundColor:theme.bg}}><div className="text-[10px] opacity-60 mb-1" style={{color:theme.title}}>{s.l}</div><div className="text-lg font-bold font-mono" style={{color:theme.accent}}>{s.v}</div></div>))}</div>
    </div>)}

    {/* Concordance Scatter + Venn — RESTORED */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl border p-4" style={{borderColor:theme.surfaceBorder,backgroundColor:theme.surfaceBg}}>
        <h4 className="text-sm font-semibold mb-2" style={{color:theme.title}}>Concordance Scatter</h4>
        <div ref={csR}><CSCan mg={merged} t={theme} lA={lA} lB={lB}/></div>
        <Dl r={csR} n="concordance"/>
      </div>
      <div className="rounded-xl border p-4" style={{borderColor:theme.surfaceBorder,backgroundColor:theme.surfaceBg}}>
        <h4 className="text-sm font-semibold mb-2" style={{color:theme.title}}>Venn Overlap</h4>
        <div ref={vnR}><VnCan dA={pA} dB={pB} t={theme} lA={lA} lB={lB}/></div>
        <Dl r={vnR} n="venn"/>
      </div>
    </div>
  </div>)}
</div>)}

{/* ═══ ENRICHMENT TAB — RESTORED ═══ */}
{tab==='enrichment'&&(<div className="space-y-6 max-w-6xl">
  <h2 className="text-lg font-bold" style={{color:theme.title}}>g:Profiler Enrichment</h2>
  <div className="rounded-xl border p-4" style={{borderColor:theme.surfaceBorder,backgroundColor:theme.surfaceBg}}>
    <div className="flex flex-wrap items-end gap-4">
      <button onClick={()=>runE(mode==='compare'?'both':'A')} disabled={enrL} className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2" style={{backgroundColor:enrL?theme.grid:theme.accent,color:'#fff'}}>{enrL?<><RefreshCw size={13} className="animate-spin"/>...</>:<><FlaskConical size={13}/>Run</>}</button>
      {(enr.resultA||enr.resultB)&&<button onClick={()=>sShEV(!shEV)} className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border" style={{backgroundColor:shEV?`${theme.accent}20`:'transparent',borderColor:shEV?theme.accent:theme.surfaceBorder,color:shEV?theme.accent:theme.axes}}><Mountain size={13}/>{shEV?'✓ On Volcano':'Show on Volcano'}</button>}
    </div>
    {enrE&&<div className="text-xs p-2 rounded-lg mt-3" style={{backgroundColor:`${theme.up}15`,color:theme.up}}>{enrE}</div>}
    <div className="flex items-center gap-1 mt-3">{['all','GO:BP','GO:MF','GO:CC','KEGG','REAC'].map(s=>(<Btn key={s} active={sEF===s} onClick={()=>sSEF(s)}>{s==='all'?'All':s}</Btn>))}</div>
  </div>
  {enr.resultA&&(<div className="rounded-xl border p-4" style={{borderColor:theme.surfaceBorder,backgroundColor:theme.surfaceBg}}>
    <h4 className="text-xs font-bold mb-2" style={{color:theme.title}}>{lA} — {enr.resultA.terms.length} terms · {enr.selectedTermsA.length} selected</h4>
    <div className="relative mb-2"><Search size={12} className="absolute left-2 mt-2 opacity-40" style={{color:theme.axes}}/><input type="text" value={sES} onChange={e=>sSES(e.target.value)} placeholder="Search..." className="vc w-full pl-7 pr-2 py-1.5 rounded-md text-xs border"/></div>
    <div className="max-h-80 overflow-y-auto space-y-0.5">{enr.resultA.terms.filter(t2=>(sES===''||t2.name.toLowerCase().includes(sES.toLowerCase()))&&(sEF==='all'||t2.source===sEF)).slice(0,80).map(term=>{const sel=enr.selectedTermsA.includes(term.native);const tc=tcm.get(term.native)||(sel?TPL[enr.selectedTermsA.indexOf(term.native)%TPL.length]:theme.axes);return(<div key={term.native} className="flex items-center gap-1"><button onClick={()=>sEnr(p=>({...p,selectedTermsA:sel?p.selectedTermsA.filter(x=>x!==term.native):[...p.selectedTermsA,term.native]}))} className="flex-1 text-left px-2 py-1.5 rounded text-[10px] hover:opacity-80" style={{backgroundColor:sel?`${tc}20`:'transparent',borderLeft:sel?`3px solid ${tc}`:'3px solid transparent'}}><div className="flex items-center gap-1"><span className="font-mono text-[9px] px-1 py-0.5 rounded" style={{backgroundColor:`${theme.accent}15`,color:theme.accent}}>{term.source}</span><span className="font-semibold truncate" style={{color:sel?tc:theme.title}}>{term.name}</span></div><span className="font-mono opacity-60 text-[9px]" style={{color:theme.axes}}>p={term.p_value.toExponential(1)} · {term.intersection_size}/{term.term_size}</span></button>{sel&&<input type="color" value={ctc[term.native]||tc} onChange={e=>sCtc(p=>({...p,[term.native]:e.target.value}))} className="w-5 h-5 rounded-full border-0 cursor-pointer bg-transparent p-0"/>}</div>);})}</div>
    {enr.selectedTermsA.length>0&&<button onClick={()=>sEnr(p=>({...p,selectedTermsA:[]}))} className="w-full py-1 mt-2 rounded text-[9px] border" style={{borderColor:theme.surfaceBorder,color:theme.title,background:'transparent'}}>Clear selection</button>}
  </div>)}
  {!enr.resultA&&!enrL&&<div className="rounded-xl border p-8 text-center" style={{borderColor:theme.surfaceBorder,backgroundColor:theme.surfaceBg}}><FlaskConical size={24} style={{color:theme.accent}} className="mx-auto mb-2"/><p className="text-xs opacity-60" style={{color:theme.axes}}>Click Run g:Profiler</p></div>}
</div>)}

{/* ═══ ANALYSIS TAB ═══ */}
{tab==='analysis'&&(<div className="space-y-6 max-w-5xl">
  <h2 className="text-lg font-bold" style={{color:theme.title}}>Analysis</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="rounded-xl border p-4" style={{backgroundColor:theme.surfaceBg,borderColor:theme.surfaceBorder}}><MH data={lfcH} color={theme.accent} label="log₂FC Distribution" maxH={120}/></div>
    <div className="rounded-xl border p-4" style={{backgroundColor:theme.surfaceBg,borderColor:theme.surfaceBorder}}><MH data={pvH} color={theme.up} label="P-value Distribution" maxH={120}/></div>
  </div>
  <div className="rounded-xl border p-4" style={{backgroundColor:theme.surfaceBg,borderColor:theme.surfaceBorder}}>
    <h4 className="text-sm font-semibold mb-3" style={{color:theme.title}}>QQ Plot · λ_GC={lGC.toFixed(3)}</h4>
    <div ref={qR}><QCan data={qqDt} t={theme}/></div><Dl r={qR} n="qq"/>
  </div>
  {pA.some(g=>g.baseMean!=null)&&<div className="rounded-xl border p-4" style={{backgroundColor:theme.surfaceBg,borderColor:theme.surfaceBorder}}>
    <h4 className="text-sm font-semibold mb-3" style={{color:theme.title}}>MA Plot</h4>
    <div ref={mR}><MCan data={pA} t={theme}/></div><Dl r={mR} n="ma"/>
  </div>}
  {/* Sensitivity Table — RESTORED */}
  <div className="rounded-xl border p-4" style={{backgroundColor:theme.surfaceBg,borderColor:theme.surfaceBorder}}>
    <h4 className="text-sm font-semibold mb-3" style={{color:theme.title}}>Sensitivity</h4>
    <RbT data={dA} fdr={fd} cm={cm} t={theme}/>
  </div>
  <div className="rounded-xl border p-4" style={{backgroundColor:theme.surfaceBg,borderColor:theme.surfaceBorder}}>
    <h4 className="text-sm font-semibold mb-3" style={{color:theme.title}}>Forest Plot</h4>
    <div ref={fR}><FCan data={pA} t={theme}/></div><Dl r={fR} n="forest"/>
  </div>
  <div className="rounded-xl border p-4" style={{backgroundColor:theme.surfaceBg,borderColor:theme.surfaceBorder}}>
    <h4 className="text-sm font-semibold mb-3" style={{color:theme.title}}>Waterfall</h4>
    <div ref={wR}><WCan data={pA} t={theme}/></div><Dl r={wR} n="waterfall"/>
  </div>
</div>)}

{/* ═══ STATS TAB ═══ */}
{tab==='stats'&&(<div className="space-y-6 max-w-5xl">
  <h2 className="text-lg font-bold" style={{color:theme.title}}>Statistics</h2>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[{l:'π₀',v:pi0.pi0.toFixed(4)},{l:'λ_GC',v:lGC.toFixed(4)},{l:'KS D',v:ksR.D.toFixed(4)},{l:'E[FD]',v:(pi0.pi0*stA.total*sg).toFixed(1)}].map((s,i)=>(<div key={i} className="rounded-xl p-4 border" style={{backgroundColor:theme.surfaceBg,borderColor:theme.surfaceBorder}}><div className="text-[10px] opacity-60 mb-1" style={{color:theme.title}}>{s.l}</div><div className="text-2xl font-bold font-mono" style={{color:theme.accent}}>{s.v}</div></div>))}</div>
  <div className="rounded-xl border p-4" style={{backgroundColor:theme.surfaceBg,borderColor:theme.surfaceBorder}}>
    <h4 className="text-sm font-semibold mb-3" style={{color:theme.title}}>Correction Methods Comparison</h4>
    <table className="w-full text-xs" style={{color:theme.axes}}><thead><tr className="border-b" style={{borderColor:theme.surfaceBorder}}><th className="text-left py-2 px-3" style={{color:theme.title}}>Method</th><th className="text-right py-2 px-3" style={{color:theme.title}}>Sig α=0.05</th><th className="text-right py-2 px-3" style={{color:theme.title}}>Min padj</th></tr></thead><tbody>{ccm.map((r,i)=>(<tr key={i} className="border-b" style={{borderColor:`${theme.surfaceBorder}40`}}><td className="py-2 px-3 font-semibold" style={{color:theme.title}}>{r.method}</td><td className="py-2 px-3 text-right font-mono font-bold" style={{color:theme.accent}}>{r.n}</td><td className="py-2 px-3 text-right font-mono" style={{color:theme.axes}}>{r.min.toExponential(2)}</td></tr>))}</tbody></table>
  </div>
  {/* Pi0 Curve — RESTORED */}
  <div className="rounded-xl border p-4" style={{backgroundColor:theme.surfaceBg,borderColor:theme.surfaceBorder}}>
    <h4 className="text-sm font-semibold mb-3" style={{color:theme.title}}>π₀ Curve</h4>
    <div ref={piR}><P0Can data={pi0.curve} pv={pi0.pi0} t={theme}/></div><Dl r={piR} n="pi0"/>
  </div>
</div>)}

{/* ═══ DATA TAB ═══ */}
{tab==='data'&&(<div className="space-y-4">
  <div className="flex flex-wrap items-end gap-3">
    <div><Lb color={theme.title}>Status</Lb><div className="flex gap-1">{['UP','DOWN','NS'].map(s=>(<button key={s} onClick={()=>sFSt(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])} className="px-2 py-1 rounded text-xs font-semibold border" style={{backgroundColor:fSt.includes(s)?`${s==='UP'?theme.up:s==='DOWN'?theme.down:theme.ns}20`:'transparent',borderColor:fSt.includes(s)?(s==='UP'?theme.up:s==='DOWN'?theme.down:theme.ns):theme.surfaceBorder,color:s==='UP'?theme.up:s==='DOWN'?theme.down:theme.ns}}>{s}</button>))}</div></div>
    <span className="text-xs font-mono" style={{color:theme.accent}}>{tData.length} genes</span>
  </div>
  <div className="rounded-xl border overflow-hidden" style={{borderColor:theme.surfaceBorder}}>
    <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
      <table className="w-full text-xs" style={{color:theme.axes}}>
        <thead className="sticky top-0" style={{backgroundColor:theme.surfaceBg}}>
          <tr className="border-b" style={{borderColor:theme.surfaceBorder}}>
            {[{id:'gene'as const,l:'Gene'},{id:'log2fc'as const,l:'log₂FC'},{id:'neglog10p'as const,l:'-log₁₀p'}].map(c=>(<th key={c.id} onClick={()=>{sSCol(c.id);sSDir(d=>d==='asc'?'desc':'asc');}} className="py-2 px-3 font-semibold cursor-pointer text-left" style={{color:theme.title}}>{c.l}{sCol===c.id?(sDir==='asc'?' ↑':' ↓'):''}</th>))}
            <th className="py-2 px-3 text-right" style={{color:theme.title}}>padj</th>
            <th className="py-2 px-3 text-center" style={{color:theme.title}}>Status</th>
          </tr>
        </thead>
        <tbody>{tData.slice(0,500).map(g=>(<tr key={g.gene} className="border-b" style={{borderColor:`${theme.surfaceBorder}40`}}>
          <td className="py-1.5 px-3 font-mono font-semibold" style={{color:theme.title}}>{g.gene}</td>
          <td className="py-1.5 px-3 font-mono" style={{color:g.log2fc>0?theme.up:g.log2fc<0?theme.down:theme.axes}}>{g.log2fc.toFixed(4)}</td>
          <td className="py-1.5 px-3 font-mono" style={{color:theme.axes}}>{g.neglog10p.toFixed(3)}</td>
          <td className="py-1.5 px-3 text-right font-mono" style={{color:theme.axes}}>{g.padj.toExponential(2)}</td>
          <td className="py-1.5 px-3 text-center"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{backgroundColor:`${g.status==='UP'?theme.up:g.status==='DOWN'?theme.down:theme.ns}20`,color:g.status==='UP'?theme.up:g.status==='DOWN'?theme.down:theme.ns}}>{g.status}</span></td>
        </tr>))}</tbody>
      </table>
    </div>
  </div>
</div>)}

</div>{/* end flex-1 overflow */}
</main>
</div>);}{/* end App return + component */}

// ═══ END BLOC 3 — continue with BLOC 4 for all canvas components ═══
// ═══ BLOC 4/4: All canvas components ═══

/* ═══ SINGLE VOLCANO — tooltip, zoom/pan, GO, manual labels, search, legend ═══ */
function VCan({data,t,tL,tR,sig,sz,al,ps,topN,manG,lSz,eHL,sh='circle',leg=[],srHL,gM='overlay'}:{data:GD[];t:TC;tL:number;tR:number;sig:number;sz:number;al:number;ps:string;topN:number;manG:string[];lSz:number;eHL?:Map<string,{color:string;termName:string}>;sh?:string;leg?:LI[];srHL?:Set<string>;gM?:string}){
  const cr=useRef<HTMLCanvasElement>(null),dr=useRef<HTMLDivElement>(null),[w,sW]=useState(800);const H=560;
  const[tt,sTt]=useState<TT|null>(null);const[zm,sZm]=useState(1);const[px2,sPx]=useState(0);const[py2,sPy]=useState(0);
  const ip=useRef(false);const ps2=useRef({x:0,y:0,px:0,py:0});const pts=useRef<any[]>([]);
  useEffect(()=>{const el=dr.current;if(!el)return;const ro=new ResizeObserver(e=>{for(const x of e)sW(Math.min(1200,Math.max(550,x.contentRect.width)));});ro.observe(el);return()=>ro.disconnect();},[]);
  const oW=useCallback((e:React.WheelEvent)=>{e.preventDefault();sZm(z=>Math.max(.3,Math.min(20,z*(e.deltaY>0?.92:1.08))));},[]);
  const oD=useCallback((e:React.MouseEvent)=>{if(e.button===1||(e.button===0&&e.altKey)){ip.current=true;ps2.current={x:e.clientX,y:e.clientY,px:px2,py:py2};}},[px2,py2]);
  const oM=useCallback((e:React.MouseEvent)=>{if(ip.current){sPx(ps2.current.px+e.clientX-ps2.current.x);sPy(ps2.current.py+e.clientY-ps2.current.y);return;}const r=e.currentTarget.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;let best:any=null,bd=15;for(const p of pts.current){const d=Math.hypot(p.px-mx,p.py-my);if(d<bd){bd=d;best=p;}}sTt(best?{gene:best.gene,log2fc:best.log2fc,pval:best.pval,padj:best.padj,status:best.status,x:best.px,y:best.py}:null);},[]);
  const oU=useCallback(()=>{ip.current=false;},[]);const rZ=useCallback(()=>{sZm(1);sPx(0);sPy(0);},[]);
  
  useEffect(()=>{const cv=cr.current;if(!cv||!data.length)return;const ctx=cv.getContext('2d');if(!ctx)return;
  const dpr=window.devicePixelRatio||1;cv.width=w*dpr;cv.height=H*dpr;cv.style.width=w+'px';cv.style.height=H+'px';ctx.scale(dpr,dpr);
  const lW=LW+10;const p={top:30,right:30,bottom:55,left:lW+65},pw=w-p.left-p.right,ph=H-p.top-p.bottom;
  ctx.fillStyle=t.bg;ctx.fillRect(0,0,w,H);
  const mL=Math.max(...data.map(d=>Math.abs(d.log2fc)),1)*1.1,mN=Math.max(...data.map(d=>d.neglog10p),2)*1.05;
  const pcx=p.left+pw/2,pcy=p.top+ph/2;
  const tX=(v:number)=>pcx+((p.left+((v+mL)/(2*mL))*pw)-pcx)*zm+px2;
  const tY=(v:number)=>pcy+((p.top+(1-v/mN)*ph)-pcy)*zm+py2;
  
  // grid
  ctx.strokeStyle=t.grid;ctx.lineWidth=.5;
  for(let i=0;i<=6;i++){const y=pcy+((p.top+(i/6)*ph)-pcy)*zm+py2;if(y>=p.top&&y<=p.top+ph){ctx.beginPath();ctx.moveTo(p.left,y);ctx.lineTo(p.left+pw,y);ctx.stroke();}}
  
  // thresholds
  const sY=tY(-Math.log10(sig));ctx.strokeStyle=t.thr;ctx.lineWidth=1;ctx.setLineDash([6,4]);
  ctx.beginPath();ctx.moveTo(p.left,sY);ctx.lineTo(p.left+pw,sY);ctx.stroke();
  ctx.beginPath();ctx.moveTo(tX(-tL),p.top);ctx.lineTo(tX(-tL),p.top+ph);ctx.stroke();
  ctx.beginPath();ctx.moveTo(tX(tR),p.top);ctx.lineTo(tX(tR),p.top+ph);ctx.stroke();ctx.setLineDash([]);
  
  const em=eHL||new Map();const sr=srHL||new Set();const ms=new Set(manG.map(g=>g.toUpperCase()));const isR=gM==='replace';
  
  // clip + draw points
  ctx.save();ctx.beginPath();ctx.rect(p.left,p.top,pw,ph);ctx.clip();pts.current=[];
  const step=data.length>20000&&zm<1.5?2:1;
  
  for(let i=0;i<data.length;i+=step){const g=data[i];
    const gx=tX(g.log2fc),gy=tY(g.neglog10p);
    if(gx<p.left-10||gx>p.left+pw+10||gy<p.top-10||gy>p.top+ph+10)continue;
    pts.current.push({gene:g.gene,log2fc:g.log2fc,pval:g.pval,padj:g.padj,status:g.status,px:gx,py:gy});
    const goI=em.get(g.gene.toUpperCase());
  
    if(isR&&goI){ctx.fillStyle=goI.color;ctx.globalAlpha=al*.9;dPt(ctx,gx,gy,sh,sz*1.1);ctx.strokeStyle='#ffffff50';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(gx,gy,sz*1.1,0,Math.PI*2);ctx.stroke();}
    else if(!isR&&goI){
      if(g.status==='NS'){ctx.fillStyle=t.ns;ctx.globalAlpha=al*.2;dPt(ctx,gx,gy,sh,sz*.6);}
      else{dSt(ctx,g,gx,gy,ps,sh,sz,al,mL,mN,t.up,t.down);}
      ctx.globalAlpha=.25;ctx.fillStyle=goI.color;ctx.beginPath();ctx.arc(gx,gy,sz*2.5,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;ctx.fillStyle=goI.color;ctx.beginPath();ctx.arc(gx,gy,sz*1.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(gx,gy,sz*1.5,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=1;ctx.fillStyle=goI.color;ctx.font=`bold ${lSz}px monospace`;ctx.textAlign='left';ctx.fillText(g.gene,gx+sz*2,gy-sz);
    }
    else if(g.status==='NS'){ctx.fillStyle=t.ns;ctx.globalAlpha=al*.25;dPt(ctx,gx,gy,sh,sz*.6);}
    else{dSt(ctx,g,gx,gy,ps,sh,sz,al,mL,mN,t.up,t.down);}
  }
  
  // search highlight
  if(sr.size>0)for(const g of data){if(!sr.has(g.gene.toUpperCase()))continue;const gx=tX(g.log2fc),gy=tY(g.neglog10p);ctx.strokeStyle=t.accent;ctx.lineWidth=2.5;ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(gx,gy,sz+5,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=t.accent;ctx.font=`bold ${lSz}px monospace`;ctx.textAlign='left';ctx.fillText(g.gene,gx+sz+7,gy-2);}
  ctx.restore();ctx.globalAlpha=1;
  
  // labels — manual ALWAYS shown even with GO
  const lbl:GD[]=[];
  if(topN>0)lbl.push(...[...data].filter(g=>g.status!=='NS').sort((a,b)=>b.neglog10p-a.neglog10p).slice(0,topN));
  for(const name of manG){const found=data.find(g=>g.gene.toUpperCase()===name.toUpperCase());if(found&&!lbl.some(x=>x.gene===found.gene))lbl.push(found);}
  ctx.font=`${lSz}px monospace`;
  for(const g of lbl){
    if(sr.has(g.gene.toUpperCase()))continue;
    const gx=tX(g.log2fc),gy=tY(g.neglog10p);
    if(gx<p.left||gx>p.left+pw||gy<p.top||gy>p.top+ph)continue;
    const isMan=ms.has(g.gene.toUpperCase());
    if(isMan){ctx.strokeStyle=t.accent;ctx.lineWidth=2;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(gx,gy,sz+4,0,Math.PI*2);ctx.stroke();ctx.fillStyle=t.accent;}
    else if(em.has(g.gene.toUpperCase())&&!isR){ctx.fillStyle=em.get(g.gene.toUpperCase())!.color;}
    else{ctx.fillStyle=t.title;}
    ctx.globalAlpha=.85;ctx.textAlign=g.log2fc>0?'left':'right';
    ctx.fillText(g.gene,gx+(g.log2fc>0?sz+3:-(sz+3)),gy-sz-2);
  }
  ctx.globalAlpha=1;
  
  // axes
  ctx.strokeStyle=t.axes;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(p.left,p.top);ctx.lineTo(p.left,p.top+ph);ctx.lineTo(p.left+pw,p.top+ph);ctx.stroke();
  ctx.fillStyle=t.axes;ctx.font='11px Inter,sans-serif';ctx.textAlign='center';ctx.fillText('log₂(Fold Change)',p.left+pw/2,H-8);
  ctx.save();ctx.translate(lW+14,p.top+ph/2);ctx.rotate(-Math.PI/2);ctx.fillText('-log₁₀(p)',0,0);ctx.restore();
  ctx.font='9px monospace';ctx.textAlign='center';for(let i=-4;i<=4;i++){const x=tX(i);if(x>=p.left&&x<=p.left+pw)ctx.fillText(i.toString(),x,p.top+ph+16);}
  ctx.textAlign='right';for(let i=0;i<=6;i++){const v=(i/6)*mN;const y=tY(v);if(y>=p.top&&y<=p.top+ph)ctx.fillText(v.toFixed(1),p.left-6,y+3);}
  if(zm!==1){ctx.fillStyle=t.accent;ctx.font='bold 10px Inter,sans-serif';ctx.textAlign='right';ctx.fillText(`🔍 ${zm.toFixed(1)}x`,w-10,20);}
  if(leg.length>0)dLg(ctx,8,p.top,LW,ph,leg,t);
  },[data,t,w,tL,tR,sig,sz,al,ps,topN,manG,lSz,eHL,sh,leg,srHL,zm,px2,py2,gM]);
  
  return(<div ref={dr} className="w-full relative" onWheel={oW} onMouseDown={oD} onMouseMove={oM} onMouseUp={oU} onMouseLeave={()=>{ip.current=false;sTt(null);}}>
    <canvas ref={cr} className="w-full" style={{cursor:ip.current?'grabbing':'crosshair'}}/>
    {zm!==1&&<button onClick={rZ} className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold" style={{backgroundColor:t.accent,color:'#fff'}}><RotateCcw size={10}/>Reset</button>}
    {tt&&(<div className="absolute pointer-events-none z-50 px-3 py-2 rounded-xl shadow-xl text-xs" style={{left:Math.min(tt.x+14,w-170),top:Math.max(tt.y-80,5),backgroundColor:t.surfaceBg,border:`1px solid ${t.surfaceBorder}`,color:t.title,minWidth:140}}>
      <div className="font-bold font-mono text-sm mb-1" style={{color:tt.status==='UP'?t.up:tt.status==='DOWN'?t.down:t.axes}}>{tt.gene}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <span style={{color:t.axes}}>log₂FC</span><span className="font-mono text-right" style={{color:tt.log2fc>0?t.up:t.down}}>{tt.log2fc.toFixed(3)}</span>
        <span style={{color:t.axes}}>p-value</span><span className="font-mono text-right">{tt.pval.toExponential(2)}</span>
        <span style={{color:t.axes}}>padj</span><span className="font-mono text-right">{tt.padj.toExponential(2)}</span>
        <span style={{color:t.axes}}>Status</span><span className="font-mono text-right font-bold" style={{color:tt.status==='UP'?t.up:tt.status==='DOWN'?t.down:t.ns}}>{tt.status}</span>
      </div></div>)}
  </div>);}
  
  /* ═══ COMPARE CANVAS — all features ═══ */
  function CCan({dA,dB,mg,t,tL,tR,sig,sz,al,lA,lB,cG,eHL,ls='bezier',ms='mixed',ld='solid',lw=2,cpSz=4,cpSh='circle',ps='categorical',nV=true,dC='#f59e0b',bU,bD,leg=[],srHL,manG=[],gM='overlay'}:{dA:GD[];dB:GD[];mg:MG[];t:TC;tL:number;tR:number;sig:number;sz:number;al:number;lA:string;lB:string;cG:MG[];eHL?:Map<string,{color:string;termName:string}>;ls?:string;ms?:string;ld?:string;lw?:number;cpSz?:number;cpSh?:string;ps?:string;nV?:boolean;dC?:string;bU?:string;bD?:string;leg?:LI[];srHL?:Set<string>;manG?:string[];gM?:string}){
  const bu=bU||t.up;const bd=bD||t.down;const dc=dC||'#f59e0b';
  const cr=useRef<HTMLCanvasElement>(null),dr=useRef<HTMLDivElement>(null),[w,sW]=useState(1100);const H=600;
  const[tt,sTt]=useState<TT|null>(null);const pts=useRef<any[]>([]);
  useEffect(()=>{const el=dr.current;if(!el)return;const ro=new ResizeObserver(e=>{for(const x of e)sW(Math.min(1400,Math.max(800,x.contentRect.width)));});ro.observe(el);return()=>ro.disconnect();},[]);
  const oM=useCallback((e:React.MouseEvent)=>{const r=e.currentTarget.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;let best:any=null,bd2=15;for(const p of pts.current){const d=Math.hypot(p.px-mx,p.py-my);if(d<bd2){bd2=d;best=p;}}sTt(best?{gene:best.gene,log2fc:best.log2fc,pval:best.pval,padj:best.padj,status:best.status,x:best.px,y:best.py}:null);},[]);
  
  useEffect(()=>{const cv=cr.current;if(!cv)return;const ctx=cv.getContext('2d');if(!ctx)return;
  const dpr=window.devicePixelRatio||1;cv.width=w*dpr;cv.height=H*dpr;cv.style.width=w+'px';cv.style.height=H+'px';ctx.scale(dpr,dpr);
  ctx.fillStyle=t.bg;ctx.fillRect(0,0,w,H);
  const lW2=LW+10,cW=180,panW=(w-lW2-cW)/2,pad={top:50,bottom:55,left:55,right:10},pw=panW-pad.left-pad.right,ph=H-pad.top-pad.bottom;
  const em=eHL||new Map();const sr=srHL||new Set();const mS=new Set((manG||[]).map(g=>g.toUpperCase()));const isRp=gM==='replace';
  pts.current=[];const topM=cG;
  const shapes=['circle','diamond','square','triangle','star','hexagon','cross','ring'];
  const gDa=(s:string):number[]=>{switch(s){case'dashed':return[8,4];case'dotted':return[2,3];case'dashdot':return[8,3,2,3];default:return[];}};
  const gSh=(i:number):string=>ms==='mixed'?shapes[i%shapes.length]:ms;
  const dL2=(x1:number,y1:number,x2:number,y2:number)=>{ctx.beginPath();switch(ls){case'straight':ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);break;case'step':{const m=(x1+x2)/2;ctx.moveTo(x1,y1);ctx.lineTo(m,y1);ctx.lineTo(m,y2);ctx.lineTo(x2,y2);break;}case'arc':{const m=(x1+x2)/2,my=Math.min(y1,y2)-40;ctx.moveTo(x1,y1);ctx.quadraticCurveTo(m,my,x2,y2);break;}default:ctx.moveTo(x1,y1);ctx.bezierCurveTo(x1+(x2-x1)*.3,y1,x1+(x2-x1)*.7,y2,x2,y2);}ctx.stroke();};
  
  // draw panel
  const dPanel=(data:GD[],ox:number,title:string,isRight:boolean)=>{
    const mL=Math.max(...data.map(d=>Math.abs(d.log2fc)),1)*1.1,mN=Math.max(...data.map(d=>d.neglog10p),2)*1.05;
    const tX=(v:number)=>ox+pad.left+((v+mL)/(2*mL))*pw,tY=(v:number)=>pad.top+(1-v/mN)*ph;
  
    ctx.fillStyle=`${t.surfaceBg}40`;ctx.fillRect(ox+2,pad.top-10,panW-4,ph+20);
    ctx.strokeStyle=t.grid;ctx.lineWidth=.5;
    for(let i=0;i<=5;i++){const y=pad.top+(i/5)*ph;ctx.beginPath();ctx.moveTo(ox+pad.left,y);ctx.lineTo(ox+pad.left+pw,y);ctx.stroke();}
  
    // title + underline (RESTORED)
    ctx.fillStyle=t.title;ctx.font='bold 12px Inter,sans-serif';ctx.textAlign='center';
    ctx.fillText(title,ox+pad.left+pw/2,pad.top-22);
    const tw=ctx.measureText(title).width;
    ctx.strokeStyle=isRight?t.down:t.up;ctx.lineWidth=2;ctx.beginPath();
    ctx.moveTo(ox+pad.left+pw/2-tw/2,pad.top-18);ctx.lineTo(ox+pad.left+pw/2+tw/2,pad.top-18);ctx.stroke();
  
    // thresholds
    const sY2=tY(-Math.log10(sig));ctx.strokeStyle=t.thr;ctx.lineWidth=1;ctx.setLineDash([5,3]);
    ctx.beginPath();ctx.moveTo(ox+pad.left,sY2);ctx.lineTo(ox+pad.left+pw,sY2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(tX(-tL),pad.top);ctx.lineTo(tX(-tL),pad.top+ph);ctx.stroke();
    ctx.beginPath();ctx.moveTo(tX(tR),pad.top);ctx.lineTo(tX(tR),pad.top+ph);ctx.stroke();ctx.setLineDash([]);
  
    ctx.save();ctx.beginPath();ctx.rect(ox+pad.left,pad.top,pw,ph);ctx.clip();
  
    // points — using cpSz/cpSh for panel points
    for(const g of data){
      const gx=tX(g.log2fc),gy=tY(g.neglog10p);
      if(gx<ox+pad.left-5||gx>ox+pad.left+pw+5||gy<pad.top-5||gy>pad.top+ph+5)continue;
      pts.current.push({gene:g.gene,log2fc:g.log2fc,pval:g.pval,padj:g.padj,status:g.status,px:gx,py:gy});
      const goI=em.get(g.gene.toUpperCase());
  
      if(isRp&&goI){ctx.fillStyle=goI.color;ctx.globalAlpha=al*.9;dPt(ctx,gx,gy,cpSh!,cpSz*1.1);}
      else if(!isRp&&goI){
        if(g.status==='NS'){ctx.fillStyle=t.ns;ctx.globalAlpha=al*.15;dPt(ctx,gx,gy,cpSh!,cpSz*.5);}
        else{dSt(ctx,g,gx,gy,ps!,cpSh!,cpSz,al*.8,mL,mN,t.up,t.down);}
        ctx.globalAlpha=.2;ctx.fillStyle=goI.color;ctx.beginPath();ctx.arc(gx,gy,cpSz*2,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=1;ctx.fillStyle=goI.color;ctx.beginPath();ctx.arc(gx,gy,cpSz*1.3,0,Math.PI*2);ctx.fill();
      }
      else if(g.status==='NS'){if(!nV)continue;ctx.fillStyle=t.ns;ctx.globalAlpha=al*.15;dPt(ctx,gx,gy,cpSh!,cpSz*.5);}
      else{dSt(ctx,g,gx,gy,ps!,cpSh!,cpSz,al*.8,mL,mN,t.up,t.down);}
  
      if(sr.has(g.gene.toUpperCase())){ctx.strokeStyle=t.accent;ctx.lineWidth=2;ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(gx,gy,cpSz+4,0,Math.PI*2);ctx.stroke();}
    }
  
    // manual labels in panels
    if(mS.size>0){ctx.font='bold 9px monospace';for(const g of data){if(!mS.has(g.gene.toUpperCase()))continue;const gx=tX(g.log2fc),gy=tY(g.neglog10p);if(gx<ox+pad.left||gx>ox+pad.left+pw||gy<pad.top||gy>pad.top+ph)continue;ctx.strokeStyle=t.accent;ctx.lineWidth=2;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(gx,gy,cpSz+3,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=t.accent;ctx.textAlign=g.log2fc>0?'left':'right';ctx.fillText(g.gene,gx+(g.log2fc>0?cpSz+4:-(cpSz+4)),gy-cpSz-1);}}
  
    ctx.restore();ctx.globalAlpha=1;
  
    // panel axes
    ctx.strokeStyle=t.axes;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(ox+pad.left,pad.top);ctx.lineTo(ox+pad.left,pad.top+ph);ctx.lineTo(ox+pad.left+pw,pad.top+ph);ctx.stroke();
    ctx.fillStyle=t.axes;ctx.font='8px monospace';ctx.textAlign='center';
    for(let i=-3;i<=3;i++){const x=tX(i);if(x>=ox+pad.left&&x<=ox+pad.left+pw)ctx.fillText(i.toString(),x,pad.top+ph+14);}
    ctx.font='9px Inter,sans-serif';ctx.fillText('log₂FC',ox+pad.left+pw/2,H-16);
  
    // Y axis labels (left panel only)
    if(!isRight){ctx.font='8px monospace';ctx.textAlign='right';for(let i=0;i<=5;i++){const v=(i/5)*mN;ctx.fillText(v.toFixed(0),ox+pad.left-5,tY(v)+3);}}
  
    // UP/DOWN counts
    const nU=data.filter(g=>g.status==='UP').length,nD=data.filter(g=>g.status==='DOWN').length;
    ctx.font='bold 9px monospace';ctx.fillStyle=t.up;ctx.textAlign='right';ctx.fillText(`▲${nU}`,ox+pad.left+pw-2,pad.top+12);
    ctx.fillStyle=t.down;ctx.textAlign='left';ctx.fillText(`▼${nD}`,ox+pad.left+2,pad.top+12);
    return{tX,tY};
  };
  
  const pnA=dPanel(dA,lW2,lA,false),pnB=dPanel(dB,lW2+panW+cW,lB,true);
  
  // corridor background (RESTORED gradient)
  const cX=lW2+panW,cM=cX+cW/2;
  const cGrad=ctx.createLinearGradient(cX,pad.top,cX+cW,pad.top);
  cGrad.addColorStop(0,`${t.surfaceBg}30`);cGrad.addColorStop(.5,`${t.surfaceBg}80`);cGrad.addColorStop(1,`${t.surfaceBg}30`);
  ctx.fillStyle=cGrad;ctx.fillRect(cX,pad.top-10,cW,ph+20);
  
  // corridor borders (RESTORED dashes)
  ctx.strokeStyle=`${t.surfaceBorder}40`;ctx.lineWidth=1;ctx.setLineDash([3,3]);
  ctx.beginPath();ctx.moveTo(cX,pad.top-10);ctx.lineTo(cX,pad.top+ph+10);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cX+cW,pad.top-10);ctx.lineTo(cX+cW,pad.top+ph+10);ctx.stroke();ctx.setLineDash([]);
  
  // corridor title
  ctx.fillStyle=t.accent;ctx.font='bold 11px Inter,sans-serif';ctx.textAlign='center';
  ctx.fillText(`🔗 ${topM.length} genes`,cM,pad.top-24);
  ctx.fillStyle=t.thr;ctx.font='9px Inter,sans-serif';ctx.fillText(`${mg.length} common`,cM,pad.top-10);
  
  // corridor genes — auto-centered
  if(topM.length>0){
    const totalH=ph-16;const gH=Math.min(22,totalH/topM.length);const blockH=gH*topM.length;
    const startY=pad.top+(ph-blockH)/2;const da2=gDa(ld);
  
    for(let i=0;i<topM.length;i++){
      const m=topM[i];const gY=startY+i*gH+gH/2;
      const gA=dA.find(g=>g.gene===m.gene);const gB=dB.find(g=>g.gene===m.gene);
      if(!gA||!gB)continue;
      const xA=pnA.tX(gA.log2fc),yA=pnA.tY(gA.neglog10p),xB=pnB.tX(gB.log2fc),yB=pnB.tY(gB.neglog10p);
      const ie=em.has(m.gene.toUpperCase());
      const disc=(m.status_A==='UP'&&m.status_B==='DOWN')||(m.status_A==='DOWN'&&m.status_B==='UP');
      const bUU=m.status_A==='UP'&&m.status_B==='UP';const bDD=m.status_A==='DOWN'&&m.status_B==='DOWN';
  
      let lC:string;
      if(ie)lC=em.get(m.gene.toUpperCase())!.color;
      else if(disc)lC=dc;else if(bUU)lC=bu;else if(bDD)lC=bd;else lC=t.accent;
  
      const ssh=gSh(i);
      ctx.strokeStyle=lC;ctx.lineWidth=lw;ctx.globalAlpha=ie?.95:.7;ctx.setLineDash(da2);
      dL2(xA,yA,cM-42,gY);dL2(cM+42,gY,xB,yB);ctx.setLineDash([]);
  
      ctx.globalAlpha=.95;dMk(ctx,xA,yA,ssh,sz*1.4,lC,'#ffffff80');dMk(ctx,xB,yB,ssh,sz*1.4,lC,'#ffffff80');
  
      ctx.globalAlpha=.12;ctx.fillStyle=lC;ctx.fillRect(cM-44,gY-gH/2+1,88,gH-2);ctx.globalAlpha=1;
      dMk(ctx,cM-38,gY,ssh,4,lC,lC);
      ctx.fillStyle=lC;ctx.font=`bold ${Math.min(11,gH-4)}px monospace`;ctx.textAlign='center';ctx.fillText(m.gene,cM+2,gY+4);
  
      // status arrows
      ctx.font=`${Math.min(9,gH-4)}px Inter,sans-serif`;
      ctx.fillStyle=m.status_A==='UP'?t.up:m.status_A==='DOWN'?t.down:t.ns;ctx.textAlign='right';ctx.fillText(m.status_A==='UP'?'▲':m.status_A==='DOWN'?'▼':'•',cM-44,gY+3);
      ctx.fillStyle=m.status_B==='UP'?t.up:m.status_B==='DOWN'?t.down:t.ns;ctx.textAlign='left';ctx.fillText(m.status_B==='UP'?'▲':m.status_B==='DOWN'?'▼':'•',cM+44,gY+3);
  
      if(disc){ctx.fillStyle=dc;ctx.globalAlpha=.2;ctx.beginPath();ctx.arc(cM,gY-gH/2+2,6,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.font='bold 7px Inter,sans-serif';ctx.textAlign='center';ctx.fillText('⚠',cM,gY-gH/2+5);}
    }
    ctx.globalAlpha=1;
  }
  
  // bottom legend
  const lY=H-12,lSX=cM-75;ctx.font='bold 8px Inter,sans-serif';ctx.textAlign='left';
  ctx.fillStyle=bu;dMk(ctx,lSX,lY-2,'diamond',4,bu,bu);ctx.fillText('Both UP',lSX+8,lY+1);
  ctx.fillStyle=bd;dMk(ctx,lSX+55,lY-2,'square',4,bd,bd);ctx.fillText('Both DOWN',lSX+63,lY+1);
  ctx.fillStyle=dc;dMk(ctx,lSX+125,lY-2,'triangle',4,dc,dc);ctx.fillText('⚠ Discord',lSX+133,lY+1);
  if(leg.length>0)dLg(ctx,8,pad.top,LW,ph,leg,t);
  
  },[dA,dB,mg,t,w,tL,tR,sig,sz,al,lA,lB,cG,eHL,ls,ms,ld,lw,cpSz,cpSh,ps,nV,dc,bu,bd,leg,srHL,manG,gM]);
  
  return(<div ref={dr} className="w-full relative" onMouseMove={oM} onMouseLeave={()=>sTt(null)}>
    <canvas ref={cr} className="w-full" style={{cursor:'crosshair'}}/>
    {tt&&(<div className="absolute pointer-events-none z-50 px-3 py-2 rounded-xl shadow-xl text-xs" style={{left:Math.min(tt.x+14,w-170),top:Math.max(tt.y-80,5),backgroundColor:t.surfaceBg,border:`1px solid ${t.surfaceBorder}`,color:t.title,minWidth:140}}>
      <div className="font-bold font-mono text-sm mb-1" style={{color:tt.status==='UP'?t.up:tt.status==='DOWN'?t.down:t.axes}}>{tt.gene}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <span style={{color:t.axes}}>FC</span><span className="font-mono text-right" style={{color:tt.log2fc>0?t.up:t.down}}>{tt.log2fc.toFixed(3)}</span>
        <span style={{color:t.axes}}>p</span><span className="font-mono text-right">{tt.pval.toExponential(2)}</span>
        <span style={{color:t.axes}}>padj</span><span className="font-mono text-right">{tt.padj.toExponential(2)}</span>
      </div></div>)}
  </div>);}
  
  /* ═══ QQ PLOT ═══ */
  function QCan({data,t}:{data:{expected:number;observed:number}[];t:TC}){const cr=useRef<HTMLCanvasElement>(null),dr=useRef<HTMLDivElement>(null),[w,sW]=useState(700);const H=400;useEffect(()=>{const el=dr.current;if(!el)return;const ro=new ResizeObserver(e=>{for(const x of e)sW(Math.min(700,Math.max(400,x.contentRect.width)));});ro.observe(el);return()=>ro.disconnect();},[]);useEffect(()=>{const cv=cr.current;if(!cv||!data.length)return;const ctx=cv.getContext('2d');if(!ctx)return;const dpr=window.devicePixelRatio||1;cv.width=w*dpr;cv.height=H*dpr;cv.style.width=w+'px';cv.style.height=H+'px';ctx.scale(dpr,dpr);const p={top:30,right:30,bottom:50,left:60},pw=w-p.left-p.right,ph=H-p.top-p.bottom;ctx.fillStyle=t.bg;ctx.fillRect(0,0,w,H);const mv=Math.max(Math.max(...data.map(d=>d.expected)),Math.max(...data.map(d=>d.observed)),2)*1.05,tX=(v:number)=>p.left+(v/mv)*pw,tY=(v:number)=>p.top+(1-v/mv)*ph;ctx.strokeStyle=t.grid;ctx.lineWidth=.5;for(let i=0;i<=5;i++){const v=(i/5)*mv;ctx.beginPath();ctx.moveTo(p.left,tY(v));ctx.lineTo(p.left+pw,tY(v));ctx.stroke();ctx.beginPath();ctx.moveTo(tX(v),p.top);ctx.lineTo(tX(v),p.top+ph);ctx.stroke();}ctx.strokeStyle=t.thr;ctx.lineWidth=1.5;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(tX(0),tY(0));ctx.lineTo(tX(mv),tY(mv));ctx.stroke();ctx.setLineDash([]);for(const d of data){const px=tX(d.expected),py=tY(d.observed);if(px<p.left||px>p.left+pw||py<p.top||py>p.top+ph)continue;const dv=d.observed-d.expected;ctx.fillStyle=dv>2?t.up:dv>.5?t.accent:t.ns;ctx.globalAlpha=dv>2?.8:dv>.5?.6:.4;ctx.beginPath();ctx.arc(px,py,2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.strokeStyle=t.axes;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(p.left,p.top);ctx.lineTo(p.left,p.top+ph);ctx.lineTo(p.left+pw,p.top+ph);ctx.stroke();ctx.fillStyle=t.axes;ctx.font='11px Inter,sans-serif';ctx.textAlign='center';ctx.fillText('Expected -log₁₀(p)',p.left+pw/2,H-6);ctx.save();ctx.translate(14,p.top+ph/2);ctx.rotate(-Math.PI/2);ctx.fillText('Observed -log₁₀(p)',0,0);ctx.restore();},[data,t,w]);return<div ref={dr}><canvas ref={cr} className="w-full rounded-lg" style={{maxWidth:700}}/></div>;}
  
  /* ═══ FOREST PLOT ═══ */
  function FCan({data,t}:{data:GD[];t:TC}){const cr=useRef<HTMLCanvasElement>(null);const W=700,H=460;useEffect(()=>{const cv=cr.current;if(!cv)return;const ctx=cv.getContext('2d');if(!ctx)return;const dpr=window.devicePixelRatio||1;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';ctx.scale(dpr,dpr);const p={top:30,right:30,bottom:40,left:120},pw=W-p.left-p.right,ph=H-p.top-p.bottom;ctx.fillStyle=t.bg;ctx.fillRect(0,0,W,H);const t20=[...data].filter(g=>g.status!=='NS'&&g.ci_lo!=null).sort((a,b)=>b.neglog10p-a.neglog10p).slice(0,20);if(!t20.length)return;const av=t20.flatMap(g=>[g.ci_lo!,g.ci_hi!,g.log2fc]),xR=Math.max(Math.abs(Math.min(...av)),Math.abs(Math.max(...av)))*1.1,tX=(v:number)=>p.left+((v+xR)/(2*xR))*pw,rH=ph/t20.length;ctx.strokeStyle=t.thr;ctx.lineWidth=1.2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(tX(0),p.top);ctx.lineTo(tX(0),p.top+ph);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<t20.length;i++){const g=t20[i],y=p.top+(i+.5)*rH,c=g.status==='UP'?t.up:t.down;ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.globalAlpha=.7;ctx.beginPath();ctx.moveTo(tX(g.ci_lo!),y);ctx.lineTo(tX(g.ci_hi!),y);ctx.stroke();const px=tX(g.log2fc);ctx.globalAlpha=.9;ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(px,y-5);ctx.lineTo(px+4,y);ctx.lineTo(px,y+5);ctx.lineTo(px-4,y);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=t.axes;ctx.font='10px monospace';ctx.textAlign='right';ctx.fillText(g.gene.substring(0,14),p.left-6,y+4);}ctx.strokeStyle=t.axes;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.left,p.top+ph);ctx.lineTo(p.left+pw,p.top+ph);ctx.stroke();},[data,t]);return<canvas ref={cr} className="w-full rounded-lg" style={{maxWidth:700}}/>;}
  
  /* ═══ MA PLOT ═══ */
  function MCan({data,t}:{data:GD[];t:TC}){const cr=useRef<HTMLCanvasElement>(null);const W=700,H=300;useEffect(()=>{const cv=cr.current;if(!cv)return;const ctx=cv.getContext('2d');if(!ctx)return;const dpr=window.devicePixelRatio||1;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';ctx.scale(dpr,dpr);const p={top:20,right:20,bottom:40,left:60},pw=W-p.left-p.right,ph=H-p.top-p.bottom;ctx.fillStyle=t.bg;ctx.fillRect(0,0,W,H);const wb=data.filter(g=>g.baseMean!=null&&g.baseMean!>0);if(!wb.length)return;const xs=wb.map(g=>Math.log10(g.baseMean!+1)),ys=wb.map(g=>g.log2fc),xn=Math.min(...xs),xx=Math.max(...xs),ya=Math.max(Math.abs(Math.min(...ys)),Math.abs(Math.max(...ys)))*1.1,tX=(v:number)=>p.left+((v-xn)/(xx-xn))*pw,tY=(v:number)=>p.top+(1-(v+ya)/(2*ya))*ph;ctx.strokeStyle=t.thr;ctx.setLineDash([4,3]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.left,tY(0));ctx.lineTo(p.left+pw,tY(0));ctx.stroke();ctx.setLineDash([]);const step=Math.max(1,Math.floor(wb.length/3000));for(let i=0;i<wb.length;i+=step){const g=wb[i];ctx.fillStyle=g.status==='UP'?t.up:g.status==='DOWN'?t.down:t.ns;ctx.globalAlpha=g.status==='NS'?.15:.7;ctx.beginPath();ctx.arc(tX(xs[i]),tY(g.log2fc),g.status==='NS'?1.5:2.5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.strokeStyle=t.axes;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.left,p.top);ctx.lineTo(p.left,p.top+ph);ctx.lineTo(p.left+pw,p.top+ph);ctx.stroke();},[data,t]);return<canvas ref={cr} className="w-full rounded-lg" style={{maxWidth:700}}/>;}
  
  /* ═══ WATERFALL ═══ */
  function WCan({data,t}:{data:GD[];t:TC}){const cr=useRef<HTMLCanvasElement>(null),dr=useRef<HTMLDivElement>(null),[w,sW]=useState(700);const H=350;useEffect(()=>{const el=dr.current;if(!el)return;const ro=new ResizeObserver(e=>{for(const x of e)sW(Math.min(900,Math.max(400,x.contentRect.width)));});ro.observe(el);return()=>ro.disconnect();},[]);useEffect(()=>{const cv=cr.current;if(!cv)return;const ctx=cv.getContext('2d');if(!ctx)return;const dpr=window.devicePixelRatio||1;cv.width=w*dpr;cv.height=H*dpr;cv.style.width=w+'px';cv.style.height=H+'px';ctx.scale(dpr,dpr);const p={top:30,right:20,bottom:50,left:60},pw=w-p.left-p.right,ph=H-p.top-p.bottom;ctx.fillStyle=t.bg;ctx.fillRect(0,0,w,H);const sg2=[...data].filter(g=>g.status!=='NS').sort((a,b)=>a.log2fc-b.log2fc);if(!sg2.length)return;const ma=Math.max(...sg2.map(g=>Math.abs(g.log2fc)))*1.1,bw=Math.max(1,Math.min(8,pw/sg2.length-.5)),tY=(v:number)=>p.top+(1-(v+ma)/(2*ma))*ph,zY=tY(0);ctx.strokeStyle=t.thr;ctx.lineWidth=1.2;ctx.setLineDash([5,3]);ctx.beginPath();ctx.moveTo(p.left,zY);ctx.lineTo(p.left+pw,zY);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<sg2.length;i++){const g=sg2[i],x=p.left+(i/sg2.length)*pw,bY=tY(g.log2fc),bH=Math.abs(bY-zY),gd=ctx.createLinearGradient(x,Math.min(bY,zY),x,Math.max(bY,zY));if(g.log2fc>0){gd.addColorStop(0,t.up);gd.addColorStop(1,`${t.up}44`);}else{gd.addColorStop(0,`${t.down}44`);gd.addColorStop(1,t.down);}ctx.fillStyle=gd;ctx.fillRect(x,g.log2fc>0?bY:zY,bw,bH);}ctx.strokeStyle=t.axes;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(p.left,p.top);ctx.lineTo(p.left,p.top+ph);ctx.lineTo(p.left+pw,p.top+ph);ctx.stroke();},[data,t,w]);return<div ref={dr}><canvas ref={cr} className="w-full rounded-lg" style={{maxWidth:900}}/></div>;}
  
  /* ═══ CONCORDANCE SCATTER — RESTORED ═══ */
  function CSCan({mg,t,lA,lB}:{mg:MG[];t:TC;lA:string;lB:string}){const cr=useRef<HTMLCanvasElement>(null),dr=useRef<HTMLDivElement>(null),[w,sW]=useState(500);const H=500;useEffect(()=>{const el=dr.current;if(!el)return;const ro=new ResizeObserver(e=>{for(const x of e)sW(Math.min(550,Math.max(350,x.contentRect.width)));});ro.observe(el);return()=>ro.disconnect();},[]);useEffect(()=>{const cv=cr.current;if(!cv||!mg.length)return;const ctx=cv.getContext('2d');if(!ctx)return;const dpr=window.devicePixelRatio||1;cv.width=w*dpr;cv.height=H*dpr;cv.style.width=w+'px';cv.style.height=H+'px';ctx.scale(dpr,dpr);const p={top:30,right:30,bottom:55,left:60},pw=w-p.left-p.right,ph=H-p.top-p.bottom;ctx.fillStyle=t.bg;ctx.fillRect(0,0,w,H);const ma=Math.max(Math.max(...mg.map(m=>Math.abs(m.lfc_A))),Math.max(...mg.map(m=>Math.abs(m.lfc_B))),1)*1.15,tX=(v:number)=>p.left+((v+ma)/(2*ma))*pw,tY=(v:number)=>p.top+(1-(v+ma)/(2*ma))*ph;ctx.strokeStyle=t.thr;ctx.lineWidth=1.5;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(tX(-ma),tY(-ma));ctx.lineTo(tX(ma),tY(ma));ctx.stroke();ctx.setLineDash([]);for(const m of mg){const px=tX(m.lfc_A),py=tY(m.lfc_B);if(px<p.left||px>p.left+pw||py<p.top||py>p.top+ph)continue;const disc2=(m.status_A==='UP'&&m.status_B==='DOWN')||(m.status_A==='DOWN'&&m.status_B==='UP'),bu2=m.status_A==='UP'&&m.status_B==='UP',bd2=m.status_A==='DOWN'&&m.status_B==='DOWN';if(m.status_A==='NS'&&m.status_B==='NS'){ctx.fillStyle=t.ns;ctx.globalAlpha=.12;}else if(disc2){ctx.fillStyle='#f59e0b';ctx.globalAlpha=.85;}else if(bu2){ctx.fillStyle=t.up;ctx.globalAlpha=.7;}else if(bd2){ctx.fillStyle=t.down;ctx.globalAlpha=.7;}else{ctx.fillStyle=t.accent;ctx.globalAlpha=.5;}ctx.beginPath();ctx.arc(px,py,disc2?4:m.status_A==='NS'&&m.status_B==='NS'?1.8:3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.strokeStyle=t.axes;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(p.left,p.top);ctx.lineTo(p.left,p.top+ph);ctx.lineTo(p.left+pw,p.top+ph);ctx.stroke();ctx.fillStyle=t.axes;ctx.font='11px Inter,sans-serif';ctx.textAlign='center';ctx.fillText(`log₂FC — ${lA}`,p.left+pw/2,H-8);ctx.save();ctx.translate(14,p.top+ph/2);ctx.rotate(-Math.PI/2);ctx.fillText(`log₂FC — ${lB}`,0,0);ctx.restore();},[mg,t,w,lA,lB]);return<div ref={dr}><canvas ref={cr} className="w-full rounded-lg" style={{maxWidth:550}}/></div>;}
  
  /* ═══ VENN OVERLAP — RESTORED ═══ */
  function VnCan({dA,dB,t,lA,lB}:{dA:GD[];dB:GD[];t:TC;lA:string;lB:string}){const cr=useRef<HTMLCanvasElement>(null);const W=500,H=320;useEffect(()=>{const cv=cr.current;if(!cv)return;const ctx=cv.getContext('2d');if(!ctx)return;const dpr=window.devicePixelRatio||1;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';ctx.scale(dpr,dpr);ctx.fillStyle=t.bg;ctx.fillRect(0,0,W,H);const sA=new Set(dA.filter(g=>g.status!=='NS').map(g=>g.gene)),sB=new Set(dB.filter(g=>g.status!=='NS').map(g=>g.gene));const oA=[...sA].filter(g=>!sB.has(g)).length,oB=[...sB].filter(g=>!sA.has(g)).length,both=[...sA].filter(g=>sB.has(g)).length;const c1=W*.38,c2=W*.62,cy=H*.45,r=90;ctx.beginPath();ctx.arc(c1,cy,r,0,Math.PI*2);ctx.fillStyle=`${t.down}22`;ctx.fill();ctx.strokeStyle=t.down;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(c2,cy,r,0,Math.PI*2);ctx.fillStyle=`${t.up}22`;ctx.fill();ctx.strokeStyle=t.up;ctx.stroke();ctx.save();ctx.beginPath();ctx.arc(c1,cy,r,0,Math.PI*2);ctx.clip();ctx.beginPath();ctx.arc(c2,cy,r,0,Math.PI*2);ctx.fillStyle=`${t.accent}30`;ctx.fill();ctx.restore();ctx.font='bold 12px Inter,sans-serif';ctx.textAlign='center';ctx.fillStyle=t.down;ctx.fillText(lA.substring(0,20),c1-35,cy-r-10);ctx.fillStyle=t.up;ctx.fillText(lB.substring(0,20),c2+35,cy-r-10);ctx.font='bold 22px monospace';ctx.fillStyle=t.axes;ctx.fillText(oA.toString(),c1-40,cy+5);ctx.fillText(oB.toString(),c2+40,cy+5);ctx.fillStyle=t.accent;ctx.fillText(both.toString(),(c1+c2)/2,cy-5);const tot=oA+oB+both;ctx.font='9px Inter,sans-serif';ctx.fillStyle=t.thr;ctx.fillText(`Jaccard: ${tot>0?(both/tot).toFixed(3):'0'}`,W/2,H-20);},[dA,dB,t,lA,lB]);return<canvas ref={cr} className="w-full rounded-lg" style={{maxWidth:500}}/>;}
  
  /* ═══ PI0 CURVE — RESTORED ═══ */
  function P0Can({data,pv,t}:{data:{lambda:number;pi0:number}[];pv:number;t:TC}){const cr=useRef<HTMLCanvasElement>(null);const W=500,H=250;useEffect(()=>{const cv=cr.current;if(!cv||!data.length)return;const ctx=cv.getContext('2d');if(!ctx)return;const dpr=window.devicePixelRatio||1;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';ctx.scale(dpr,dpr);const p={top:20,right:20,bottom:40,left:50},pw=W-p.left-p.right,ph=H-p.top-p.bottom;ctx.fillStyle=t.bg;ctx.fillRect(0,0,W,H);const yM=Math.min(1.1,Math.max(...data.map(d=>d.pi0))*1.1),tX=(v:number)=>p.left+v*pw,tY=(v:number)=>p.top+(1-v/yM)*ph;ctx.strokeStyle=t.accent;ctx.lineWidth=1.5;ctx.setLineDash([8,4]);ctx.beginPath();ctx.moveTo(p.left,tY(pv));ctx.lineTo(p.left+pw,tY(pv));ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle=t.up;ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<data.length;i++){const x=tX(data[i].lambda),y=tY(data[i].pi0);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();for(const d of data){ctx.fillStyle=t.up;ctx.beginPath();ctx.arc(tX(d.lambda),tY(d.pi0),3,0,Math.PI*2);ctx.fill();}ctx.strokeStyle=t.axes;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.left,p.top);ctx.lineTo(p.left,p.top+ph);ctx.lineTo(p.left+pw,p.top+ph);ctx.stroke();ctx.fillStyle=t.axes;ctx.font='10px Inter,sans-serif';ctx.textAlign='center';ctx.fillText('λ',p.left+pw/2,H-8);ctx.save();ctx.translate(12,p.top+ph/2);ctx.rotate(-Math.PI/2);ctx.fillText('π₀(λ)',0,0);ctx.restore();},[data,pv,t]);return<canvas ref={cr} className="w-full rounded-lg" style={{maxWidth:500}}/>;}
  
  /* ═══ ROBUSTNESS TABLE — RESTORED ═══ */
  function RbT({data,fdr,cm,t}:{data:GD[];fdr:boolean;cm:CM;t:TC}){
    const res=useMemo(()=>{const rows:{s:number;f:number;u:number;d:number;tt:number}[]=[];
      for(const s of[.001,.01,.05,.1])for(const f of[.5,1,1.5,2]){
        const p2=pD(data,f,f,s,fdr,cm),u=p2.filter(g=>g.status==='UP').length,d=p2.filter(g=>g.status==='DOWN').length;
        rows.push({s,f,u,d,tt:u+d});}return rows;},[data,fdr,cm]);
    const mx=Math.max(...res.map(r=>r.tt),1);
    return<div className="overflow-x-auto"><table className="w-full text-xs" style={{color:t.axes}}>
      <thead><tr className="border-b" style={{borderColor:t.surfaceBorder}}>
        <th className="py-2 px-2 text-left" style={{color:t.title}}>Sig</th>
        <th className="py-2 px-2 text-left" style={{color:t.title}}>|FC|</th>
        <th className="py-2 px-2 text-right" style={{color:t.title}}>UP</th>
        <th className="py-2 px-2 text-right" style={{color:t.title}}>DOWN</th>
        <th className="py-2 px-2 text-right" style={{color:t.title}}>Total</th>
        <th className="py-2 px-2" style={{width:'30%'}}></th>
      </tr></thead>
      <tbody>{res.map((r,i)=>(<tr key={i} className="border-b" style={{borderColor:`${t.surfaceBorder}40`}}>
        <td className="py-1.5 px-2 font-mono">{r.s}</td>
        <td className="py-1.5 px-2 font-mono">{r.f}</td>
        <td className="py-1.5 px-2 text-right font-mono" style={{color:t.up}}>{r.u}</td>
        <td className="py-1.5 px-2 text-right font-mono" style={{color:t.down}}>{r.d}</td>
        <td className="py-1.5 px-2 text-right font-mono font-bold">{r.tt}</td>
        <td className="py-1.5 px-2"><div className="h-3 rounded-full overflow-hidden" style={{backgroundColor:t.grid}}>
          <div className="h-full rounded-full" style={{width:`${(r.tt/mx)*100}%`,
            background:`linear-gradient(90deg,${t.down},${t.accent},${t.up})`}}/></div></td>
      </tr>))}</tbody></table></div>;
  }
  
