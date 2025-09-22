// scripts/validaciones.js
(function(){
  // Utilidades locales
  const $ = window.$ || ((s,sc=document)=>sc.querySelector(s));
  const avisar = window.avisar || ((m)=>alert(m));

  // ---- RUT chileno ----
  const limpiarRut = (r)=> String(r||'').replace(/[.\-]/g,'').toUpperCase();
  const dvRut = (num)=>{ let M=0,S=1; for(;num;num=Math.floor(num/10)) S=(S+num%10*(9-M++%6))%11; return S?S-1:'K'; };
  function rutValido(rut){
    rut = limpiarRut(rut);
    if(!/^[0-9]+[0-9K]$/.test(rut)) return false;
    const cuerpo = rut.slice(0,-1), dv = rut.slice(-1);
    return String(dvRut(+cuerpo)) === dv;
  }

  // ---- Teléfono móvil Chile ----
  // Acepta: 9XXXXXXXX, 09XXXXXXXX, +569XXXXXXXX, con o sin espacios/puntos/guiones.
  function telCLValido(v){
    const d = String(v||'').replace(/[^\d]/g,''); // sólo dígitos
    // quita prefijos 56 o 0
    let n = d;
    if(n.startsWith('56')) n = n.slice(2);
    if(n.startsWith('0'))  n = n.slice(1);
    // debe quedar 9 dígitos y partir con 9
    return n.length===9 && n.startsWith('9');
  }

  // ---- Reglas de validación de campos obligatorios ----
  const form = $('#form-checkout');
  if(!form) return;
  const inpRut   = $('#rut');
  const inpNom   = $('#nombre');
  const inpTel   = $('#telefono');
  const inpVend  = $('#vendedor_nombre');
  const btn      = $('#form-checkout .principal');

  // Marca requeridos por JS (sin tocar el HTML original)
  [inpRut, inpNom, inpTel, inpVend].forEach(i=>{ if(i){ i.required = true; } });
  if(inpTel) inpTel.inputMode = 'tel';

  function validarRutCampo(){
    if(!inpRut) return false;
    const v = inpRut.value.trim();
    if(!v){ inpRut.setCustomValidity('RUT obligatorio'); return false; }
    if(!rutValido(v)){ inpRut.setCustomValidity('rut invalido'); return false; }
    inpRut.setCustomValidity(''); return true;
  }
  function validarNombre(){
    if(!inpNom) return false;
    const ok = (inpNom.value.trim().length>=1);
    inpNom.setCustomValidity(ok?'':'Nombre obligatorio');
    return ok;
  }
  function validarTelefono(){
    if(!inpTel) return false;
    const v = inpTel.value.trim();
    if(!v){ inpTel.setCustomValidity('Teléfono obligatorio'); return false; }
    const ok = telCLValido(v);
    inpTel.setCustomValidity(ok?'':'Teléfono chileno inválido');
    return ok;
  }
  function validarVendedor(){
    if(!inpVend) return false;
    const ok = (inpVend.value.trim().length>=1);
    inpVend.setCustomValidity(ok?'':'Vendedor obligatorio');
    return ok;
  }

  function todoOK(){
    const r = validarRutCampo();
    const n = validarNombre();
    const t = validarTelefono();
    const v = validarVendedor();
    return r && n && t && v;
  }

  function actualizarSubmit(){
    if(!btn) return;
    // Solo habilita si todos los campos obligatorios son válidos
    btn.disabled = !todoOK();
  }

  // Eventos en vivo
  ['input','blur'].forEach(ev=>{
    inpRut?.addEventListener(ev, ()=>{ validarRutCampo(); actualizarSubmit(); });
    inpNom?.addEventListener(ev, ()=>{ validarNombre();   actualizarSubmit(); });
    inpTel?.addEventListener(ev, ()=>{ validarTelefono(); actualizarSubmit(); });
    inpVend?.addEventListener(ev,()=>{ validarVendedor(); actualizarSubmit(); });
  });

  // Intercepta el submit antes que otros handlers (fase de captura)
  form.addEventListener('submit', (e)=>{
    if(!todoOK()){
      e.preventDefault();
      form.reportValidity();
      avisar('Corrige los campos obligatorios');
    }
  }, true);

  // Estado inicial
  actualizarSubmit();
})();
