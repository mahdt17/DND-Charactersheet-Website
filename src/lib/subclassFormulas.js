// Source rules are arithmetic data, never JavaScript. Callers supply class-level
// and effective-modifier context; no names or properties are looked up globally.
const functions={min:Math.min,max:Math.max,floor:Math.floor,ceil:Math.ceil};
function calculate(source,context){
 const text=String(source).replace(/\s/g,'');
 if(!text||text.length>256)throw Error('Provide a short subclass formula.');
 const tokens=text.match(/\d+(?:\.\d+)?|[a-z_][a-z0-9_]*|[()+*/,-]/gi)||[];
 if(tokens.join('')!==text)throw Error('Unsupported subclass formula.');
 let position=0,depth=0;
 const take=value=>tokens[position]===value?(position++,true):false;
 const required=value=>{if(!take(value))throw Error('Incomplete subclass formula.');};
 function primary(){
  if(++depth>32)throw Error('Subclass formula is too deeply nested.');
  let result;
  if(take('+'))result=primary();
  else if(take('-'))result=-primary();
  else if(take('(')){result=sum();required(')');}
  else{
   const token=tokens[position++];
   if(token===undefined)throw Error('Incomplete subclass formula.');
   if(/^\d/.test(token))result=Number(token);
   else{
    const name=token.toLowerCase();
    if(take('(')){
     if(!Object.hasOwn(functions,name))throw Error(`Unsupported subclass function: ${name}`);
     const args=[];
     if(tokens[position]!==')'){args.push(sum());while(take(','))args.push(sum());}
     required(')');
     if(!args.length||(['floor','ceil'].includes(name)&&args.length!==1))throw Error('Invalid subclass function arguments.');
     result=functions[name](...args);
    }else{
     if(!Object.hasOwn(context,name)||!Number.isFinite(context[name]))throw Error(`Unknown subclass value: ${name}`);
     result=context[name];
    }
   }
  }
  if(!Number.isFinite(result))throw Error('Invalid subclass formula result.');
  depth--;return result;
 }
 function product(){let value=primary();while(['*','/'].includes(tokens[position])){const operation=tokens[position++],next=primary();value=operation==='*'?value*next:value/next;if(!Number.isFinite(value))throw Error('Invalid subclass formula result.');}return value;}
 function sum(){let value=product();while(['+','-'].includes(tokens[position])){const operation=tokens[position++],next=product();value=operation==='+'?value+next:value-next;}return value;}
 const result=sum();
 if(position!==tokens.length||!Number.isFinite(result))throw Error('Invalid subclass formula result.');
 return result;
}

export function subclassValue(value,context={}){
 if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Invalid subclass value.');return value;}
 if(value&&typeof value==='object'&&!Array.isArray(value)){
  const tiers=Object.entries(value).filter(([level])=>/^\d+$/.test(level));
  if(tiers.length!==Object.keys(value).length||!tiers.length)throw Error('Use numeric subclass-level tiers.');
  const selected=tiers.filter(([level])=>Number(level)<=Number(context.level||0)).sort((a,b)=>Number(b[0])-Number(a[0]))[0];
  return selected?subclassValue(selected[1],context):0;
 }
 if(typeof value!=='string')throw Error('Missing subclass value.');
 return calculate(value,context);
}

export function subclassRoll(template,context={}){
 const text=String(template).replace(/\{([^{}]+)\}/g,(_,expression)=>String(subclassValue(expression,context))).replace(/\s/g,'');
 const match=text.match(/^(.+?)d(\d+)(.*)$/i);
 if(!match)return String(subclassValue(text,context));
 const quantity=subclassValue(match[1],context),sides=Number(match[2]),bonus=match[3]?subclassValue(match[3],context):0;
 if(!Number.isInteger(quantity)||quantity<1||quantity>50||!Number.isInteger(sides)||sides<2||sides>100||!Number.isInteger(bonus))throw Error('Use 1–50 dice with 2–100 sides and a whole-number modifier.');
 return `${quantity}d${sides}${bonus?`${bonus>0?'+':''}${bonus}`:''}`;
}
