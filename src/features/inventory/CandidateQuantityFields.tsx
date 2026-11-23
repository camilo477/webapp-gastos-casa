import { useEffect, useRef, useState } from 'react';
import { toBase, type BaseUnit, type Quantity, type Unit } from '@mi-casa/inventory-contract';
import { SelectField, TextField } from '../../components/Fields';
import { DomainError, parseQuantity } from '../../domain/validation';
import { compatibleUnits } from '../../domain/policy';

const labels={unidad:'Unidades',kg:'Kilogramos',g:'Gramos',L:'Litros',ml:'Mililitros',package:'Envases con contenido conocido'};
export function useCandidateQuantity(base:BaseUnit,initial:string) {
  const [unit,setUnit]=useState<Unit|'package'>(base),[amount,setAmount]=useState(initial);
  const [count,setCount]=useState(''),[content,setContent]=useState(''),[contentUnit,setContentUnit]=useState<Unit>(base==='unidad'?'L':base);
  const previousBase=useRef(base);
  useEffect(()=>{if(previousBase.current!==base){previousBase.current=base;setUnit(base);setAmount('');setContent('');setContentUnit(base==='unidad'?'L':base);}},[base]);
  function read(allowZero:boolean):Quantity {
    if(unit==='package'&&!count.trim())throw new DomainError('Indica cuántos envases hay.');
    if(unit==='package'&&!content.trim())throw new DomainError('Escribe el contenido conocido de cada envase antes de convertirlo.');
    const quantity:Quantity=unit==='package'?{unit,count:parseQuantity(count,allowZero)/1000,content:{unit:contentUnit as Exclude<Unit,'unidad'>,amountMilli:parseQuantity(content)}}:{unit,amountMilli:parseQuantity(amount,allowZero)};
    try{toBase(quantity,base);}catch{throw new DomainError('Revisa la cantidad y la unidad. Usa unidades y gramos o mililitros enteros; el contenido de cada envase debe ser compatible.');}
    return quantity;
  }
  return{unit,amount,count,content,contentUnit,setAmount,setCount,setContent,
    reset:(value:string)=>{setUnit(base);setAmount(value);setCount('');setContent('');setContentUnit(base==='unidad'?'L':base);},
    selectUnit:(v:string)=>{setUnit(v as typeof unit);setAmount('');setContent('');},
    selectContentUnit:(v:string)=>{setContentUnit(v as Unit);setContent('');},read};
}
export function CandidateQuantityFields({quantity,base,label,error}:{quantity:ReturnType<typeof useCandidateQuantity>;base:BaseUnit;label:string;error?:string}){
  const units=compatibleUnits(base);
  return <>
    <SelectField label="Unidad de la cantidad" value={quantity.unit} options={[...units.map(value=>({value,label:labels[value]})),...(base==='unidad'?[]:[{value:'package',label:labels.package}])]} onChange={quantity.selectUnit}/>
    {quantity.unit==='package'?<>
      <TextField label="Cuántos envases hay" value={quantity.count} inputMode="numeric" onChange={e=>quantity.setCount(e.target.value)} error={error} help="Indica un número entero de envases."/>
      <TextField label="Contenido de cada envase" value={quantity.content} inputMode="decimal" onChange={e=>quantity.setContent(e.target.value)} help="Escribe el contenido conocido. No lo calculamos a partir del nombre."/>
      <SelectField label="Unidad del contenido" value={quantity.contentUnit} options={units.filter(v=>v!=='unidad').map(value=>({value,label:labels[value]}))} onChange={quantity.selectContentUnit}/>
    </>:<TextField label={label} value={quantity.amount} inputMode="decimal" onChange={e=>quantity.setAmount(e.target.value)} error={error} help="Hasta tres decimales en kilogramos o litros; unidades, gramos y mililitros enteros."/>}
  </>;
}
