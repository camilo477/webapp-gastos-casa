// A single portable candidate, shared by browser and trusted executor. No SDK, IO or production approval.
export const CONTRACT = 'inventory-candidate-v1' as const;
export const SCHEMA_VERSION = 2 as const;
export const MAX_QUANTITY = 1_000_000_000;
export const CATEGORIES = Object.freeze({ food:'Alimentos', 'household-care':'Aseo del hogar', 'personal-hygiene':'Higiene personal', pharmacy:'Farmacia', pets:'Mascotas', other:'Otros', unclassified:'Sin clasificar' });
export type CategoryId = keyof typeof CATEGORIES;
export type BaseUnit = 'unidad' | 'kg' | 'L';
export type Unit = BaseUnit | 'g' | 'ml';
export type Status = 'available' | 'low' | 'empty';
export type Definition = { name:string; presentation:string|null; categoryId:CategoryId; control:'exact'|'simple'; baseUnit:BaseUnit };
export type Product<TTime = number> = Definition & { schemaVersion:2; id:string; version:number; updatedAt:TTime } & (
  { control:'exact'; stock:{quantityMilli:number} } | { control:'simple'; stock:{status:Status} }
);
export type Quantity = { unit:Unit; amountMilli:number } | { unit:'package'; count:number; content:{unit:Exclude<Unit,'unidad'>;amountMilli:number} };
export type StockInput = {quantity:Quantity} | {status:Status};
type Common = {schemaVersion:2;operationId:string;productId:string};
export type Command = Common & (
  {kind:'create';definition:Definition;opening:StockInput;duplicateDecision:'reviewed-new'} |
  {kind:'edit';expectedVersion:number;name:string;presentation:string|null;categoryId:CategoryId} |
  {kind:'adjust';expectedVersion:number;action:'set'|'add'|'consume';change:StockInput}
);
export class ContractError extends Error { constructor(readonly code:string) { super(code); } }
function check(condition:unknown, code='INVALID_CONTRACT'):asserts condition { if(!condition)throw new ContractError(code); }
function object(input:unknown):asserts input is Record<string,unknown> {
  check(input!==null&&typeof input==='object'&&!Array.isArray(input));
  check(Object.getPrototypeOf(input)===Object.prototype||Object.getPrototypeOf(input)===null);
}
function keys(input:unknown, fields:readonly string[]):asserts input is Record<string,unknown> {
  object(input);check(Object.keys(input).length===fields.length&&fields.every(k=>Object.hasOwn(input,k)));
}
function integer(value:unknown,min=0,max=MAX_QUANTITY):asserts value is number { check(typeof value==='number'&&Number.isSafeInteger(value)&&value>=min&&value<=max,'INVALID_QUANTITY'); }
function oneOf(value:unknown,allowed:readonly string[]):void { check(typeof value==='string'&&allowed.includes(value)); }
function id(value:unknown):asserts value is string { check(typeof value==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(value),'INVALID_ID'); }
function name(value:unknown):asserts value is string { check(typeof value==='string'&&value.trim().length>0&&value.length<=160,'INVALID_NAME'); }
function presentation(value:unknown):void { check(value===null||(typeof value==='string'&&value.trim().length>0&&value.length<=240),'INVALID_PRESENTATION'); }
function category(value:unknown):void { check(typeof value==='string'&&Object.hasOwn(CATEGORIES,value),'INVALID_CATEGORY'); }
function time(value:unknown):asserts value is number { integer(value,0,8_640_000_000_000_000); }
function definition(value:unknown):asserts value is Definition {
  keys(value,['name','presentation','categoryId','control','baseUnit']);name(value.name);presentation(value.presentation);category(value.categoryId);
  oneOf(value.control,['exact','simple']);oneOf(value.baseUnit,['unidad','kg','L']);
}
function quantity(value:unknown):asserts value is Quantity {
  object(value);
  if(value.unit==='package'){
    keys(value,['unit','count','content']);integer(value.count,0,1_000_000);
    keys(value.content,['unit','amountMilli']);oneOf(value.content.unit,['kg','g','L','ml']);integer(value.content.amountMilli,1);
  }else{keys(value,['unit','amountMilli']);oneOf(value.unit,['unidad','kg','g','L','ml']);integer(value.amountMilli);}
}
function stockInput(value:unknown):asserts value is StockInput {
  object(value);
  if(Object.hasOwn(value,'quantity')){keys(value,['quantity']);quantity(value.quantity);}
  else{keys(value,['status']);oneOf(value.status,['available','low','empty']);}
}
export function toBase(input:Quantity,base:BaseUnit):number {
  quantity(input);oneOf(base,['unidad','kg','L']);
  if(input.unit==='package'){
    check(base!=='unidad','INCOMPATIBLE_UNIT');
    const perPackage=toBase(input.content,base);
    const result=Number(BigInt(input.count)*BigInt(perPackage));integer(result);return result;
  }
  check(input.unit===base||(input.unit==='g'&&base==='kg')||(input.unit==='ml'&&base==='L'),'INCOMPATIBLE_UNIT');
  const result=input.unit==='g'||input.unit==='ml'?input.amountMilli/1000:input.amountMilli;
  integer(result);check(base!=='unidad'||result%1000===0,'FRACTIONAL_COUNT');return result;
}
export function validateProduct(input:unknown,documentId?:string):Product {
  keys(input,['schemaVersion','id','name','presentation','categoryId','control','baseUnit','stock','version','updatedAt']);
  check(input.schemaVersion===SCHEMA_VERSION,'INCOMPATIBLE_SCHEMA');id(input.id);check(documentId===undefined||documentId===input.id,'IDENTITY_MISMATCH');
  name(input.name);presentation(input.presentation);category(input.categoryId);oneOf(input.control,['exact','simple']);oneOf(input.baseUnit,['unidad','kg','L']);integer(input.version,1);time(input.updatedAt);
  if(input.control==='exact'){keys(input.stock,['quantityMilli']);integer(input.stock.quantityMilli);check(input.baseUnit!=='unidad'||input.stock.quantityMilli%1000===0,'FRACTIONAL_COUNT');}
  else{keys(input.stock,['status']);oneOf(input.stock.status,['available','low','empty']);}
  return input as unknown as Product;
}
export function fromDocument(documentId:string,raw:unknown,readTime:(time:unknown)=>number):Product {
  object(raw);check(raw.schemaVersion===SCHEMA_VERSION,'INCOMPATIBLE_SCHEMA');
  let updatedAt:number;
  try{updatedAt=readTime(raw.updatedAt);}catch{throw new ContractError('INVALID_TIMESTAMP');}
  return validateProduct({...raw,updatedAt},documentId);
}
export function toDocument<TTime>(product:Product,writeTime:(value:number)=>TTime):Product<TTime> {
  validateProduct(product);return {...product,updatedAt:writeTime(product.updatedAt)};
}
export function parseCommand(input:unknown):Command {
  object(input);const kind=input.kind;oneOf(kind,['create','edit','adjust']);
  keys(input,['schemaVersion','operationId','productId','kind',...(kind==='create'?['definition','opening','duplicateDecision']:kind==='edit'?['expectedVersion','name','presentation','categoryId']:['expectedVersion','action','change'])]);
  check(input.schemaVersion===SCHEMA_VERSION,'INCOMPATIBLE_SCHEMA');id(input.operationId);id(input.productId);
  if(kind==='create'){definition(input.definition);stockInput(input.opening);check(input.duplicateDecision==='reviewed-new');}
  else{integer(input.expectedVersion,1);if(kind==='edit'){name(input.name);presentation(input.presentation);category(input.categoryId);}else{oneOf(input.action,['set','add','consume']);stockInput(input.change);}}
  return input as unknown as Command;
}
function stock(def:Definition,input:StockInput):Product['stock'] {
  if(def.control==='exact'){check('quantity'in input,'INCOMPATIBLE_CONTROL');return{quantityMilli:toBase(input.quantity,def.baseUnit)};}
  check('status'in input,'INCOMPATIBLE_CONTROL');return{status:input.status};
}
export function applyCommand(command:Command,before:Product|null,now:number):Product {
  parseCommand(command);time(now);
  if(command.kind==='create'){
    check(before===null,'PRODUCT_EXISTS');
    const d=command.definition;
    return validateProduct({...d,name:d.name.trim(),presentation:d.presentation?.trim()??null,schemaVersion:2,id:command.productId,stock:stock(d,command.opening),version:1,updatedAt:now});
  }
  check(before!==null,'PRODUCT_NOT_FOUND');validateProduct(before,command.productId);check(before.version===command.expectedVersion,'VERSION_CONFLICT');
  let result:Product={...before,version:before.version+1,updatedAt:now};
  if(command.kind==='edit')result={...result,name:command.name.trim(),presentation:command.presentation?.trim()??null,categoryId:command.categoryId};
  else if(before.control==='simple'){check(command.action==='set','INCOMPATIBLE_CONTROL');result={...before,version:before.version+1,updatedAt:now,stock:stock(before,command.change)} as Product;}
  else{
    const change=stock(before,command.change);check('quantityMilli'in change,'INCOMPATIBLE_CONTROL');
    check(command.action==='set'||change.quantityMilli>0,'INVALID_QUANTITY');
    const after=command.action==='set'?change.quantityMilli:before.stock.quantityMilli+(command.action==='add'?change.quantityMilli:-change.quantityMilli);
    result={...before,version:before.version+1,updatedAt:now,stock:{quantityMilli:after}};
  }
  return validateProduct(result);
}
export function normalize(value:string):string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('es'); }
export function suggestions(target:Definition,products:readonly Product[],excludeId?:string):{product:Product;reason:'same'|'presentation'|'possible'|'incompatible'}[] {
  definition(target);const n=normalize(target.name);if(n.length<2)return[];
  return products.filter(p=>p.id!==excludeId).map(product=>{
    validateProduct(product);const sameName=normalize(product.name)===n;
    if(!sameName&&!normalize(product.name).includes(n)&&!n.includes(normalize(product.name)))return null;
    const compatible=product.control===target.control&&product.baseUnit===target.baseUnit;
    const reason=!compatible?'incompatible':sameName&&product.presentation!==null&&target.presentation!==null&&normalize(product.presentation)===normalize(target.presentation)?'same':sameName&&product.presentation===null&&target.presentation===null?'possible':sameName?'presentation':'possible';
    return{product,reason} as const;
  }).filter((v):v is NonNullable<typeof v>=>v!==null).sort((a,b)=>['same','presentation','possible','incompatible'].indexOf(a.reason)-['same','presentation','possible','incompatible'].indexOf(b.reason)||a.product.id.localeCompare(b.product.id));
}
// Read-only preview. Every product needs explicit review; no implicit category mapping or IO.
export function previewLegacyMigration(documentId:string,raw:unknown,review:{categoryId:CategoryId;presentation:string|null;confirmed:true},readTime:(value:unknown)=>number):{sourceVersion:number;candidate:Product} {
  keys(review,['categoryId','presentation','confirmed']);check(review.confirmed===true,'REVIEW_REQUIRED');category(review.categoryId);presentation(review.presentation);
  object(raw);const control=raw.control;
  keys(raw,['name','categoryId','control','unit','version','updatedAt',control==='exact'?'quantityMilli':'status']);
  oneOf(raw.categoryId,['food','cleaning','service']);oneOf(control,['exact','simple']);oneOf(raw.unit,['unidad','kg','L']);integer(raw.version);name(raw.name);check(raw.name.length<=100);
  const candidate=validateProduct({schemaVersion:2,id:documentId,name:raw.name,presentation:review.presentation,categoryId:review.categoryId,control,baseUnit:raw.unit,
    stock:control==='exact'?{quantityMilli:raw.quantityMilli}:{status:raw.status},version:raw.version+1,updatedAt:readTime(raw.updatedAt)});
  return{sourceVersion:raw.version,candidate};
}
export function stable(value:unknown):string {
  if(Array.isArray(value))return'['+value.map(stable).join(',')+']';
  if(value!==null&&typeof value==='object')return'{'+Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>JSON.stringify(k)+':'+stable(v)).join(',')+'}';
  const encoded=JSON.stringify(value);check(encoded!==undefined);return encoded;
}
