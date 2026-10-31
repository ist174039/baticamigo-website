"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {FolderPlus,FilePlus2,Folder,FileText,Search,History,ShieldCheck,ArrowLeft,Eye,Download,Pencil,Trash2,RefreshCcw} from "lucide-react";
import {platformAuth} from "../../lib/firebase-client";
import {WorkspacePanel} from "../components/ui/workspace-panel";
import {Button} from "../components/ui/button";
import {DOCUMENT_CATEGORIES,DOCUMENT_ROLES} from "../../lib/platform/document-library.mjs";

const endpoint="/api/platform/document-library";
const categories={institucional:"Institucional",educacao:"Educação",financeiro:"Financeiro",investimentos:"Investimentos",juridico:"Jurídico",outros:"Outros"};
const roleLabels={admin:"Administração",coordinator:"Coordenação",student:"Aluno",guardian:"Encarregado",tutor:"Explicador",volunteer:"Voluntário",member:"Sócio"};
const emptyPermissions=()=>({viewRoles:[],editRoles:[],viewUids:[],editUids:[]});
const emptyDocument=()=>({title:"",description:"",category:"institucional",folderId:"",revision:0,permissions:emptyPermissions()});
const emptyFolder=()=>({id:"",name:"",parentId:"",permissions:emptyPermissions()});
const time=value=>value?new Date(value).toLocaleString("pt-PT",{dateStyle:"medium",timeStyle:"short"}):"—";
const bytes=value=>value<1000000?Math.round(value/1000)+" KB":(value/1000000).toFixed(1)+" MB";

export default function DocumentLibrary({roles=[],legacyDocuments=null}) {
  const [items,setItems]=useState({folders:[],documents:[]});
  const [people,setPeople]=useState([]);
  const [folderId,setFolderId]=useState("");
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("");
  const [panel,setPanel]=useState("");
  const [chosen,setChosen]=useState(null);
  const [detail,setDetail]=useState(null);
  const [form,setForm]=useState(emptyDocument);
  const [folderForm,setFolderForm]=useState(emptyFolder);
  const [file,setFile]=useState(null);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [showLegacy,setShowLegacy]=useState(false);
  const [trash,setTrash]=useState(false);
  const manager=roles.includes("admin")||roles.includes("coordinator");

  const call=useCallback(async (path=endpoint,options={})=>{
    const current=platformAuth().currentUser;
    if(!current) throw new Error("Inicie sessão novamente.");
    const bearer=await current.getIdToken();
    const response=await fetch(path,{...options,headers:{Authorization:"Bearer "+bearer,...options.headers},cache:"no-store"});
    if(options.binary) {
      if(!response.ok)throw new Error("Não foi possível obter o ficheiro.");
      return response.blob();
    }
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||data.detail||"Não foi possível concluir a operação.");
    return data;
  },[]);
  const reload=useCallback(async (includeTrash=false)=>{
    const result=await call(endpoint+(includeTrash?"?trash=1":""));
    setItems(result);
  },[call]);
  useEffect(()=>{
    let active=true;
    reload(false).catch(err=>{if(active)setError(err.message);}).finally(()=>{if(active)setLoading(false);});
    if(roles.includes("admin"))call("/api/platform/users").then(result=>{if(active)setPeople((result.users||[]).filter(user=>user.accessActive&&!user.suspended).map(user=>({uid:user.uid,name:user.displayName||user.email||"Conta"})));}).catch(()=>{});
    return()=>{active=false;};
  },[call,reload,roles.join(",")]);
  const folders=items.folders||[],documents=items.documents||[];
  const currentFolder=folders.find(f=>f.id===folderId);
  const path=useMemo(()=>{
    const list=[],seen=new Set();let id=folderId;
    while(id&&!seen.has(id)){seen.add(id);const found=folders.find(f=>f.id===id);if(!found)break;list.unshift(found);id=found.parentId;}
    return list;
  },[folderId,folders]);
  const searched=!!query.trim()||!!category;
  const matchingDocs=documents.filter(doc=>{
    if(!searched&&doc.folderId!==folderId)return false;
    if(category&&doc.category!==category)return false;
    const value=(doc.title+" "+doc.description+" "+doc.category).toLocaleLowerCase("pt-PT");
    return value.includes(query.trim().toLocaleLowerCase("pt-PT"));
  }).sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||"")));
  const childFolders=folders.filter(f=>!searched&&f.parentId===folderId).sort((a,b)=>a.name.localeCompare(b.name,"pt"));
  const openPanel=name=>{setError("");setNotice("");setPanel(name);};
  const startCreate=()=>{
    setChosen(null);setFile(null);setForm({...emptyDocument(),folderId});
    openPanel("createDocument");
  };
  const startFolder=(folder=null)=>{
    setChosen(folder);
    setFolderForm(folder?{id:folder.id,name:folder.name,parentId:folder.parentId||"",permissions:permissionsFrom(folder)}:{...emptyFolder(),parentId:folderId});
    openPanel(folder?"editFolder":"createFolder");
  };
  function permissionsFrom(obj){return {
    viewRoles:obj?.viewRoles||[],editRoles:obj?.editRoles||[],
    viewUids:obj?.viewUids||[],editUids:obj?.editUids||[]
  };}
  const loadDocument=async doc=>{
    setChosen(doc);setDetail(null);setError("");openPanel("details");
    try{
      const data=await call(endpoint+"?documentId="+encodeURIComponent(doc.id));
      setDetail(data);
      setForm({...emptyDocument(),title:data.document.title,description:data.document.description||"",category:data.document.category,folderId:data.document.folderId||"",revision:data.document.revision||0,permissions:permissionsFrom(data.document)});
    }catch(err){setError(err.message);}
  };
  const mutate=async (action,body,success)=>{
    setBusy(true);setError("");
    try{
      const result=await call(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...body})});
      setPanel("");setNotice(success);await reload(trash);return result;
    }catch(err){setError(err.message);return null;}
    finally{setBusy(false);}
  };
  const upload=async event=>{
    event.preventDefault();setError("");
    if(!file){setError("Selecione um ficheiro para continuar.");return;}
    const data=new FormData();
    data.set("file",file);
    if(panel==="uploadVersion")data.set("documentId",chosen.id);
    else {
      ["title","description","category","folderId"].forEach(key=>data.set(key,form[key]));
      data.set("permissions",JSON.stringify(form.permissions));
    }
    setBusy(true);
    try{
      await call(endpoint,{method:"POST",body:data});
      setNotice(panel==="uploadVersion"?"Nova versão guardada. O histórico anterior foi preservado.":"Documento criado e guardado.");
      setPanel("");setFile(null);await reload();
    }catch(err){setError(err.message);}
    finally{setBusy(false);}
  };
  const download=async (version,inline=false)=>{
    if(!chosen)return;
    setBusy(true);setError("");
    try{
      const blob=await call(endpoint+"?documentId="+encodeURIComponent(chosen.id)+"&versionId="+encodeURIComponent(version.id)+(inline?"":"&download=1"),{binary:true});
      const link=URL.createObjectURL(blob);
      if(inline)window.open(link,"_blank","noopener,noreferrer");
      else {const a=document.createElement("a");a.href=link;a.download=version.name;a.click();}
      window.setTimeout(()=>URL.revokeObjectURL(link),60000);
    }catch(err){setError(err.message);}
    finally{setBusy(false);}
  };
  const togglePermission=(key,value,isFolder=false)=>{
    const update=old=>{
      const current=old.permissions[key]||[];
      return {...old,permissions:{...old.permissions,[key]:current.includes(value)?current.filter(x=>x!==value):[...current,value]}};
    };
    if(isFolder)setFolderForm(update);else setForm(update);
  };
  const permissionFields=(value,isFolder=false,allow=true)=> !allow?null:<>
    <fieldset><legend>Partilha por perfil</legend>
      <p>Ver significa consultar e descarregar. Editar permite alterar conteúdo e enviar novas versões.</p>
      {DOCUMENT_ROLES.filter(role=>role!=="admin").map(role=><div className="ba-panel-inline" key={role}>
        <label className="ba-choice"><input type="checkbox" checked={value.permissions.viewRoles.includes(role)} onChange={()=>togglePermission("viewRoles",role,isFolder)}/><span>Ver · {roleLabels[role]}</span></label>
        <label className="ba-choice"><input type="checkbox" checked={value.permissions.editRoles.includes(role)} onChange={()=>togglePermission("editRoles",role,isFolder)}/><span>Editar · {roleLabels[role]}</span></label>
      </div>)}
    </fieldset>
    {!!people.length&&<fieldset><legend>Partilha com contas específicas</legend>
      {people.map(person=><div className="ba-panel-inline" key={person.uid}>
        <label className="ba-choice"><input type="checkbox" checked={value.permissions.viewUids.includes(person.uid)} onChange={()=>togglePermission("viewUids",person.uid,isFolder)}/><span>Ver · {person.name}</span></label>
        <label className="ba-choice"><input type="checkbox" checked={value.permissions.editUids.includes(person.uid)} onChange={()=>togglePermission("editUids",person.uid,isFolder)}/><span>Editar · {person.name}</span></label>
      </div>)}
    </fieldset>}
    <p className="ba-panel-notice">Por omissão, documentos são privados. Os acessos são sempre confirmados novamente no servidor; a navegação não atribui permissões.</p>
  </>;
  const docFields=(canEditPermissions=true)=><div className="ba-panel-form">
    <label>Título do documento<input required minLength={2} maxLength={160} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
    <label>Descrição<textarea maxLength={1500} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
    <div className="ba-panel-inline">
      <label>Categoria<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{DOCUMENT_CATEGORIES.map(key=><option key={key} value={key}>{categories[key]}</option>)}</select></label>
      <label>Pasta<select value={form.folderId} onChange={e=>setForm({...form,folderId:e.target.value})}><option value="">Arquivo principal</option>{folders.map(folder=><option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
    </div>
    {permissionFields(form,false,canEditPermissions)}
  </div>;
  const folderFields=()=> <div className="ba-panel-form">
    <label>Nome da pasta<input minLength={2} maxLength={100} required value={folderForm.name} onChange={e=>setFolderForm({...folderForm,name:e.target.value})}/></label>
    <label>Pasta superior<select value={folderForm.parentId} onChange={e=>setFolderForm({...folderForm,parentId:e.target.value})}><option value="">Arquivo principal</option>{folders.filter(f=>f.id!==folderForm.id).map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
    {permissionFields(folderForm,true)}
  </div>;
  const panelDocument=detail?.document||chosen;
  const panelActions=()=>{
    if(panel==="createDocument"||panel==="uploadVersion")return <><Button type="button" variant="outline" disabled={busy} onClick={()=>setPanel("")}>Cancelar</Button><Button type="submit" form="library-upload" disabled={busy}>{busy?"A guardar…":panel==="uploadVersion"?"Guardar nova versão":"Criar documento"}</Button></>;
    if(panel==="createFolder"||panel==="editFolder")return <><Button type="button" variant="outline" disabled={busy} onClick={()=>setPanel("")}>Cancelar</Button><Button type="submit" form="library-folder" disabled={busy}>{busy?"A guardar…":"Guardar pasta"}</Button></>;
    if(panel==="editDocument")return <><Button type="button" variant="outline" disabled={busy} onClick={()=>setPanel("details")}>Voltar</Button><Button type="submit" form="library-edit" disabled={busy}>{busy?"A guardar…":"Guardar alterações"}</Button></>;
    if(panel==="deleteDocument"||panel==="deleteFolder")return <><Button variant="outline" disabled={busy} onClick={()=>setPanel(panel==="deleteDocument"?"details":"editFolder")}>Cancelar</Button><Button disabled={busy} onClick={()=>mutate(panel==="deleteDocument"?"delete-document":"delete-folder",panel==="deleteDocument"?{documentId:chosen.id}:{folderId:chosen.id},"O elemento foi retirado da biblioteca.")}>Confirmar remoção</Button></>;
    if(panel==="details")return <><Button variant="outline" onClick={()=>setPanel("")}>Fechar</Button>{detail?.canEdit&&<Button onClick={()=>openPanel("editDocument")}>Editar documento</Button>}</>;
    return <Button variant="outline" onClick={()=>setPanel("")}>Fechar</Button>;
  };
  const titleByPanel={
    createDocument:"Adicionar documento",uploadVersion:"Carregar nova versão",createFolder:"Criar pasta",editFolder:"Configurar pasta",
    editDocument:"Editar documento",details:panelDocument?.title||"Detalhes do documento",
    deleteDocument:"Remover documento",deleteFolder:"Eliminar pasta"
  };

  return <section className="platform-card" aria-label="Biblioteca de documentos">
    <div className="platform-list-heading"><div><p className="platform-eyebrow">Biblioteca documental</p><h2>Documentos e pastas</h2><p>Arquivo privado com histórico de versões, pesquisa e partilha por permissões.</p></div></div>
    <div className="ba-document-breadcrumbs" aria-label="Caminho atual">
      <button type="button" onClick={()=>setFolderId("")}>Arquivo principal</button>
      {path.map(f=><span key={f.id}>/ <button type="button" onClick={()=>setFolderId(f.id)}>{f.name}</button></span>)}
    </div>
    <div className="ba-document-toolbar">
      <label className="platform-sr" htmlFor="ba-document-search">Pesquisar documentos</label>
      <input id="ba-document-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar título, descrição ou categoria"/>
      <label className="platform-sr" htmlFor="ba-document-category">Filtrar categoria</label>
      <select id="ba-document-category" value={category} onChange={e=>setCategory(e.target.value)}><option value="">Todas as categorias</option>{DOCUMENT_CATEGORIES.map(c=><option key={c} value={c}>{categories[c]}</option>)}</select>
      {manager&&<><Button variant="outline" onClick={()=>startFolder()}><FolderPlus size={17}/> Nova pasta</Button><Button onClick={startCreate}><FilePlus2 size={17}/> Adicionar documento</Button></>}
      <Button variant="outline" onClick={()=>{setLoading(true);reload(trash).finally(()=>setLoading(false));}}><RefreshCcw size={16}/> Atualizar</Button>
      {roles.includes("admin")&&<Button variant="outline" onClick={async ()=>{setTrash(!trash);setLoading(true);await reload(!trash);setLoading(false);}}>{trash?"Ver ativos":"Arquivo removido"}</Button>}
    </div>
    {notice&&<p role="status" className="ba-panel-notice">{notice}</p>}
    {error&&!panel&&<p role="alert" className="ba-panel-error">{error}</p>}
    {loading?<p role="status">A carregar biblioteca…</p>:<>
      {!searched&&!!childFolders.length&&<div className="ba-document-grid" aria-label="Pastas">
        {childFolders.map(folder=><button className="ba-document-card" key={folder.id} onClick={()=>setFolderId(folder.id)}>
          <Folder size={24} color="#6846b9"/><strong>{folder.name}</strong><small>Abre a pasta para consultar os documentos</small>
        </button>)}
      </div>}
      {manager&&currentFolder&&!searched&&<div className="ba-panel-actions"><Button variant="outline" onClick={()=>startFolder(currentFolder)}>Configurar esta pasta</Button></div>}
      <p aria-live="polite" style={{marginTop:18,color:"#625b70"}}>{matchingDocs.length} documento(s){searched?" encontrado(s)":" nesta pasta"}</p>
      <div className="ba-document-grid" aria-label="Documentos">
        {matchingDocs.map(doc=><button type="button" className="ba-document-card" key={doc.id} onClick={()=>trash?mutate('restore-document',{documentId:doc.id},'Documento restaurado.'):loadDocument(doc)}>
          <FileText size={24} color="#6846b9"/><strong>{doc.title}</strong>
          <small>{categories[doc.category]||"Documento"} · Versão {doc.currentVersion||1}</small>
          <small>{trash?'Selecionar para restaurar':'Atualizado '+time(doc.updatedAt)}</small>
        </button>)}
      </div>
      {!childFolders.length&&!matchingDocs.length&&<p className="ba-panel-notice">Não existem documentos visíveis nesta localização. Os documentos privados só surgem para contas autorizadas.</p>}
    </>}
    {legacyDocuments&&<details style={{marginTop:24}} open={showLegacy} onToggle={e=>setShowLegacy(e.currentTarget.open)}>
      <summary>Documentos de acompanhamento anteriores</summary>
      <p>Estes documentos continuam disponíveis no módulo anterior. Não foram migrados nem eliminados.</p>
      {showLegacy&&legacyDocuments}
    </details>}
    <WorkspacePanel open={!!panel} onOpenChange={value=>{if(!value)setPanel("");}} title={titleByPanel[panel]||"Biblioteca documental"}
      description={panel==="details"?"Consulta, versões e permissões conforme o acesso atribuído.":panel==="uploadVersion"?"A versão anterior permanece no histórico.":undefined}
      eyebrow={panel==="createDocument"||panel==="uploadVersion"?"Carregar ficheiro":panel==="createFolder"||panel==="editFolder"?"Gestão de pastas":"Biblioteca BaticAmigo"}
      variant={panel} wide={panel==="createDocument"||panel==="editDocument"||panel==="createFolder"||panel==="editFolder"}
      busy={busy} actions={panelActions()}>
      {error&&<p role="alert" className="ba-panel-error">{error}</p>}
      {(panel==="createDocument"||panel==="uploadVersion")&&<form id="library-upload" className="ba-panel-form" onSubmit={upload}>
        {panel==="createDocument"&&docFields()}
        <label>Ficheiro (máximo 4 MB; formatos autorizados pela plataforma)
          <input type="file" required accept=".pdf,.docx,.pptx,.xlsx,.jpg,.jpeg,.png,.webp" onChange={e=>setFile(e.target.files?.[0]||null)}/>
        </label>
        {file&&<p className="ba-panel-notice">{file.name} · {bytes(file.size)}</p>}
      </form>}
      {(panel==="createFolder"||panel==="editFolder")&&<form id="library-folder" className="ba-panel-form" onSubmit={e=>{e.preventDefault();mutate(panel==="createFolder"?"create-folder":"update-folder",panel==="createFolder"?{name:folderForm.name,parentId:folderForm.parentId,permissions:folderForm.permissions}:{folderId:folderForm.id,name:folderForm.name,parentId:folderForm.parentId,permissions:folderForm.permissions},"Pasta guardada.");}}>{folderFields()}
        {panel==="editFolder"&&<Button type="button" variant="outline" onClick={()=>openPanel("deleteFolder")}><Trash2 size={16}/> Eliminar pasta vazia</Button>}
      </form>}
      {panel==="details"&&(detail?<div className="ba-panel-form">
        <div className="ba-panel-notice"><strong>{detail.document.title}</strong><p>{detail.document.description||"Sem descrição."}</p><p>Categoria: {categories[detail.document.category]} · {detail.versions.length} versão(ões)</p></div>
        <h3>Histórico de versões</h3>
        <ul className="ba-panel-list">{detail.versions.map(version=><li key={version.id}>
          <strong>Versão {version.number} · {version.name}</strong>
          <p>{time(version.createdAt)} · {bytes(version.size)}</p>
          <div className="ba-panel-actions"><Button variant="outline" disabled={busy} onClick={()=>download(version,true)}><Eye size={16}/> Ver</Button><Button variant="outline" disabled={busy} onClick={()=>download(version)}><Download size={16}/> Descarregar</Button></div>
        </li>)}</ul>
        {detail.canEdit&&<div className="ba-panel-actions"><Button onClick={()=>{setFile(null);openPanel("uploadVersion");}}><History size={16}/> Adicionar nova versão</Button><Button variant="outline" onClick={()=>openPanel("editDocument")}><Pencil size={16}/> Editar metadados</Button><Button variant="outline" onClick={()=>openPanel("deleteDocument")}><Trash2 size={16}/> Remover documento</Button></div>}
      </div>:<p role="status">A carregar detalhes…</p>)}
      {panel==="editDocument"&&<form id="library-edit" className="ba-panel-form" onSubmit={e=>{e.preventDefault();mutate("update-document",{documentId:chosen.id,revision:form.revision,title:form.title,description:form.description,category:form.category,folderId:form.folderId,...(detail?.canManagePermissions?{permissions:form.permissions}:{})},"Documento atualizado.");}}>
        {docFields(detail?.canManagePermissions)}
      </form>}
      {(panel==="deleteDocument"||panel==="deleteFolder")&&<div className="ba-panel-notice">
        <p>Confirma a remoção? {panel==="deleteDocument"?"O documento ficará inacessível, mas as versões serão retidas até uma decisão de conservação e eliminação definitiva.":"Uma pasta só pode ser removida quando não contém documentos ou subpastas."}</p>
      </div>}
    </WorkspacePanel>
  </section>;
}
