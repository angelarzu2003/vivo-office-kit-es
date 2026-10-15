// Reglas por contexto: reescriben expresiones completas cuyas piezas no se pueden traducir por separado.
// Los literales que caen dentro de una coincidencia no se traducen individualmente.
const WEEK = '["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]';
// Día de la semana en chino (carácter de nStr1) -> español
const CNDAY = '{"日":"domingo","一":"lunes","二":"martes","三":"miércoles","四":"jueves","五":"viernes","六":"sábado"}';
const WMAP_CODE = 'const __W={SU:"domingo",MO:"lunes",TU:"martes",WE:"miércoles",TH:"jueves",FR:"viernes",SA:"sábado"};';
const NUM_CODE = 'const __N={1:"1.er",2:"2.º",3:"3.er",4:"4.º",5:"5.º"};';

module.exports = [
  // Encabezados de días de la semana
  { re: /\["日","一","二","三","四","五","六"\]/g, to: WEEK },
  { re: /" 周"\+(\w)\.calendar\.nStr1\[(\w)\.day\(\)\]/g, to: (m, a, b) => `" "+${WEEK}[${b}.day()]` },
  { re: /"周"\+(\w)\.calendar\.nStr1\[(\w)\.day\(\)\]/g, to: (m, a, b) => `${WEEK}[${b}.day()]` },

  // Cumpleaños relativos: mañana/ayer, pasado mañana/anteayer, en N días/hace N días
  {
    re: /1===(\w)\?\("before"===(\w)\?"明":"昨"\)\+"天":2===\1\?\("before"===\2\?"后":"前"\)\+"天":\1>2&&\1<7\?`\$\{\1\}天\$\{"before"===\2\?"后":"前"\}`:7===\1\?"1周"\+\("before"===\2\?"后":"前"\):""/g,
    to: (m, e, t) =>
      `1===${e}?("before"===${t}?"Mañana":"Ayer"):2===${e}?("before"===${t}?"Pasado mañana":"Anteayer"):` +
      `${e}>2&&${e}<7?("before"===${t}?\`En \${${e}} días\`:\`Hace \${${e}} días\`):` +
      `7===${e}?("before"===${t}?"En 1 semana":"Hace 1 semana"):""`,
  },

  // Texto de la regla de repetición ("每2周(周一、周三)" -> "cada 2 semanas (lunes, miércoles)")
  {
    re: /t\.formatRepeatRule=e=>\{const a=e\.FREQ;[\s\S]*?return r\},t\.formatWeekly=e=>\{let t=\[\];[\s\S]*?return t\}/g,
    to: () =>
      't.formatRepeatRule=e=>{const a=e.FREQ;let i=e.INTERVAL,r="";' + WMAP_CODE + NUM_CODE +
      'const ev=(x,s,p)=>(!x||x<=1)?"cada "+s:`cada ${x} ${p}`;' +
      'switch(a){case"DAILY":r+=ev(i,"día","días");break;' +
      'case"WEEKLY":r+=ev(i,"semana","semanas"),r+=` (${t.formatWeekly(e.BYDAY).join(", ")})`;break;' +
      'case"MONTHLY":r+=ev(i,"mes","meses"),"BYMONTHDAY"===e.type?r+=` (día ${e.BYMONTHDAY.join(", ")})`:"BYDAY"===e.type&&(r+=" (",r+=-1===e.num?"último ":(__N[e.num]||e.num)+" ",r+=(__W[e.weekly]||"")+")");break;' +
      'default:r+=ev(i,"año","años")}return r},' +
      't.formatWeekly=e=>{' + WMAP_CODE + NUM_CODE + 'let t=[];for(let a=0;a<e.length;a++){let i=e[a],r="";' +
      '0===i.indexOf("-")?(r+="último ",i=i.substring(2)):i.length>2&&(r+=(__N[i.substring(0,1)]||"")+" ",i=i.substring(1)),' +
      'r+=__W[i]||i,t.push(r)}return t}',
  },
  { re: /`日程将\$\{(\w)\.formatRepeatRule\((\w)\)\}重复`/g, to: (m, a, b) => `\`Se repite \${${a}.formatRepeatRule(${b})}\`` },

  // Opciones rápidas de repetición en el editor de eventos (8.js)
  { re: /"每周"\+\(0==(\w)\?`\(周\$\{(\w)\}\)`:""\)/g, to: (m, o, a) => `"Cada semana"+(0==${o}?\` (\${${CNDAY}[${a}]})\`:"")` },
  { re: /"每月"\+\(0==(\w)\?`\(\$\{(\w)\.date\(\)\}日\)`:""\)/g, to: (m, o, e) => `"Cada mes"+(0==${o}?\` (día \${${e}.date()})\`:"")` },
  { re: /`每月\(第\$\{(\w)\.calendar\.nStr1\[(\w)\]\}个周\$\{(\w)\}\)`/g, to: (m, r, i, a) => `\`Cada mes (\${${i}}.º \${${CNDAY}[${a}]})\`` },
  { re: /"每年"\+\(0==(\w)\?`\(\$\{(\w)\.format\("MM月DD日"\)\}\)`:""\)/g, to: (m, o, e) => `"Cada año"+(0==${o}?\` (\${${e}.format("DD/MM")})\`:"")` },

  // Idioma del editor TinyMCE (notas y tareas pendientes)
  { re: /language:(\w)\.lang\|\|"zh_CN"/g, to: (m, e) => `language:${e}.lang||"es_US"` },
  { re: /\(\{language:"zh_CN",height:"100%"/g, to: '({language:"es_US",height:"100%"' },

  // Título de cumpleaños: "X的出生日" / "X的N岁生日"
  {
    re: /0===(\w)\?(\w)\+"的出生日":`\$\{\2\}的\$\{\1\}岁生日`/g,
    to: (m, r, o) => `0===${r}?${o}+": día de nacimiento":\`\${${o}}: \${${r}} años\``,
  },
];
