const LEGACY_STORAGE='vde-protokoll-v15-sichtbarkeit-reihenfolge';
const DB_NAME='schaefchen-vde-local';
const DB_VERSION=1;
const APP_VERSION=19;
const logoData='logo.png';
const fields=['kunde','objekt','adresse','datum','pruefer','firma','netzform','spannung','erst','wieder','aenderung','gHersteller','gTyp','gSerie','gKal','maengel','ergebnis','next','firmName','firmStreet','firmCity','firmTel','firmFax','firmMobile','firmEmail','firmCEO','firmCourt','firmHRB','defaultPruefer','hakName','hakPlace','hakFuse','hakSource','hakCable','hakCableCustom','hakCores','hakCross'];
const checkItems=['Schutz gegen elektrischen Schlag vorhanden','Schutzleiter und Potentialausgleich vorhanden','Leitungen/Betriebsmittel richtig ausgewählt','Stromkreise eindeutig beschriftet','RCD-Prüftaste betätigt','Drehfeld geprüft','Polung geprüft','Abschaltbedingungen geprüft'];
const fuses={
  'B6':30,'B10':50,'B13':65,'B16':80,'B20':100,'B25':125,'B32':160,'B40':200,
  'C6':60,'C10':100,'C13':130,'C16':160,'C20':200,'C25':250,'C32':320,'C40':400,
  'D6':120,'D10':200,'D13':260,'D16':320,'D20':400,'D25':500,'D32':640,'D40':800
};
let uid=1;
let database=null;
let currentSiteId='';
let currentProtocolId='';
let currentProtocolRecord=null;
let currentPhotos=[];
let suppressAutosave=false;
let saveTimer=null;
let toastTimer=null;
let initialFieldValues={};
let currentStep=1;
const firmFields=['firmName','firmStreet','firmCity','firmTel','firmFax','firmMobile','firmEmail','firmCEO','firmCourt','firmHRB','defaultPruefer'];
const deviceFields=['gHersteller','gTyp','gSerie','gKal'];
const presetFields=[...deviceFields,...firmFields];
const stepInfo={
  1:{title:'Auftrag und Prüfdaten',description:'Grunddaten zur Baustelle und Prüfart. Das voreingestellte Prüfgerät wird automatisch übernommen.'},
  2:{title:'Besichtigen und Erproben',description:'Alle Sicht- und Funktionsprüfungen vollständig bewerten.'},
  3:{title:'Einspeisung',description:'Hausanschluss, Zuleitung und Vorsicherung der Anlage erfassen.'},
  4:{title:'Verteilungen und Stromkreise',description:'Verteilungen in der tatsächlichen Reihenfolge anlegen und Messwerte eintragen.'},
  5:{title:'Bewertung und Abschluss',description:'Mängel, Fotos, Unterschrift und abschließendes Prüfergebnis dokumentieren.'}
};

const cableTypes=['','NYM-J','NYM-O','NYY-J','NYY-O','N2XH-J','N2XH-O','NHXMH-J','NHXMH-O','H07V-U','H07V-K','H07RN-F','NYCWY','J-Y(St)Y','J-H(St)H','LiYY','CAT 7','CAT 7A','LWL'];
const coreCounts=['','1','2','3','4','5','7','10','12','16','18','24','48'];
function cableSelect(cls,value=''){
  const v=String(value||'');
  const custom = v && !cableTypes.includes(v);
  let opts=cableTypes.map(t=>`<option value="${esc(t)}" ${!custom&&t===v?'selected':''}>${t||'Bitte wählen'}</option>`).join('');
  opts += `<option value="__custom" ${custom?'selected':''}>Anderer Kabeltyp / frei eingeben</option>`;
  return `<div class="cableCombo"><select class="${cls}" onchange="toggleCableCustom(this)">${opts}</select><input class="${cls}-custom cableCustom" value="${custom?esc(v):''}" placeholder="Kabeltyp selbst eingeben" style="display:${custom?'block':'none'}"></div>`;
}
function coreSelect(cls,value=''){
  const v=String(value||'');
  let opts=coreCounts.map(t=>`<option value="${esc(t)}" ${t===v?'selected':''}>${t||'Bitte wählen'}</option>`).join('');
  if(v && !coreCounts.includes(v)) opts += `<option value="${esc(v)}" selected>${esc(v)}</option>`;
  return `<select class="${cls}">${opts}</select>`;
}
function toggleCableCustom(sel){
  const inp=sel.parentElement.querySelector('.cableCustom');
  if(inp) inp.style.display = sel.value==='__custom' ? 'block' : 'none';
}
function cableFieldValue(root,selectSel,customSel){
  const s=root.querySelector(selectSel); if(!s)return '';
  return s.value==='__custom' ? (root.querySelector(customSel)?.value||'') : s.value;
}
function displayCable(v,custom){return v==='__custom'?(custom||''):v}
const checks=document.getElementById('checks');
checkItems.forEach((t,i)=>checks.insertAdjacentHTML('beforeend',`<div class="checkrow"><span>${t}</span><label><input type="radio" name="c${i}" value="io"> i.O.</label><label><input type="radio" name="c${i}" value="nio"> n.i.O.</label></div>`));
function id(){return 'id'+(Date.now())+'_'+(uid++)}
function dec(v){if(v===undefined||v===null||String(v).trim()==='')return NaN;return parseFloat(String(v).replace(',','.').replace(/[^0-9.\-]/g,''))}
function val(root,sel){return root.querySelector(sel)?.value||''}
function checked(root,sel){return !!root.querySelector(sel)?.checked}
function esc(s){return String(s||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function addUv(data={}){const uvId=data.id||id();document.getElementById('uvs').insertAdjacentHTML('beforeend',uvHtml(uvId,data));const uv=document.querySelector(`[data-uv="${uvId}"]`);(data.rcds||[]).forEach(r=>addRcd(uvId,r));(data.direct||[]).forEach(c=>addCircuit(uv.querySelector('.directCircuits'),c));if(!(data.rcds||[]).length&&!(data.direct||[]).length)addRcd(uvId,{name:'FI 1'});updateStructureLabels();evalAll();}
function uvHtml(uvId,d={}){return `<div class="uv" data-uv="${uvId}"><div class="titleRow sectionHead"><button type="button" class="collapseBtn" onclick="toggleSection(this)" aria-label="Verteilung ein- oder ausklappen">▾</button><div class="structureHeading"><h3><span class="uv-index">Verteilung</span><span class="structureSeparator"> · </span><span class="uv-title">${esc(d.name||'UV')}</span></h3></div><div class="structureControls"><button type="button" class="secondary small" onclick="moveUv(this,-1)" title="Nach oben">↑</button><button type="button" class="secondary small" onclick="moveUv(this,1)" title="Nach unten">↓</button><button class="danger small" onclick="removeStructure(this,'.uv','Verteilung')">Löschen</button></div></div><div class="uvBody"><div class="grid"><label>Bezeichnung der Verteilung<input class="uv-name" value="${esc(d.name||'UV')}" placeholder="z. B. UV EG"></label><label>Zuleitung kommt aus<input class="uv-source" value="${esc(d.source||'Hausanschlusskasten')}" placeholder="z. B. HAK, HV, UV EG"></label><label>Kabeltyp Zuleitung${cableSelect('uv-feed-cable', d.feedCable||'')}</label><label>Adernzahl Zuleitung${coreSelect('uv-feed-cores', d.feedCores||'')}</label><label>Querschnitt Zuleitung<span class="unitField"><input class="uv-feed-cross" value="${esc(d.feedCross||'')}" inputmode="decimal" placeholder="z. B. 10"><span>mm²</span></span></label><label>Vorsicherung / Absicherung<input class="uv-feed-fuse" value="${esc(d.feedFuse||d.feed||'')}" placeholder="z. B. 35 A"></label><label>Ort<input class="uv-place" value="${esc(d.place||'')}"></label></div><div class="subhead">FI/RCD-Gruppen</div><div class="rcds"></div><div class="singleAdd"><button onclick="addRcd('${uvId}')">+ FI/RCD hinzufügen</button></div><div class="subhead directHead">FI/LS und LS ohne vorgeschalteten FI</div><div class="directCircuits circuits"></div><div class="directAddMenu"><button class="secondary" onclick="addCircuit(this.closest('.uv').querySelector('.directCircuits'),{device:'ls'})">+ LS ohne FI hinzufügen</button><button onclick="addCircuit(this.closest('.uv').querySelector('.directCircuits'),{device:'fils'})">+ FI/LS hinzufügen</button></div></div></div>`}
function toggleSection(btn){const box=btn.closest('.uv,.rcd');box.classList.toggle('collapsed');btn.textContent=box.classList.contains('collapsed')?'▸':'▾';}
function toggleHak(btn){const b=document.getElementById('hakBody');const closed=b.style.display==='none';b.style.display=closed?'grid':'none';btn.textContent=closed?'▾':'▸';}
function addRcd(uvId,data={}){const uv=document.querySelector(`[data-uv="${uvId}"]`);const rcdId=data.id||id();uv.querySelector('.rcds').insertAdjacentHTML('beforeend',rcdHtml(rcdId,data));const r=uv.querySelector(`[data-rcd="${rcdId}"]`);(data.circuits||[]).forEach(c=>addCircuit(r.querySelector('.circuits'),c));if(!(data.circuits||[]).length)addCircuit(r.querySelector('.circuits'));updateStructureLabels();evalAll();}
function rcdHtml(rcdId,d={}){return `<div class="rcd" data-rcd="${rcdId}"><div class="titleRow sectionHead"><button type="button" class="collapseBtn" onclick="toggleSection(this)" aria-label="FI-Stromkreis ein- oder ausklappen">▾</button><div class="structureHeading"><h4><span class="rcd-index">FI-Stromkreis</span><span class="structureSeparator"> · </span><span class="rcd-title">${esc(d.name||'FI')}</span></h4></div><div class="structureControls"><button type="button" class="secondary small" onclick="moveRcd(this,-1)" title="Nach oben">↑</button><button type="button" class="secondary small" onclick="moveRcd(this,1)" title="Nach unten">↓</button><button class="danger small" onclick="removeStructure(this,'.rcd','FI/RCD')">Löschen</button></div></div><div class="rcdBody"><div class="grid"><label>FI-Stromkreis / Bezeichnung<input class="rcd-name" value="${esc(d.name||'FI')}" placeholder="z. B. FI Bad/Küche"></label><label>Typ<select class="rcd-type"><option ${d.type==='A'?'selected':''}>A</option><option ${d.type==='F'?'selected':''}>F</option><option ${d.type==='B'?'selected':''}>B</option><option ${d.type==='AC'?'selected':''}>AC</option></select></label><label>Charakteristik<select class="rcd-char"><option ${d.char==='unverzögert'?'selected':''}>unverzögert</option><option ${d.char==='G / kurzzeitverzögert'?'selected':''}>G / kurzzeitverzögert</option><option ${d.char==='S / selektiv'?'selected':''}>S / selektiv</option></select></label><label>Bemessungsstrom In<select class="rcd-in"><option>25 A</option><option ${d.inn==='40 A'?'selected':''}>40 A</option><option ${d.inn==='63 A'?'selected':''}>63 A</option><option ${d.inn==='80 A'?'selected':''}>80 A</option></select></label><label>Bemessungsdifferenzstrom IΔn<select class="rcd-idn"><option ${d.idn==='10'?'selected':''} value="10">10 mA</option><option ${!d.idn||d.idn==='30'?'selected':''} value="30">30 mA</option><option ${d.idn==='100'?'selected':''} value="100">100 mA</option><option ${d.idn==='300'?'selected':''} value="300">300 mA</option></select></label><label class="checkLabel">Prüftaste<input class="rcd-test" type="checkbox" ${d.test?'checked':''}></label></div><div class="status neutral rcd-status">FI-Bewertung fehlt</div><div class="circuits"></div></div></div>`}
function addCircuit(container,data={}){if(typeof container==='string')container=document.querySelector(container);data=data||{};data.insideRcd=!!container.closest('.rcd');if(data.insideRcd&&data.device==='fils')data.device='ls';container.insertAdjacentHTML('beforeend',circuitHtml(data));const el=container.lastElementChild;updateCircuitVisibility(el);updateStructureLabels();evalAll();updateStepProgress();saveData();return el;}
function moveElement(element,dir){if(!element)return;if(dir<0&&element.previousElementSibling)element.parentElement.insertBefore(element,element.previousElementSibling);if(dir>0&&element.nextElementSibling)element.parentElement.insertBefore(element.nextElementSibling,element);updateStructureLabels();evalAll();saveData()}
function moveUv(btn,dir){moveElement(btn.closest('.uv'),dir)}
function moveRcd(btn,dir){moveElement(btn.closest('.rcd'),dir)}
function moveCircuit(btn,dir){moveElement(btn.closest('.circuit'),dir)}
function removeStructure(btn,selector,label){const element=btn.closest(selector);if(!element||!confirm(`${label} wirklich löschen?`))return;element.remove();updateStructureLabels();evalAll();updateStepProgress();saveData()}
function duplicateCircuit(btn){const circuit=btn.closest('.circuit');if(!circuit)return;addCircuit(circuit.parentElement,circuitData(circuit));showToast('Stromkreis dupliziert')}
function addCircuitAfter(btn){const circuit=btn.closest('.circuit');if(!circuit)return;const device=circuit.closest('.rcd')?'ls':(val(circuit,'.ck-device')||'ls');const added=addCircuit(circuit.parentElement,{device});circuit.after(added);updateStructureLabels();evalAll();saveData();added.scrollIntoView({behavior:'smooth',block:'center'});}
function circuitHtml(d={}){const dev=d.device||'ls';const inside=!!d.insideRcd;const deviceField=inside?`<div class="badgeField"><span>Schutzart</span><b>LS mit vorgeschaltetem FI</b><input type="hidden" class="ck-device" value="ls"></div>`:`<label>Schutzorgan<select class="ck-device" onchange="updateCircuitVisibility(this.closest('.circuit'))"><option value="ls" ${dev!=='fils'?'selected':''}>LS ohne FI</option><option value="fils" ${dev==='fils'?'selected':''}>FI/LS</option></select></label>`;return `<div class="circuit ${inside?'insideRcd':''}"><div class="circuitTop"><div class="circuitHeading"><b class="circuit-index">Stromkreis</b><span class="circuit-title">${esc(d.name||'Noch nicht bezeichnet')}</span></div><div class="moveBtns"><button type="button" class="secondary small" onclick="moveCircuit(this,-1)" title="Nach oben">↑</button><button type="button" class="secondary small" onclick="moveCircuit(this,1)" title="Nach unten">↓</button><button type="button" class="secondary small duplicateButton" onclick="duplicateCircuit(this)" title="Duplizieren">Kopie</button></div></div><div class="grid circuitBasics">${deviceField}<label>Stromkreis / Sicherung<input class="ck-name" value="${esc(d.name||'')}" placeholder="z. B. F1 Steckdosen Küche"></label><label>Kabeltyp / Leitung${cableSelect('ck-cable', d.cable||'')}</label><label>Adernzahl${coreSelect('ck-cores', d.cores||'')}</label><label>Querschnitt<span class="unitField"><input class="ck-cross" value="${esc(d.cross||'')}" inputmode="decimal" placeholder="z. B. 1,5"><span>mm²</span></span></label><label>LS-Charakteristik<select class="ck-char"><option ${d.char==='B'?'selected':''}>B</option><option ${d.char==='C'?'selected':''}>C</option><option ${d.char==='D'?'selected':''}>D</option></select></label><label>LS-Nennstrom<select class="ck-a"><option>6</option><option ${d.a==='10'?'selected':''}>10</option><option ${d.a==='13'?'selected':''}>13</option><option ${!d.a||d.a==='16'?'selected':''}>16</option><option ${d.a==='20'?'selected':''}>20</option><option ${d.a==='25'?'selected':''}>25</option><option ${d.a==='32'?'selected':''}>32</option><option ${d.a==='40'?'selected':''}>40</option></select></label><label class="filsOnly">FI/LS Typ<select class="ck-rcdtype"><option ${!d.rcdType||d.rcdType==='A'?'selected':''}>A</option><option ${d.rcdType==='F'?'selected':''}>F</option><option ${d.rcdType==='B'?'selected':''}>B</option><option ${d.rcdType==='AC'?'selected':''}>AC</option></select></label><label class="filsOnly">FI/LS Charakteristik<select class="ck-rcdchar"><option ${!d.rcdChar||d.rcdChar==='unverzögert'?'selected':''}>unverzögert</option><option ${d.rcdChar==='G / kurzzeitverzögert'?'selected':''}>G / kurzzeitverzögert</option><option ${d.rcdChar==='S / selektiv'?'selected':''}>S / selektiv</option></select></label><label class="filsOnly">FI/LS IΔn<select class="ck-rcdidn"><option ${d.rcdIdn==='10'?'selected':''} value="10">10 mA</option><option ${!d.rcdIdn||d.rcdIdn==='30'?'selected':''} value="30">30 mA</option><option ${d.rcdIdn==='100'?'selected':''} value="100">100 mA</option><option ${d.rcdIdn==='300'?'selected':''} value="300">300 mA</option></select></label><label class="checkLabel filsOnly">FI/LS Prüftaste<input class="ck-rcdtest" type="checkbox" ${d.rcdTest?'checked':''}></label></div><details class="measurementPanel" open><summary>Messwerte eingeben</summary><div class="grid measurementGrid"><label>Schutzleiter RPE Ω<input class="ck-rpe" value="${esc(d.rpe||'')}" inputmode="decimal"></label><label>Isolation RISO MΩ<input class="ck-riso" value="${esc(d.riso||'')}" inputmode="decimal"></label><label>Netzinnenimpedanz Zi Ω<input class="ck-zi" value="${esc(d.zi||'')}" inputmode="decimal"></label><label>Schleifenimpedanz Zs Ω<input class="ck-zs" value="${esc(d.zs||'')}" inputmode="decimal"></label><label>Kurzschlussstrom IK A<input class="ck-ik" value="${esc(d.ik||'')}" inputmode="decimal"></label><label class="rcdMeasure">RCD-Auslösezeit ms<input class="ck-rcdms" value="${esc(d.rcdms||'')}" inputmode="decimal"></label><label class="rcdMeasure">RCD-Auslösestrom mA<input class="ck-rcdma" value="${esc(d.rcdma||'')}" inputmode="decimal"></label><label>Bemerkung<input class="ck-note" value="${esc(d.note||'')}"></label></div></details><div class="status neutral">Bewertung fehlt</div><div class="circuitFooter"><button class="danger small" onclick="removeStructure(this,'.circuit','Stromkreis')">Stromkreis löschen</button><button class="secondary small" onclick="addCircuitAfter(this)">+ Stromkreis hinzufügen</button></div></div>`}
function updateStructureLabels(){
  document.querySelectorAll('.uv').forEach((uv,uvIndex)=>{
    const uvName=val(uv,'.uv-name')||`Verteilung ${uvIndex+1}`;const uvNumber=uvIndex+1;
    const index=uv.querySelector('.uv-index'),title=uv.querySelector('.uv-title');if(index)index.textContent=`Verteilung ${uvNumber}`;if(title)title.textContent=uvName;
    uv.querySelectorAll(':scope .uvBody > .rcds > .rcd').forEach((rcd,rcdIndex)=>{
      const rcdName=val(rcd,'.rcd-name')||`FI ${rcdIndex+1}`;const ri=rcd.querySelector('.rcd-index'),rt=rcd.querySelector('.rcd-title');if(ri)ri.textContent=`FI-Stromkreis ${uvNumber}.${rcdIndex+1}`;if(rt)rt.textContent=rcdName;
      rcd.querySelectorAll(':scope .rcdBody > .circuits > .circuit').forEach((c,circuitIndex)=>setCircuitHeading(c,`${uvNumber}.${rcdIndex+1}.${circuitIndex+1}`));
    });
    uv.querySelectorAll(':scope .uvBody > .directCircuits > .circuit').forEach((c,circuitIndex)=>setCircuitHeading(c,`${uvNumber}.D${circuitIndex+1}`));
  });
}
function setCircuitHeading(c,number){const index=c.querySelector('.circuit-index'),title=c.querySelector('.circuit-title');if(index)index.textContent=`Stromkreis ${number}`;if(title)title.textContent=val(c,'.ck-name')||'Noch nicht bezeichnet'}
function updateCircuitVisibility(c){if(!c)return;const isInside=c.closest('.rcd')!==null;const isFils=val(c,'.ck-device')==='fils';c.classList.toggle('insideRcd',isInside);c.classList.toggle('isFils',isFils);c.classList.toggle('noRcd',!isInside&&!isFils);c.querySelectorAll('.filsOnly').forEach(e=>e.style.display=isFils?'flex':'none');c.querySelectorAll('.rcdMeasure').forEach(e=>e.style.display=(isInside||isFils)?'flex':'none');}
function evalRcd(r){const ok=checked(r,'.rcd-test');let msg=[];if(!ok)msg.push('Prüftaste nicht bestätigt');const st=r.querySelector('.rcd-status');st.className='status rcd-status '+(ok?'ok':'warn');st.textContent=ok?'FI: Parameter erfasst / Prüftaste i.O.':'FI: Prüftaste nicht bestätigt';if(msg.length)st.innerHTML+=`<ul class="details"><li>${msg.map(esc).join('</li><li>')}</li></ul>`;return {ok:true,warn:!ok,msg};}
function evalCircuit(c,hasRcd){const isFils=val(c,'.ck-device')==='fils';hasRcd=hasRcd||isFils;const riso=dec(val(c,'.ck-riso')), zi=dec(val(c,'.ck-zi')), zs=dec(val(c,'.ck-zs')), ik=dec(val(c,'.ck-ik')), rpe=dec(val(c,'.ck-rpe'));const key=val(c,'.ck-char')+val(c,'.ck-a');const ia=fuses[key];let ok=true,warn=false,msg=[];
 if(isNaN(riso)){warn=true;msg.push('RISO fehlt')} else if(riso<1){ok=false;msg.push('RISO < 1 MΩ')}
 if(!isNaN(rpe)&&rpe>1){warn=true;msg.push('RPE > 1 Ω, Leitungslänge/Querschnitt prüfen')}
 if(!isNaN(zi)&&zi>50){warn=true;msg.push('Zi sehr hoch, Plausibilität prüfen')}
 if(!hasRcd){if(isNaN(zs)&&isNaN(ik)){warn=true;msg.push('Zs oder IK fehlt')}else{if(!isNaN(zs)&&ia){const max=230/ia;if(zs>max){ok=false;msg.push(`Zs > ${max.toFixed(2)} Ω für ${key}A`)}} if(!isNaN(ik)&&ia&&ik<ia){ok=false;msg.push(`IK < erforderlicher Auslösestrom ${ia} A für ${key}A`)}}}
 else {
   if(!isNaN(zs)&&zs>50){warn=true;msg.push('Zs sehr hoch, Plausibilität prüfen')}
   const r=c.closest('.rcd'); const idn=isFils?dec(val(c,'.ck-rcdidn')):dec(val(r,'.rcd-idn')); const ch=isFils?val(c,'.ck-rcdchar'):val(r,'.rcd-char'); const ms=dec(val(c,'.ck-rcdms')); const ma=dec(val(c,'.ck-rcdma')); if(isFils&&!checked(c,'.ck-rcdtest')){warn=true;msg.push('FI/LS-Prüftaste nicht bestätigt')}
   if(!isNaN(ms)){let limit=ch.includes('S /')?500:300;if(ms>limit){ok=false;msg.push(`RCD-Zeit > ${limit} ms`)}} else {warn=true;msg.push('RCD-Auslösezeit fehlt')}
   if(!isNaN(ma)&&!isNaN(idn)){if(ma>idn){ok=false;msg.push('RCD-Auslösestrom > IΔn')} if(ma<idn*0.5){warn=true;msg.push('RCD-Auslösestrom < 0,5×IΔn prüfen')}} else {warn=true;msg.push('RCD-Auslösestrom fehlt')}
 }
 const st=c.querySelector('.status');st.className='status '+(ok?(warn?'warn':'ok'):'bad');st.textContent=ok?(warn?'Stromkreis: prüfen / Angaben unvollständig':'Stromkreis: i.O.'):'Stromkreis: n.i.O.';if(msg.length)st.innerHTML+=`<ul class="details"><li>${msg.map(esc).join('</li><li>')}</li></ul>`;return {ok,warn,msg};}
function evalAll(){document.querySelectorAll('.circuit').forEach(updateCircuitVisibility);let bad=0,warn=0,total=0;document.querySelectorAll('.rcd').forEach(r=>{total++;const x=evalRcd(r);if(!x.ok)bad++;else if(x.warn)warn++;r.querySelectorAll('.circuit').forEach(c=>{total++;const y=evalCircuit(c,true);if(!y.ok)bad++;else if(y.warn)warn++;});});document.querySelectorAll('.uv .uvBody > .directCircuits > .circuit').forEach(c=>{total++;const y=evalCircuit(c,c.querySelector('.ck-device')?.value==='fils');if(!y.ok)bad++;else if(y.warn)warn++;});const o=document.getElementById('overall'),l=document.getElementById('overallList');o.className='overall '+(bad?'bad':warn?'warn':'ok');o.textContent=bad?`Nicht in Ordnung: ${bad} Fehler, ${warn} Hinweise`:warn?`Prüfen: ${warn} Hinweise / fehlende Werte`:`In Ordnung: ${total} geprüfte Elemente`;l.innerHTML='';}
function collect(){const data={fields:{},checks:{},uvs:[],photos:currentPhotos.map(p=>({...p})),sig:document.getElementById('sig').toDataURL()};fields.forEach(id=>{const e=document.getElementById(id);data.fields[id]=(e.type==='checkbox'||e.type==='radio')?e.checked:e.value});checkItems.forEach((_,i)=>{const e=document.querySelector(`[name=c${i}]:checked`);data.checks[i]=e?e.value:''});document.querySelectorAll('.uv').forEach(uv=>{const u={id:uv.dataset.uv,name:val(uv,'.uv-name'),source:val(uv,'.uv-source'),feedCable:cableFieldValue(uv,'.uv-feed-cable','.uv-feed-cable-custom'),feedCores:val(uv,'.uv-feed-cores'),feedCross:val(uv,'.uv-feed-cross'),feedFuse:val(uv,'.uv-feed-fuse'),feed:val(uv,'.uv-feed-fuse'),place:val(uv,'.uv-place'),rcds:[],direct:[]};uv.querySelectorAll(':scope .uvBody > .rcds > .rcd').forEach(r=>{const rd={id:r.dataset.rcd,name:val(r,'.rcd-name'),type:val(r,'.rcd-type'),char:val(r,'.rcd-char'),inn:val(r,'.rcd-in'),idn:val(r,'.rcd-idn'),test:checked(r,'.rcd-test'),circuits:[]};r.querySelectorAll('.circuit').forEach(c=>rd.circuits.push(circuitData(c)));u.rcds.push(rd)});uv.querySelectorAll(':scope .uvBody > .directCircuits > .circuit').forEach(c=>u.direct.push(circuitData(c)));data.uvs.push(u)});return data}
function circuitData(c){const inRcd=!!c.closest('.rcd');const device=inRcd?'ls':(val(c,'.ck-device')||'ls');return {device,name:val(c,'.ck-name'),cable:cableFieldValue(c,'.ck-cable','.ck-cable-custom'),cores:val(c,'.ck-cores'),cross:val(c,'.ck-cross'),char:val(c,'.ck-char'),a:val(c,'.ck-a'),rcdType:val(c,'.ck-rcdtype'),rcdChar:val(c,'.ck-rcdchar'),rcdIdn:val(c,'.ck-rcdidn'),rcdTest:checked(c,'.ck-rcdtest'),rpe:val(c,'.ck-rpe'),riso:val(c,'.ck-riso'),zi:val(c,'.ck-zi'),zs:val(c,'.ck-zs'),ik:val(c,'.ck-ik'),rcdms:val(c,'.ck-rcdms'),rcdma:val(c,'.ck-rcdma'),note:val(c,'.ck-note')}}
function saveData(manual=false){
  if(suppressAutosave||!currentProtocolId)return;
  clearTimeout(saveTimer);
  if(manual){persistCurrentProtocol(true);return}
  setSaveState('saving','Speichert …');
  saveTimer=setTimeout(()=>persistCurrentProtocol(false),650);
}
function updateLogoPreview(){const p=document.getElementById('logoPreview');if(p)p.innerHTML='<img src="logo.png" alt="Schaaf-Elektro Logo"><span>Fest hinterlegtes Firmenlogo</span>'}
function initSettings(){updateLogoPreview();const dp=document.getElementById('defaultPruefer');if(dp){dp.addEventListener('change',()=>{const pr=document.getElementById('pruefer');if(pr&&!pr.value)pr.value=dp.value;});}}
async function openPresetDialog(){
  const saved=database?await dbGet('settings','company'):null,data=saved&&saved.data||{};
  presetFields.forEach(id=>{const e=document.getElementById(id);if(e)e.value=data[id]!==undefined?data[id]:(initialFieldValues[id]||'')});
  updateLogoPreview();showDialog(document.getElementById('presetDialog'));
}
function closePresetDialog(){closeDialog(document.getElementById('presetDialog'))}
async function savePresetForm(event){
  event.preventDefault();const data={};presetFields.forEach(id=>data[id]=document.getElementById(id)?.value||'');
  await dbPut('settings',{key:'company',data,updatedAt:nowIso()});closePresetDialog();showToast('Voreinstellungen lokal gespeichert');
}
function loadData(data={}){
  suppressAutosave=true;
  const blank=makeBlankData();
  const source={...blank,...data,fields:{...blank.fields,...(data.fields||{})},checks:data.checks||{},uvs:data.uvs||[]};
  document.getElementById('uvs').innerHTML='';
  document.querySelectorAll('#checks input[type=radio]').forEach(e=>e.checked=false);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  fields.forEach(id=>{const e=document.getElementById(id);if(e&&source.fields[id]!==undefined){if(e.type==='checkbox'||e.type==='radio')e.checked=!!source.fields[id];else e.value=source.fields[id]||''}});
  Object.entries(source.checks||{}).forEach(([i,v])=>{const e=document.querySelector(`[name=c${i}][value="${v}"]`);if(e)e.checked=true});
  (source.uvs||[]).forEach(addUv);if(!(source.uvs||[]).length)addUv({name:'UV EG'});
  currentPhotos=Array.isArray(source.photos)?source.photos.map(p=>({...p})):[];renderPhotos();
  if(source.sig&&source.sig.length>100){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0,canvas.width,canvas.height);img.src=source.sig}
  if(!document.getElementById('firma').value)document.getElementById('firma').value=document.getElementById('firmName').value;
  if(!document.getElementById('pruefer').value)document.getElementById('pruefer').value=document.getElementById('defaultPruefer').value;
  if(document.getElementById('hakCable'))toggleCableCustom(document.getElementById('hakCable'));
  updateLogoPreview();updateStructureLabels();evalAll();suppressAutosave=false;showStep(1,false);
}
async function resetData(){
  if(!currentProtocolId||!confirm('Diese Prüfung wirklich dauerhaft aus dem Baustellenordner löschen?'))return;
  const siteId=currentSiteId;
  await dbDelete('protocols',currentProtocolId);
  currentProtocolId='';currentProtocolRecord=null;currentPhotos=[];
  showToast('Prüfung gelöscht');
  await openSite(siteId);
}
document.addEventListener('input',e=>{if(e.target.closest('#appMain')){if(e.target.matches('.uv-name,.rcd-name,.ck-name'))updateStructureLabels();evalAll();updateStepProgress();saveData()}});
document.addEventListener('change',e=>{if(e.target.closest('#appMain')){evalAll();updateStepProgress();saveData()}});
document.getElementById('fotos').addEventListener('change',e=>handlePhotoFiles([...e.target.files]));
const canvas=document.getElementById('sig'),ctx=canvas.getContext('2d');ctx.lineWidth=4;ctx.lineCap='round';let drawing=false;function pos(e){const r=canvas.getBoundingClientRect(),t=e.touches?e.touches[0]:e;return{x:(t.clientX-r.left)*canvas.width/r.width,y:(t.clientY-r.top)*canvas.height/r.height}}function start(e){drawing=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault()}function move(e){if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault()}function end(){drawing=false;saveData()}canvas.addEventListener('mousedown',start);canvas.addEventListener('mousemove',move);canvas.addEventListener('mouseup',end);canvas.addEventListener('touchstart',start,{passive:false});canvas.addEventListener('touchmove',move,{passive:false});canvas.addEventListener('touchend',end);function clearSig(){ctx.clearRect(0,0,canvas.width,canvas.height);saveData()}
if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{})}

function circuitEvalText(c,hasRcd,r){
  const isFils=c.device==='fils'; hasRcd=hasRcd||isFils;
  const riso=dec(c.riso), zi=dec(c.zi), zs=dec(c.zs), ik=dec(c.ik), rpe=dec(c.rpe);
  const key=(c.char||'B')+(c.a||'16'); const ia=fuses[key];
  let ok=true,warn=false,msg=[];
  if(isNaN(riso)){warn=true;msg.push('RISO fehlt')} else if(riso<1){ok=false;msg.push('RISO < 1 MΩ')}
  if(!isNaN(rpe)&&rpe>1){warn=true;msg.push('RPE > 1 Ω prüfen')}
  if(!isNaN(zi)&&zi>50){warn=true;msg.push('Zi sehr hoch')}
  if(!hasRcd){
    if(isNaN(zs)&&isNaN(ik)){warn=true;msg.push('Zs oder IK fehlt')}
    else{
      if(!isNaN(zs)&&ia){const max=230/ia;if(zs>max){ok=false;msg.push(`Zs > ${max.toFixed(2)} Ω`)}}
      if(!isNaN(ik)&&ia&&ik<ia){ok=false;msg.push(`IK < erforderlicher Auslösestrom ${ia} A`)}
    }
  } else {
    if(!isNaN(zs)&&zs>50){warn=true;msg.push('Zs sehr hoch')}
    const idn=isFils?dec(c.rcdIdn):dec(r&&r.idn), ch=isFils?(c.rcdChar||''):(r&&r.char)||''; const ms=dec(c.rcdms), ma=dec(c.rcdma); if(isFils&&!c.rcdTest){warn=true;msg.push('FI/LS-Prüftaste nicht bestätigt')}
    if(!isNaN(ms)){let limit=ch.includes('S /')?500:300;if(ms>limit){ok=false;msg.push(`RCD-Zeit > ${limit} ms`)}} else {warn=true;msg.push('RCD-Zeit fehlt')}
    if(!isNaN(ma)&&!isNaN(idn)){if(ma>idn){ok=false;msg.push('RCD-Strom > IΔn')} if(ma<idn*0.5){warn=true;msg.push('RCD-Strom < 0,5×IΔn')}} else {warn=true;msg.push('RCD-Strom fehlt')}
  }
  return {state:ok?(warn?'warn':'ok'):'bad', text:ok?(warn?'prüfen':'i.O.'):'n.i.O.', msg:msg.join('; ')};
}
function rcdEvalText(r){
  let ok=true,warn=false,msg=[];
  if(!r.test){warn=true;msg.push('Prüftaste nicht bestätigt')}
  return {state:ok?(warn?'warn':'ok'):'bad', text:ok?(warn?'prüfen':'i.O.'):'n.i.O.', msg:msg.join('; ')};
}
function yn(v){return v?'Ja':'Nein'}
function preparePrint(){
  evalAll(); saveData();
  const d=collect(); const f=d.fields||{};
  let bad=0,warn=0,rows='';
  (d.uvs||[]).forEach((u,ui)=>{
    const feedTxt = `kommt aus: ${esc(u.source||'-')} | Kabel: ${esc(u.feedCable||'-')} ${u.feedCores?esc(u.feedCores)+'-adrig ':''}${u.feedCross?esc(u.feedCross)+' mm²':''} | Vorsicherung: ${esc(u.feedFuse||u.feed||'-')}`;
    rows += `<tr><th colspan="19">UV: ${esc(u.name||('UV '+(ui+1)))} &nbsp; | &nbsp; Ort: ${esc(u.place||'-')} &nbsp; | &nbsp; Zuleitung ${feedTxt}</th></tr>`;
    (u.rcds||[]).forEach((r,ri)=>{
      const re=rcdEvalText(r); if(re.state==='bad')bad++; else if(re.state==='warn')warn++;
      const fiNumber=`${ui+1}.${ri+1}`;
      rows += `<tr><td colspan="19"><b>FI-Stromkreis ${fiNumber}:</b> ${esc(r.name||('FI '+(ri+1)))} | Typ ${esc(r.type)} | Charakteristik ${esc(r.char)} | In ${esc(r.inn)} | IΔn ${esc(r.idn)} mA | Prüftaste ${yn(r.test)} | <span class="${re.state}">${re.text}</span>${re.msg?' – '+esc(re.msg):''}</td></tr>`;
      rows += measHeader();
      (r.circuits||[]).forEach((c,ci)=>{const ce=circuitEvalText(c,true,r); if(ce.state==='bad')bad++; else if(ce.state==='warn')warn++; rows += measRow(u.name,r.name,c,ce,`${fiNumber}.${ci+1}`,true,r);});
    });
    if((u.direct||[]).length){
      rows += `<tr><td colspan="19"><b>Direkte Stromkreise: LS ohne FI davor oder FI/LS integriert</b></td></tr>`+measHeader();
      (u.direct||[]).forEach((c,ci)=>{const ce=circuitEvalText(c,c.device==='fils',null); if(ce.state==='bad')bad++; else if(ce.state==='warn')warn++; rows += measRow(u.name,c.device==='fils'?'FI/LS integriert':'ohne FI/RCD',c,ce,`${ui+1}.D${ci+1}`,false,null);});
    }
  });
  const checksHtml=checkItems.map((t,i)=>`<tr><td>${esc(t)}</td><td>${d.checks&&d.checks[i]==='io'?'X':''}</td><td>${d.checks&&d.checks[i]==='nio'?'X':''}</td></tr>`).join('');
  const prueferSig = d.sig && d.sig.length>1000 ? `<img src="${d.sig}">` : '';
  const photosHtml=(d.photos||[]).length?`<h2>Fotodokumentation</h2><div class="printPhotos">${d.photos.map((photo,i)=>`<figure><img src="${photo.dataUrl}" alt="Foto ${i+1}"><figcaption>${esc(photo.name||`Foto ${i+1}`)}</figcaption></figure>`).join('')}</div>`:'';
  const overall = bad?`<span class="bad">Nicht in Ordnung (${bad} Fehler, ${warn} Hinweise)</span>`:warn?`<span class="warn">Prüfen / unvollständig (${warn} Hinweise)</span>`:`<span class="ok">In Ordnung</span>`;
  const logo = logoData ? `<img src="${logoData}" alt="Firmenlogo">` : '<div></div>';
  const footer = `<div class="pdfFooter"><div><b>${esc(f.firmName||'')}</b><br>${esc(f.firmStreet||'')}<br>${esc(f.firmCity||'')}</div><div>Tel.: ${esc(f.firmTel||'')}<br>Fax: ${esc(f.firmFax||'')}<br>Mobil: ${esc(f.firmMobile||'')}<br>E-Mail: ${esc(f.firmEmail||'')}</div><div>${esc(f.firmHRB||'')}<br>${esc(f.firmCourt||'')}<br>Geschäftsführer:<br>${esc(f.firmCEO||'')}</div></div>`;
  document.getElementById('printReport').innerHTML = `
    <div class="printHeader"><div>${logo}</div><div><h1>VDE Prüfprotokoll</h1><p>DIN VDE 0100-600 / DIN VDE 0105-100 / DGUV V3</p></div><div class="smalltxt"><b>Datum:</b> ${esc(f.datum||'-')}<br><b>Prüfer:</b> ${esc(f.pruefer||'-')}</div></div>
    <div class="meta">
      <div class="box"><b>Auftraggeber:</b> ${esc(f.kunde)}<br><b>Objekt:</b> ${esc(f.objekt)}<br><b>Adresse:</b> ${esc(f.adresse)}</div>
      <div class="box"><b>Prüfdatum:</b> ${esc(f.datum)}<br><b>Prüfer:</b> ${esc(f.pruefer)}<br><b>Firma:</b> ${esc(f.firma)}</div>
      <div class="box"><b>Netzform:</b> ${esc(f.netzform)}<br><b>Nennspannung:</b> ${esc(f.spannung)}<br><b>Prüfart:</b> ${f.erst?'Erstprüfung ':''}${f.wieder?'Wiederholungsprüfung ':''}${f.aenderung?'Änderung/Erweiterung':''}</div>
      <div class="box"><b>Prüfgerät:</b> ${esc(f.gHersteller)} ${esc(f.gTyp)}<br><b>Seriennummer:</b> ${esc(f.gSerie)}<br><b>Kalibrierung bis:</b> ${esc(f.gKal)}</div>
      <div class="box"><b>Hausanschlusskasten:</b> ${esc(f.hakName)}<br><b>Ort:</b> ${esc(f.hakPlace)}<br><b>Vorsicherung:</b> ${esc(f.hakFuse)}<br><b>Zuleitung:</b> ${esc(displayCable(f.hakCable,f.hakCableCustom))} ${f.hakCores?esc(f.hakCores)+'-adrig ':''}${f.hakCross?esc(f.hakCross)+' mm²':''}<br><b>kommt von:</b> ${esc(f.hakSource)}</div>
    </div>
    <h2>Besichtigen und Erproben</h2>
    <table><tr><th>Prüfpunkt</th><th>i.O.</th><th>n.i.O.</th></tr>${checksHtml}</table>
    <h2>Messwerte nach UV / Schutzart / Stromkreis</h2>
    <table>${rows || '<tr><td>Keine Messwerte eingetragen</td></tr>'}</table>
    <h2>Mängel / Hinweise</h2>
    <div class="box">${esc(f.maengel||'Keine Angaben').replace(/\n/g,'<br>')}</div>
    <h2>Ergebnis</h2>
    <div class="box"><b>Automatische Bewertung:</b> ${overall}<br><b>Ergebnis laut Prüfer:</b> ${esc(f.ergebnis)}<br><b>Nächste Prüfung empfohlen bis:</b> ${esc(f.next)}</div>
    ${photosHtml}
    <div class="signatures">
      <div><b>Unterschrift Prüfer</b><div class="sigImg">${prueferSig}</div><div class="smalltxt">Datum / Name / Unterschrift</div></div>
      <div><b>Kundenunterschrift</b><div class="sigBox"></div><div class="smalltxt">Datum / Name / Unterschrift Auftraggeber/Betreiber</div></div>
    </div>
    <p class="smalltxt">Hinweis: Automatische Bewertungen sind Hilfsfunktionen und ersetzen nicht die fachliche Beurteilung durch die Elektrofachkraft.</p><div class="footerSpace"></div>${footer}`;
}
function protectionLabel(c, hasUpstreamRcd, r){
  if(c.device==='fils'){
    return {kind:'FI/LS', fi:'FI/LS integriert', device:`FI/LS ${esc((c.char||'')+(c.a||'')+'A')} / Typ ${esc(c.rcdType||'A')} / IΔn ${esc(c.rcdIdn||'30')} mA`};
  }
  if(hasUpstreamRcd){
    return {kind:'LS mit FI davor', fi:`vorgeschalteter FI: ${esc((r&&r.name)||'-')}`, device:`LS ${esc((c.char||'')+(c.a||'')+'A')}`};
  }
  return {kind:'LS ohne FI davor', fi:'kein FI/RCD vorgeschaltet', device:`LS ${esc((c.char||'')+(c.a||'')+'A')}`};
}
function measHeader(){return `<tr><th>Nr.</th><th>UV</th><th>Stromkreis</th><th>Kabeltyp</th><th>Adern</th><th>Querschnitt</th><th>Schutzart</th><th>FI-Zuordnung</th><th>Schutzorgan</th><th>RPE Ω</th><th>RISO MΩ</th><th>Zi Ω</th><th>Zs Ω</th><th>IK A</th><th>RCD Zeit ms</th><th>RCD Strom mA</th><th>Bemerkung</th><th>Bewertung</th><th>Hinweis</th></tr>`}
function measRow(uv,fi,c,ce,n,hasUpstreamRcd=false,r=null){
  const qs=c.cross?esc(c.cross)+' mm²':'-';
  const p=protectionLabel(c,hasUpstreamRcd,r);
  return `<tr><td>${n}</td><td>${esc(uv||'-')}</td><td>${esc(c.name||'-')}</td><td>${esc(c.cable||'-')}</td><td>${esc(c.cores||'-')}</td><td>${qs}</td><td><b>${p.kind}</b></td><td>${p.fi}</td><td>${p.device}</td><td>${esc(c.rpe||'-')}</td><td>${esc(c.riso||'-')}</td><td>${esc(c.zi||'-')}</td><td>${esc(c.zs||'-')}</td><td>${esc(c.ik||'-')}</td><td>${esc(c.rcdms||'-')}</td><td>${esc(c.rcdma||'-')}</td><td>${esc(c.note||'')}</td><td class="${ce.state}">${ce.text}</td><td>${esc(ce.msg)}</td></tr>`
}
window.addEventListener('beforeprint',preparePrint);

function openDatabase(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains('sites'))db.createObjectStore('sites',{keyPath:'id'});
      if(!db.objectStoreNames.contains('protocols')){
        const store=db.createObjectStore('protocols',{keyPath:'id'});
        store.createIndex('siteId','siteId',{unique:false});
        store.createIndex('updatedAt','updatedAt',{unique:false});
      }
      if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings',{keyPath:'key'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('Lokale Datenbank konnte nicht geöffnet werden.'));
  });
}
function dbAction(storeName,mode,action){
  return new Promise((resolve,reject)=>{
    const tx=database.transaction(storeName,mode),store=tx.objectStore(storeName),request=action(store);
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
function dbGet(store,key){return dbAction(store,'readonly',s=>s.get(key))}
function dbAll(store){return dbAction(store,'readonly',s=>s.getAll())}
function dbPut(store,value){return dbAction(store,'readwrite',s=>s.put(value))}
function dbDelete(store,key){return dbAction(store,'readwrite',s=>s.delete(key))}
function makeId(prefix){return `${prefix}_${crypto.randomUUID?crypto.randomUUID():Date.now()+'_'+Math.random().toString(16).slice(2)}`}
function nowIso(){return new Date().toISOString()}
function captureInitialFieldValues(){
  fields.forEach(id=>{const e=document.getElementById(id);initialFieldValues[id]=(e.type==='checkbox'||e.type==='radio')?false:e.value});
}
function makeBlankData(extraFields={}){
  return {fields:{...initialFieldValues,...extraFields},checks:{},uvs:[],photos:[],sig:''};
}
function formatDate(value,withTime=false){
  if(!value)return '—';
  const d=new Date(value);if(Number.isNaN(d.getTime()))return value;
  return new Intl.DateTimeFormat('de-DE',withTime?{dateStyle:'medium',timeStyle:'short'}:{dateStyle:'medium'}).format(d);
}
function showToast(message,error=false){
  const toast=document.getElementById('toast');toast.textContent=message;toast.className='toast show'+(error?' error':'');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.className='toast',2600);
}
function setSaveState(kind,text){const e=document.getElementById('saveState');if(e){e.className=`saveState ${kind}`;e.textContent=text}}
function showStep(step,scroll=true){
  currentStep=Math.max(1,Math.min(5,Number(step)||1));
  document.querySelectorAll('.protocolStep').forEach(section=>section.classList.toggle('active',Number(section.dataset.step)===currentStep));
  document.querySelectorAll('[data-step-target]').forEach(button=>{const n=Number(button.dataset.stepTarget);button.classList.toggle('active',n===currentStep);button.classList.toggle('visited',n<currentStep)});
  const info=stepInfo[currentStep];document.getElementById('stepCounter').textContent=`Schritt ${currentStep} von 5`;document.getElementById('stepTitle').textContent=info.title;document.getElementById('stepDescription').textContent=info.description;
  document.getElementById('prevStep').disabled=currentStep===1;const next=document.getElementById('nextStep');next.classList.toggle('hidden',currentStep===5);next.textContent=currentStep===4?'Zum Abschluss →':'Weiter →';
  updateStepProgress();if(scroll)document.getElementById('stepIntro').scrollIntoView({behavior:'smooth',block:'start'});
}
function changeStep(direction){showStep(currentStep+Number(direction||0))}
function updateStepProgress(){
  const progress=document.getElementById('stepProgress');if(!progress)return;let completed=0,total=1,label='';
  if(currentStep===1){const selectors=['#kunde','#objekt','#adresse','#datum','#pruefer'];total=selectors.length+1;completed=selectors.filter(s=>document.querySelector(s)?.value.trim()).length+(document.querySelector('[name=pruefart]:checked')?1:0)}
  if(currentStep===2){total=checkItems.length;completed=checkItems.filter((_,i)=>document.querySelector(`[name=c${i}]:checked`)).length}
  if(currentStep===3){const selectors=['#hakName','#hakPlace','#hakFuse','#hakSource','#hakCable','#hakCores','#hakCross'];total=selectors.length;completed=selectors.filter(s=>document.querySelector(s)?.value.trim()).length}
  if(currentStep===4){const circuits=[...document.querySelectorAll('.circuit')];total=Math.max(1,circuits.length);completed=circuits.filter(c=>{const hasRcd=!!c.closest('.rcd')||val(c,'.ck-device')==='fils';return val(c,'.ck-name')&&val(c,'.ck-riso')&&(hasRcd?(val(c,'.ck-rcdms')&&val(c,'.ck-rcdma')):(val(c,'.ck-zs')||val(c,'.ck-ik')))}).length;label=circuits.length?`${completed} von ${circuits.length} Stromkreisen vollständig`:'Noch kein Stromkreis'}
  if(currentStep===5){total=3;completed=(document.getElementById('ergebnis').value?1:0)+(document.getElementById('next').value?1:0)+(document.getElementById('protocolStatus').value==='completed'?1:0)}
  const percent=Math.round(completed/Math.max(1,total)*100);progress.textContent=label||`${percent} % ausgefüllt`;progress.style.setProperty('--progress',`${percent}%`);
}
function showDialog(dialog){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','')}
function closeDialog(dialog){if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open')}

async function initApp(){
  initSettings();captureInitialFieldValues();
  try{
    database=await openDatabase();
    await migrateLegacyData();
    document.getElementById('siteSearch').addEventListener('input',renderSites);
    document.getElementById('backupImport').addEventListener('change',importBackupFile);
    document.getElementById('siteForm').addEventListener('submit',saveSiteForm);
    document.getElementById('protocolForm').addEventListener('submit',saveProtocolForm);
    document.getElementById('presetForm').addEventListener('submit',savePresetForm);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persistCurrentProtocol(false)});
    window.addEventListener('pagehide',()=>persistCurrentProtocol(false));
    await renderSites();updateStoragePill();
  }catch(error){
    console.error(error);showToast('Lokale Speicherung konnte nicht gestartet werden.',true);
    document.getElementById('siteGrid').innerHTML='<div class="emptyState"><div class="emptyIcon">⚠</div><h3>Lokaler Speicher nicht verfügbar</h3><p>Bitte die App in einem aktuellen Browser oder als installierte PWA öffnen.</p></div>';
  }
}

async function migrateLegacyData(){
  if(await dbGet('settings','migration-v15'))return;
  const raw=localStorage.getItem(LEGACY_STORAGE);
  if(raw){
    try{
      const data=JSON.parse(raw),f=data.fields||{},time=nowIso();
      const site={id:makeId('site'),name:f.objekt||f.kunde||'Importierte Baustelle',customer:f.kunde||'',address:f.adresse||'',orderNo:'',note:'Aus der bisherigen V15 übernommen',createdAt:time,updatedAt:time};
      const protocol={id:makeId('protocol'),siteId:site.id,title:`${f.erst?'Erstprüfung':f.wieder?'Wiederholungsprüfung':f.aenderung?'Änderung / Erweiterung':'Prüfung'}${f.datum?' · '+f.datum:''}`,status:'draft',createdAt:time,updatedAt:time,data};
      await dbPut('sites',site);await dbPut('protocols',protocol);
    }catch(error){console.warn('V15-Daten konnten nicht übernommen werden.',error)}
  }
  await dbPut('settings',{key:'migration-v15',doneAt:nowIso()});
}

async function updateStoragePill(){
  if(!navigator.storage||!navigator.storage.estimate)return;
  try{
    const estimate=await navigator.storage.estimate(),used=estimate.usage||0;
    document.getElementById('storagePill').title=`Belegt: ${used<1048576?Math.round(used/1024)+' KB':(used/1048576).toFixed(1)+' MB'} · nur auf diesem Gerät`;
  }catch(_){/* Anzeige bleibt ohne Mengenangabe */}
}

async function renderSites(){
  const [sites,protocols]=await Promise.all([dbAll('sites'),dbAll('protocols')]);
  const query=(document.getElementById('siteSearch').value||'').trim().toLocaleLowerCase('de');
  const filtered=sites.filter(s=>[s.name,s.customer,s.address,s.orderNo].join(' ').toLocaleLowerCase('de').includes(query)).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
  const drafts=protocols.filter(p=>p.status!=='completed').length;
  document.getElementById('workspaceStats').innerHTML=`<b>${sites.length}</b> Baustellen · <b>${protocols.length}</b> Prüfungen · <b>${drafts}</b> offene Entwürfe`;
  const grid=document.getElementById('siteGrid');
  if(!filtered.length){
    grid.innerHTML=`<div class="emptyState"><div class="emptyIcon">▰</div><h3>${query?'Keine Baustelle gefunden':'Noch keine Baustelle angelegt'}</h3><p>${query?'Bitte einen anderen Suchbegriff verwenden.':'Lege den ersten Baustellenordner an. Darin kannst du beliebig viele Prüfungen speichern.'}</p>${query?'':'<button onclick="openSiteDialog()">+ Erste Baustelle anlegen</button>'}</div>`;return;
  }
  grid.innerHTML=filtered.map(site=>{
    const files=protocols.filter(p=>p.siteId===site.id),open=files.filter(p=>p.status!=='completed').length;
    return `<article class="siteCard"><button class="siteCardMain" onclick="openSite('${site.id}')"><div class="folderIcon">▰</div><h3>${esc(site.name)}</h3><p>${esc(site.customer||site.address||'Keine Zusatzangaben')}</p><div class="cardMeta"><span>${files.length} Prüfung${files.length===1?'':'en'}${open?` · ${open} offen`:''}</span><span>${formatDate(site.updatedAt)}</span></div></button><div class="protocolActions"><button class="secondary" onclick="editSite('${site.id}')">Bearbeiten</button><button class="secondary" onclick="deleteSite('${site.id}')">Löschen</button></div></article>`;
  }).join('');
}

function showSiteOverview(){
  currentSiteId='';document.getElementById('siteDetail').classList.add('hidden');document.getElementById('siteOverview').classList.remove('hidden');renderSites();window.scrollTo({top:0,behavior:'smooth'});
}
async function openSite(siteId){
  const site=await dbGet('sites',siteId);if(!site){showToast('Baustelle nicht gefunden.',true);return}
  currentSiteId=siteId;
  document.getElementById('libraryMain').classList.remove('hidden');document.getElementById('appMain').classList.add('hidden');
  document.getElementById('siteOverview').classList.add('hidden');document.getElementById('siteDetail').classList.remove('hidden');
  document.getElementById('siteDetailName').textContent=site.name;
  document.getElementById('siteDetailMeta').textContent=[site.orderNo&&`Auftrag ${site.orderNo}`,site.customer,site.address].filter(Boolean).join(' · ')||'Keine Zusatzangaben';
  await renderProtocols(siteId);window.scrollTo({top:0,behavior:'smooth'});
}
async function renderProtocols(siteId){
  const protocols=(await dbAll('protocols')).filter(p=>p.siteId===siteId).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
  const grid=document.getElementById('protocolGrid');
  if(!protocols.length){grid.innerHTML='<div class="emptyState"><div class="emptyIcon">▤</div><h3>Noch keine Prüfung</h3><p>Erstelle die erste Prüfung. Sie wird danach automatisch als Entwurf gespeichert.</p><button onclick="openProtocolDialog()">+ Erste Prüfung beginnen</button></div>';return}
  grid.innerHTML=protocols.map(p=>{const f=p.data&&p.data.fields||{};return `<article class="protocolCard"><button class="protocolCardMain" onclick="openProtocol('${p.id}')"><div class="protocolTop"><div class="documentIcon">▤</div><span class="statusBadge ${p.status==='completed'?'completed':'draft'}">${p.status==='completed'?'Abgeschlossen':'Entwurf'}</span></div><h3>${esc(p.title||'Unbenannte Prüfung')}</h3><p>${esc([f.datum&&formatDate(f.datum),f.pruefer].filter(Boolean).join(' · ')||'Noch keine Prüfungsangaben')}</p><div class="cardMeta"><span>${(p.data&&p.data.uvs||[]).length} UV</span><span>Geändert ${formatDate(p.updatedAt,true)}</span></div></button><div class="protocolActions"><button onclick="openProtocol('${p.id}')">Fortsetzen</button><button class="secondary" onclick="duplicateProtocol('${p.id}')">Duplizieren</button><button class="secondary" onclick="deleteProtocol('${p.id}')">Löschen</button></div></article>`}).join('');
}

function openSiteDialog(){
  document.getElementById('siteDialogTitle').textContent='Baustelle anlegen';document.getElementById('siteForm').reset();document.getElementById('siteEditId').value='';showDialog(document.getElementById('siteDialog'));setTimeout(()=>document.getElementById('siteName').focus(),50);
}
async function editSite(siteId){
  const site=await dbGet('sites',siteId);if(!site)return;
  document.getElementById('siteDialogTitle').textContent='Baustelle bearbeiten';document.getElementById('siteEditId').value=site.id;document.getElementById('siteName').value=site.name||'';document.getElementById('siteOrder').value=site.orderNo||'';document.getElementById('siteCustomer').value=site.customer||'';document.getElementById('siteAddress').value=site.address||'';document.getElementById('siteNote').value=site.note||'';showDialog(document.getElementById('siteDialog'));
}
function editCurrentSite(){if(currentSiteId)editSite(currentSiteId)}
function closeSiteDialog(){closeDialog(document.getElementById('siteDialog'))}
async function saveSiteForm(event){
  event.preventDefault();const id=document.getElementById('siteEditId').value,existing=id?await dbGet('sites',id):null,time=nowIso();
  const site={id:id||makeId('site'),name:document.getElementById('siteName').value.trim(),orderNo:document.getElementById('siteOrder').value.trim(),customer:document.getElementById('siteCustomer').value.trim(),address:document.getElementById('siteAddress').value.trim(),note:document.getElementById('siteNote').value.trim(),createdAt:existing&&existing.createdAt||time,updatedAt:time};
  if(!site.name)return;
  await dbPut('sites',site);closeSiteDialog();showToast(existing?'Baustelle aktualisiert':'Baustelle angelegt');
  if(currentSiteId===site.id)await openSite(site.id);else await renderSites();
}
async function deleteSite(siteId){
  const site=await dbGet('sites',siteId);if(!site)return;const protocols=(await dbAll('protocols')).filter(p=>p.siteId===siteId);
  if(!confirm(`Baustelle „${site.name}“ und ${protocols.length} zugehörige Prüfung${protocols.length===1?'':'en'} dauerhaft löschen?`))return;
  for(const p of protocols)await dbDelete('protocols',p.id);await dbDelete('sites',siteId);showToast('Baustelle gelöscht');
  if(currentSiteId===siteId)showSiteOverview();else renderSites();
}

async function openProtocolDialog(){
  if(!currentSiteId)return;document.getElementById('protocolForm').reset();document.getElementById('newProtocolDate').value=new Date().toISOString().slice(0,10);
  const preset=await dbGet('settings','company'),d=preset&&preset.data||{},device=[d.gHersteller,d.gTyp,d.gSerie].filter(Boolean).join(' · '),hint=document.getElementById('protocolDeviceHint');
  hint.classList.toggle('warning',!device);hint.innerHTML=device?`<b>Prüfgerät:</b> ${esc(device)} wird automatisch übernommen.`:'<b>Noch kein Prüfgerät voreingestellt.</b> Bitte zuerst unter „Voreinstellungen“ eintragen.';
  showDialog(document.getElementById('protocolDialog'));setTimeout(()=>document.getElementById('newProtocolTitle').focus(),50);
}
function closeProtocolDialog(){closeDialog(document.getElementById('protocolDialog'))}
async function saveProtocolForm(event){
  event.preventDefault();const site=await dbGet('sites',currentSiteId);if(!site)return;
  const company=await dbGet('settings','company'),time=nowIso(),type=document.getElementById('newProtocolType').value;
  const data=makeBlankData({...(company&&company.data||{}),kunde:site.customer||'',objekt:site.name||'',adresse:site.address||'',datum:document.getElementById('newProtocolDate').value,erst:type==='erst',wieder:type==='wieder',aenderung:type==='aenderung'});
  const subject=document.getElementById('newProtocolTitle').value.trim(),typeLabel=type==='erst'?'Erstprüfung':type==='wieder'?'Wiederholungsprüfung':'Änderung / Erweiterung';
  const protocol={id:makeId('protocol'),siteId:site.id,title:`${typeLabel} · ${subject}`,status:'draft',createdAt:time,updatedAt:time,data};
  await dbPut('protocols',protocol);site.updatedAt=time;await dbPut('sites',site);closeProtocolDialog();await openProtocol(protocol.id);
}
async function openProtocol(protocolId){
  if(currentProtocolId&&currentProtocolId!==protocolId)await persistCurrentProtocol(false);
  const protocol=await dbGet('protocols',protocolId);if(!protocol){showToast('Prüfung nicht gefunden.',true);return}const site=await dbGet('sites',protocol.siteId);if(!site)return;
  currentSiteId=site.id;currentProtocolId=protocol.id;currentProtocolRecord=protocol;
  document.getElementById('libraryMain').classList.add('hidden');document.getElementById('appMain').classList.remove('hidden');
  document.getElementById('editorSiteName').textContent=site.name;document.getElementById('protocolTitle').value=protocol.title||'';document.getElementById('protocolStatus').value=protocol.status||'draft';
  const protocolData=protocol.data||makeBlankData(),preset=await dbGet('settings','company');protocolData.fields=protocolData.fields||{};deviceFields.forEach(id=>{if(!protocolData.fields[id]&&preset&&preset.data)protocolData.fields[id]=preset.data[id]||''});
  loadData(protocolData);setSaveState('saved','Gespeichert');window.scrollTo({top:0,behavior:'smooth'});
}
async function closeEditor(){
  const siteId=currentSiteId;await persistCurrentProtocol(false);currentProtocolId='';currentProtocolRecord=null;currentPhotos=[];document.getElementById('appMain').classList.add('hidden');document.getElementById('libraryMain').classList.remove('hidden');await openSite(siteId);
}
async function persistCurrentProtocol(manual=false){
  clearTimeout(saveTimer);if(suppressAutosave||!database||!currentProtocolId)return;
  try{
    setSaveState('saving','Speichert …');const existing=await dbGet('protocols',currentProtocolId);if(!existing)return;
    const title=document.getElementById('protocolTitle').value.trim()||'Unbenannte Prüfung',time=nowIso(),data=collect();
    const record={...existing,title,status:document.getElementById('protocolStatus').value||'draft',updatedAt:time,data};
    await dbPut('protocols',record);currentProtocolRecord=record;
    const site=await dbGet('sites',record.siteId);if(site){site.updatedAt=time;await dbPut('sites',site)}
    setSaveState('saved','Gespeichert');if(manual)showToast('Prüfung lokal gespeichert');updateStoragePill();
  }catch(error){console.error(error);setSaveState('error','Fehler');showToast('Speichern fehlgeschlagen.',true)}
}
async function duplicateProtocol(protocolId){
  const source=await dbGet('protocols',protocolId);if(!source)return;const time=nowIso(),copy=typeof structuredClone==='function'?structuredClone(source):JSON.parse(JSON.stringify(source));copy.id=makeId('protocol');copy.title=`${source.title||'Prüfung'} – Kopie`;copy.status='draft';copy.createdAt=time;copy.updatedAt=time;await dbPut('protocols',copy);showToast('Prüfung dupliziert');renderProtocols(source.siteId);
}
async function deleteProtocol(protocolId){
  const protocol=await dbGet('protocols',protocolId);if(!protocol||!confirm(`Prüfung „${protocol.title}“ dauerhaft löschen?`))return;await dbDelete('protocols',protocolId);showToast('Prüfung gelöscht');renderProtocols(protocol.siteId);
}

function readFileAsDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(file)})}
async function resizePhoto(file){
  const source=await readFileAsDataUrl(file),img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=source});
  const max=1600,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale)),photoCanvas=document.createElement('canvas');photoCanvas.width=w;photoCanvas.height=h;photoCanvas.getContext('2d').drawImage(img,0,0,w,h);
  return {id:makeId('photo'),name:file.name||'Foto',type:'image/jpeg',dataUrl:photoCanvas.toDataURL('image/jpeg',.82)};
}
async function handlePhotoFiles(files){
  if(!files.length)return;setSaveState('saving','Fotos …');
  try{for(const file of files){if(file.type.startsWith('image/'))currentPhotos.push(await resizePhoto(file))}renderPhotos();saveData(true);document.getElementById('fotos').value=''}catch(error){console.error(error);showToast('Ein Foto konnte nicht gespeichert werden.',true)}
}
function renderPhotos(){
  const preview=document.getElementById('preview');preview.innerHTML='';
  currentPhotos.forEach((photo,index)=>{const item=document.createElement('div');item.className='photoItem';const img=document.createElement('img');img.src=photo.dataUrl;img.alt=photo.name||`Foto ${index+1}`;const button=document.createElement('button');button.type='button';button.textContent='×';button.title='Foto entfernen';button.addEventListener('click',()=>removePhoto(index));item.append(img,button);preview.appendChild(item)});
}
function removePhoto(index){currentPhotos.splice(index,1);renderPhotos();saveData()}

async function exportBackup(){
  const [sites,protocols,settings]=await Promise.all([dbAll('sites'),dbAll('protocols'),dbAll('settings')]);
  const backup={format:'schaefchen-vde-backup',version:APP_VERSION,exportedAt:nowIso(),sites,protocols,settings};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`schaefchen-sicherung-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('Sicherungsdatei heruntergeladen');
}
async function importBackupFile(event){
  const file=event.target.files&&event.target.files[0];event.target.value='';if(!file)return;
  try{
    const backup=JSON.parse(await file.text());if(backup.format!=='schaefchen-vde-backup'||!Array.isArray(backup.sites)||!Array.isArray(backup.protocols))throw new Error('Ungültiges Sicherungsformat');
    if(!confirm(`${backup.sites.length} Baustellen und ${backup.protocols.length} Prüfungen aus dieser Sicherung zusätzlich importieren?`))return;
    const siteMap=new Map(),time=nowIso();
    for(const source of backup.sites){const copy={...source,id:makeId('site'),name:`${source.name||'Importierte Baustelle'} (Import)`,createdAt:source.createdAt||time,updatedAt:time};siteMap.set(source.id,copy.id);await dbPut('sites',copy)}
    for(const source of backup.protocols){const mapped=siteMap.get(source.siteId);if(!mapped)continue;const copy=typeof structuredClone==='function'?structuredClone(source):JSON.parse(JSON.stringify(source));copy.id=makeId('protocol');copy.siteId=mapped;copy.updatedAt=time;await dbPut('protocols',copy)}
    const company=await dbGet('settings','company'),backupCompany=(backup.settings||[]).find(s=>s.key==='company');if(!company&&backupCompany)await dbPut('settings',backupCompany);
    await renderSites();showToast('Sicherung importiert');updateStoragePill();
  }catch(error){console.error(error);showToast('Diese Datei ist keine gültige Schäfchen-Sicherung.',true)}
}

initApp();
