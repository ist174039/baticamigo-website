"use client";
import {useEffect,useMemo,useState} from "react";
import {onAuthStateChanged} from "firebase/auth";
import {BookOpenCheck,ChevronLeft,ChevronRight,Search,ArrowLeft,CheckCircle2,RotateCcw} from "lucide-react";
import {platformAuth} from "../../../lib/firebase-client";
import {manualGuides} from "../../../lib/platform/manual-data.mjs";
import {Button} from "../../components/ui/button";

export default function Manual(){
  const [account,setAccount]=useState(null);
  const [state,setState]=useState("loading");
  const [error,setError]=useState("");
  const [query,setQuery]=useState("");
  const [selectedId,setSelectedId]=useState("acesso");
  const [step,setStep]=useState(0);
  const [completed,setCompleted]=useState({});
  useEffect(()=>{
    let mounted=true;
    return onAuthStateChanged(platformAuth(),async user=>{
      if(!mounted)return;
      if(!user){window.location.replace("/platform/login");return;}
      try{
        const token=await user.getIdToken();
        const response=await fetch("/api/platform",{headers:{Authorization:"Bearer "+token},cache:"no-store"});
        if(!response.ok)throw new Error("Conta sem acesso ao manual de utilização.");
        const data=await response.json();
        if(mounted){setAccount(data.account);setState("ready");}
      }catch(e){if(mounted){setError(e.message);setState("error");}}
    });
  },[]);
  const available=useMemo(()=>{
    const roles=account?.roles||[account?.role].filter(Boolean);
    const modules=account?.modules||[];
    return manualGuides.filter(guide=>
      (!guide.roles.length||guide.roles.some(role=>roles.includes(role))) &&
      (guide.module==="overview"||modules.includes(guide.module)||roles.includes("admin"))
    );
  },[account]);
  const filtered=available.filter(guide=>{
    const needle=query.trim().toLocaleLowerCase("pt-PT");
    return !needle||(guide.title+" "+guide.group+" "+guide.steps.map(x=>x.join(" ")).join(" ")).toLocaleLowerCase("pt-PT").includes(needle);
  });
  const selected=available.find(guide=>guide.id===selectedId)||available[0];
  const active=selected?.steps[step]||selected?.steps[0];
  const total=available.reduce((sum,g)=>sum+g.steps.length,0);
  const done=Object.keys(completed).filter(key=>completed[key]&&available.some(g=>key.startsWith(g.id+":"))).length;
  function choose(guide){setSelectedId(guide.id);setStep(0);}
  function toggle(){
    if(!selected)return;
    const key=selected.id+":"+step;
    setCompleted(previous=>({...previous,[key]:!previous[key]}));
  }
  if(state==="loading")return <main className="ba-manual-page" role="status">A confirmar o acesso ao manual…</main>;
  if(state==="error")return <main className="ba-manual-page"><h1>Manual BaticAmigo</h1><p role="alert">{error}</p><a href="/platform/login">Voltar ao início de sessão</a></main>;
  return <div className="ba-manual-page">
    <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
      <a href="/area" style={{display:"inline-flex",alignItems:"center",gap:8}}><ArrowLeft size={17}/> Voltar à área reservada</a>
      <span style={{display:"inline-flex",alignItems:"center",gap:8}}><BookOpenCheck size={19}/> Manual de utilização</span>
    </header>
    <section style={{margin:"28px 0",padding:"clamp(22px,3vw,36px)",borderRadius:20,background:"#f4effa",border:"1px solid #e5d9f1"}}>
      <p style={{letterSpacing:".1em",textTransform:"uppercase",fontSize:11,fontWeight:750,color:"#6846b9"}}>Aprender a utilizar · BaticAmigo</p>
      <h1>Manual completo da plataforma</h1>
      <p style={{maxWidth:"75ch",lineHeight:1.6}}>Percursos orientados por tarefas: antes de começar, passos detalhados, resultados esperados, decisões, resolução de problemas e boas práticas. Apenas são apresentados os fluxos adequados ao perfil autorizado.</p>
      <p aria-live="polite"><strong>{done} de {total} passos assinalados</strong> nesta sessão de navegação. Assinalar passos não confirma a execução de testes de qualidade.</p>
      <progress value={done} max={total||1} style={{width:"min(100%,460px)",height:13}}/>
    </section>
    <div className="ba-manual-layout">
      <nav className="ba-manual-index" aria-label="Índice do manual">
        <label htmlFor="manual-search" style={{display:"flex",alignItems:"center",gap:8,fontWeight:650,marginBottom:12}}><Search size={17}/> Pesquisar processos</label>
        <input id="manual-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nome, passo ou funcionalidade" style={{width:"100%",minHeight:44,padding:10,borderRadius:9,border:"1px solid #cbbfd8"}}/>
        {[...new Set(filtered.map(g=>g.group))].map(group=><div key={group}><h2 style={{fontSize:13,margin:"18px 0 7px"}}>{group}</h2>{filtered.filter(g=>g.group===group).map(guide=><button key={guide.id} type="button" onClick={()=>choose(guide)} aria-current={selected?.id===guide.id?"true":undefined}>{guide.title} <small style={{display:"block",opacity:.7}}>{guide.steps.length} passos</small></button>)}</div>)}
        {!filtered.length&&<p>Não existem processos correspondentes.</p>}
      </nav>
      <main style={{minWidth:0}}>
        {selected?<div>
          <p style={{fontSize:12,color:"#6846b9",fontWeight:750}}>{selected.group} · {selected.steps.length} passos</p>
          <h2 style={{fontSize:"clamp(24px,3vw,32px)"}}>{selected.title}</h2>
          <a href={selected.location}>Abrir o módulo da plataforma</a>
          <div className="ba-manual-step">
            <h3>Antes de começar</h3>
            <ul>{selected.prerequisites.map(text=><li key={text}>{text}</li>)}</ul>
          </div>
          <section className="ba-manual-step" aria-label="Mapa do fluxo de trabalho">
            <h3>Fluxo de trabalho</h3>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {selected.steps.map((item,index)=><button type="button" aria-current={step===index?"step":undefined} key={index} onClick={()=>setStep(index)}
                style={{minHeight:44,padding:"10px 12px",borderRadius:10,border:step===index?"2px solid #6846b9":"1px solid #dcd3e6",background:step===index?"#f2ebfc":"white",cursor:"pointer"}}>
                {completed[selected.id+":"+index]?"✓ ":""}{index+1}. {item[0]}
              </button>)}
            </div>
          </section>
          <section className="ba-manual-step" aria-live="polite">
            <p style={{fontSize:12,color:"#6846b9"}}>PASSO {step+1} / {selected.steps.length}</p>
            <h3>{active[0]}</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,260px),1fr))",gap:14}}>
              <div><strong>O que fazer</strong><p>{active[1]}</p></div>
              <div><strong>Resultado esperado</strong><p>{active[2]}</p></div>
            </div>
            <div className="ba-panel-notice"><strong>Se não funcionar</strong><p>{active[3]}</p></div>
            <div className="ba-panel-actions">
              <Button onClick={toggle}>{completed[selected.id+":"+step]?<CheckCircle2 size={16}/>:null}{completed[selected.id+":"+step]?"Passo assinalado":"Assinalar este passo"}</Button>
              <Button variant="outline" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0}><ChevronLeft size={16}/> Anterior</Button>
              <Button variant="outline" onClick={()=>setStep(Math.min(selected.steps.length-1,step+1))} disabled={step===selected.steps.length-1}>Seguinte <ChevronRight size={16}/></Button>
              <Button variant="outline" onClick={()=>{setCompleted(prev=>Object.fromEntries(Object.entries(prev).filter(([key])=>!key.startsWith(selected.id+":"))));setStep(0);}}><RotateCcw size={16}/> Reiniciar</Button>
            </div>
          </section>
          <div className="ba-manual-step">
            <h3>Decisão no processo</h3>
            <p><strong>{selected.decision[0]}</strong></p><p><strong>Sim:</strong> {selected.decision[1]}</p><p><strong>Não:</strong> {selected.decision[2]}</p>
          </div>
          <div className="ba-manual-step">
            <p><strong>Boa prática:</strong> {selected.tip}</p>
            <p><strong>Atenção:</strong> {selected.warning}</p>
          </div>
        </div>:<p>Nenhum percurso disponível para o seu perfil.</p>}
      </main>
    </div>
  </div>;
}
