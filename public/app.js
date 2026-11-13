import {fields,steps,defaults,active,isJsc,capital,money,validate,coverage,createDocument,asText} from './charter.js';
let data=defaults(), step=0, showErrors=false, timer;
const $=id=>document.getElementById(id);
const storageKey='company-charter-mn:v1';
function element(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function tell(text){$('message').textContent=text;clearTimeout(timer);timer=setTimeout(()=>$('message').textContent='',5000);}
function renderForm(){
 $('steps').replaceChildren(...steps.map((name,i)=>{const b=element('button');b.type='button';b.append(element('b',String(i+1)),document.createTextNode(name));if(step===i)b.setAttribute('aria-current','step');b.onclick=()=>{step=i;renderForm();};return b;}));
 const heading=element('div',undefined,'section-head');heading.append(element('h3',['Компанийн мэдээлэл','Хувьцаа ба хөрөнгө','Удирдлагын бүтэц','Сан ба бусад нөхцөл'][step]),element('p',['Компанийн нэр, хэлбэр, үйл ажиллагааг тодорхойлно.','Гаргасан хувьцаанаас хөрөнгийн хэмжээг тооцно.','Бүрэн эрх, хурал болон удирдлагын журмыг тогтооно.','Нэмэлт зохицуулалтыг нягтлаад төслөө татна.'][step]));
 const grid=element('div',undefined,'field-grid');
 fields.filter(f=>f.step===step&&active(f,data)).forEach(f=>{
  const box=element('div',undefined,`field${f.wide?' wide':''}`), label=element('label',f.label);label.htmlFor=f.id;if(!f.optional)label.append(element('span',' *','required'));if(f.ref)label.append(element('small',f.ref));
  const input=element(f.type==='textarea'?'textarea':f.type==='select'?'select':'input');input.id=f.id;input.name=f.id;
  if(f.type==='select')f.options.forEach(([value,text])=>{const option=element('option',text);option.value=value;input.append(option);});
  else if(f.type!=='textarea')input.type=f.type;
  if(f.type==='number'){input.min=f.min;input.max='1000000000000';input.step=f.stepValue||'1';}
  input.value=data[f.id];input.required=!f.optional;if(f.type==='text'||f.type==='textarea')input.maxLength=12000;
  if(f.placeholder)input.placeholder=f.placeholder;
  if(f.id==='board'&&isJsc(data))input.disabled=true;
  const update=()=>{data[f.id]=input.value;if(f.id==='type'&&isJsc(data)){data.board='yes';data.boardCount=String(Math.max(9,Number(data.boardCount)||9));data.independentCount=String(Math.max(Math.ceil(Number(data.boardCount)/3),Number(data.independentCount)||0));}if(['type','preferred','board'].includes(f.id))renderForm();else updatePreview();};
  input.addEventListener(f.type==='select'?'change':'input',update);box.append(label,input);
  if(f.help){const help=element('div',f.help,'help');help.id=`${f.id}-help`;input.setAttribute('aria-describedby',help.id);box.append(help);}grid.append(box);
 });
 $('fields').replaceChildren(heading,grid);
 if(step===1){const summary=element('div',undefined,'calculation');summary.append(element('span','Хувь нийлүүлсэн хөрөнгө'),element('strong','',undefined));summary.lastChild.id='capital';$('fields').append(summary);}
 $('back').disabled=step===0;$('next').textContent=step===3?'Мэдээлэл шалгах ✓':'Үргэлжлүүлэх →';$('step-count').textContent=`${step+1} / 4`;updatePreview();
}
function updatePreview(){
 const doc=createDocument(data), content=$('document');content.replaceChildren(element('div','БАРИМТ БИЧГИЙН ТӨСӨЛ','doc-tag'),element('p',doc.meta,'meta'),element('h2',doc.title));
 for(const [title,paras] of doc.sections){content.append(element('h3',title),...paras.map(p=>element('p',p)));}content.append(element('p',doc.note,'doc-note'));
 if($('capital'))$('capital').textContent=`${money(capital(data))} ₮`;
 const errors=validate(data);
 $('checklist').replaceChildren(...coverage.map(([ref,label,ids])=>{const ready=!errors.some(e=>ids.includes(e.id));const el=element('div',undefined,`check${ready?' done':''}`);el.append(element('span',ready?'✓':'○'),document.createTextNode(`${ref} · ${label}`));return el;}));
 for(const f of fields){const input=$(f.id);if(input)input.setAttribute('aria-invalid',String(showErrors&&errors.some(e=>e.id===f.id)));}
 $('errors').hidden=!showErrors||!errors.length;
 if(showErrors&&errors.length){const list=element('ul');for(const error of errors){const li=element('li'),b=element('button',error.message);b.type='button';b.onclick=()=>{step=fields.find(f=>f.id===error.id).step;renderForm();$(error.id)?.focus();};li.append(b);list.append(li);}$('errors').replaceChildren(element('strong',`${errors.length} мэдээллийг засах шаардлагатай`),list);}
}
function check(){showErrors=true;updatePreview();const errors=validate(data);if(errors.length){$('errors').scrollIntoView({behavior:'smooth',block:'center'});tell('Дутуу болон зөрүүтэй мэдээллийг засна уу.');return false;}return true;}
function download(){if(!check())return;const blob=new Blob(['\uFEFF'+asText(createDocument(data))],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob),a=element('a');a.href=url;a.download=`${data.name.replace(/[^\p{L}\p{N}_-]/gu,'_').slice(0,60)}-durem.txt`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);tell('Дүрмийн төсөл TXT файлаар татагдлаа.');}
 $('form').onsubmit=e=>e.preventDefault();
 $('back').onclick=()=>{if(step>0)step--;renderForm();};
 $('next').onclick=()=>{if(step<3){step++;renderForm();$('form').scrollIntoView({behavior:'smooth',block:'start'});}else if(check())tell('Мэдээллийн бүрдэл шалгагдлаа. Төслөө татах эсвэл хэвлэх боломжтой.');};
 $('download').onclick=download;$('print').onclick=()=>{if(check())window.print();};
 $('save').onclick=()=>{try{localStorage.setItem(storageKey,JSON.stringify({version:1,data}));tell('Энэ хөтөч дээр хадгаллаа.');}catch{tell('Хөтөч хадгалах эрхгүй эсвэл санах ой дүүрсэн байна.');}};
 $('restore').onclick=()=>{try{const raw=localStorage.getItem(storageKey);if(!raw){tell('Хадгалсан төсөл олдсонгүй.');return;}if(!confirm('Одоогийн мэдээллийг хадгалсан төслөөр солих уу?'))return;const saved=JSON.parse(raw);if(saved.version!==1||!saved.data||Array.isArray(saved.data))throw Error();const next=defaults();for(const f of fields){const value=saved.data[f.id];if(typeof value==='string'&&value.length<=12000)next[f.id]=value;}data=next;step=0;showErrors=false;renderForm();tell('Хадгалсан төслийг нээлээ.');}catch{tell('Хадгалсан мэдээллийг унших боломжгүй байна.');}};
 $('reset').onclick=()=>{if(!confirm('Маягт болон энэ хөтөч дээр хадгалсан төслийг цэвэрлэх үү?'))return;let removed=true;try{localStorage.removeItem(storageKey);}catch{removed=false;}data=defaults();step=0;showErrors=false;renderForm();tell(removed?'Маягт, хадгалсан төслийг цэвэрлэлээ.':'Маягтыг цэвэрлэлээ. Хөтчийн хадгалсан мэдээллийг устгаж чадсангүй.');};
 renderForm();
