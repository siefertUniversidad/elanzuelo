// scripts/ventas.js
const ruta = (php, qs = "") => `${php}${qs ? `?${qs}` : ""}`;
const $ = (s, sc = document) => sc.querySelector(s);
const $$ = (s, sc = document) => [...sc.querySelectorAll(s)];
const avisar = (m) => { const t = $('#aviso'); if (!t) return; t.textContent = m; t.classList.add('mostrar'); setTimeout(()=>t.classList.remove('mostrar'),1600); };
const plata = (n) => new Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP' }).format(+n || 0);
const esperar = (fn, ms) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

let productos = [];
let categorias = [];
let lineas = {}; // id -> {id_producto,nombre,precio,stock,cant}

async function iniciar(){
  try{
    categorias = await fetch(ruta('categoria.php')).then(r=>r.json());
  }catch(_){
    categorias = [{id:1,nombre:'Cañas'},{id:2,nombre:'Reeles'},{id:3,nombre:'Señuelos'},{id:4,nombre:'Líneas'}];
  }
  const sel = $('#filtro-categoria');
  if (sel) sel.innerHTML = '<option value="">Todas</option>' + categorias.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');

  await cargarCatalogo();

  $('#buscar')?.addEventListener('input', esperar(cargarCatalogo, 300));
  $('#filtro-categoria')?.addEventListener('change', cargarCatalogo);
  $('#tabla-lineas tbody')?.addEventListener('input', alCambiarCantidad);
  $('#tabla-lineas tbody')?.addEventListener('click', alQuitarLinea);
  $('#form-checkout')?.addEventListener('submit', alConfirmar);
}

async function cargarCatalogo(){
  const q = ($('#buscar')?.value || '').trim();
  const idc = $('#filtro-categoria')?.value || '';
  const qs = new URLSearchParams({ q, id_categoria:idc }).toString();

  let r = [];
  try{
    const json = await fetch(ruta('producto.php', qs)).then(x=>x.json());
    r = json.items || json || [];
  }catch(_){ r = []; }

  // Normaliza tipos para evitar fallos con ===
  productos = (Array.isArray(r) ? r : []).map(p => ({
    ...p,
    id_producto: +p.id_producto,
    precio: +p.precio,
    stock: +p.stock
  }));

  const cont = $('#catalogo');
  if (!cont) return;

  cont.innerHTML = productos.map(p=>`
    <article class="card">
      <h3>${p.nombre}</h3>
      <div>${plata(p.precio)}</div>
      <small>Stock: ${p.stock}</small>
      <button ${p.stock<=0 ? 'disabled' : ''} data-id="${p.id_producto}">Agregar</button>
    </article>`).join('') || '<p>Sin resultados</p>';

  cont.onclick = (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const id = +btn.dataset.id;
    agregarLinea(id);
  };
}

function agregarLinea(id){
  const p = productos.find(x=>x.id_producto === id);
  if(!p) return;
  const curr = lineas[id] || { ...p, cant: 0 };
  if(curr.cant + 1 > p.stock){ avisar('Sin stock suficiente'); return; }
  curr.cant += 1;
  lineas[id] = curr;
  pintarLineas();
}

function pintarLineas(){
  const tb = $('#tabla-lineas tbody');
  if (!tb) return;
  let total = 0;

  tb.innerHTML = Object.values(lineas).map(l=>{
    const sub = l.cant * l.precio; total += sub;
    return `<tr>
      <td>${l.nombre}</td>
      <td class="derecha">${plata(l.precio)}</td>
      <td><input type="number" min="1" max="${l.stock}" value="${l.cant}" data-id="${l.id_producto}"></td>
      <td class="derecha">${plata(sub)}</td>
      <td><button data-quitar="${l.id_producto}">Quitar</button></td>
    </tr>`;
  }).join('');

  $('#total').textContent = plata(total);
}

function alCambiarCantidad(e){
  if(e.target.type === 'number'){
    const id = +e.target.dataset.id;
    const v  = parseInt(e.target.value, 10) || 1;
    const max = (lineas[id]?.stock) || 1;
    if(v < 1){ e.target.value = 1; }
    if(v > max){ e.target.value = max; avisar('Cantidad ajustada al stock'); }
    lineas[id].cant = +e.target.value;
    pintarLineas();
  }
}

function alQuitarLinea(e){
  const btn = e.target.closest('button[data-quitar]');
  if(!btn) return;
  const id = +btn.dataset.quitar;
  delete lineas[id];
  pintarLineas();
}

async function alConfirmar(ev){
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const cliente = Object.fromEntries(fd.entries());
  const detalles = Object.values(lineas).map(l=>({ id_producto:l.id_producto, cantidad:l.cant }));
  try{
    const resp = await fetch('venta.php', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ cliente, detalles })
    });
    const data = await resp.json();
    $('#boleta').hidden = false;
    $('#b-id').textContent = data.id_venta || '';
    $('#b-total').textContent = data.total ? plata(data.total) : '$0';
    $('#b-fecha').textContent = data.fecha || '';
    $('#b-ver').href = data.id_venta ? `boletas.html?id=${data.id_venta}` : '#';
    lineas = {}; pintarLineas();
    ev.target.reset();
    avisar('Venta enviada');
  }catch(_){
    alert('Error al registrar la venta');
  }
}

iniciar();
