// scripts/productos.js
const ruta = (php, qs = "") => `${php}${qs ? `?${qs}` : ""}`;
const $ = (s, sc = document) => sc.querySelector(s);
const $$ = (s, sc = document) => [...sc.querySelectorAll(s)];
const avisar = (m) => { const t = $('#aviso'); if (!t) return; t.textContent = m; t.classList.add('mostrar'); setTimeout(()=>t.classList.remove('mostrar'),1600); };
const plata = (n) => new Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP' }).format(+n || 0);

async function iniciar(){
  await cargarCategorias();
  await cargarTabla();

  $('#form-producto').addEventListener('submit', guardar);
  $('#btn-cancelar').addEventListener('click', () => $('#form-producto').reset());
  $('#buscar-lista').addEventListener('input', filtrar);

  // delegación robusta para editar/eliminar
  const tb = $('#tabla-productos');
  tb.addEventListener('click', async (e) => {
    const btnEditar = e.target.closest('button[data-editar]');
    const btnEliminar = e.target.closest('button[data-eliminar]');
    if (btnEditar) {
      const tr = btnEditar.closest('tr');
      editarFila(tr.dataset.id, tr);
    }
    if (btnEliminar) {
      const id = btnEliminar.closest('tr').dataset.id;
      if (confirm('¿Eliminar producto?')) {
        await fetch('producto.php', { method:'DELETE', body:new URLSearchParams({ id }) });
        avisar('Eliminado'); cargarTabla();
      }
    }
  });
}

async function cargarCategorias(){
  let cats = [];
  try { cats = await fetch('categoria.php').then(r=>r.json()); } catch(_){ cats = []; }
  const sel = $('#sel-categoria');
  sel.innerHTML = cats.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
}

async function cargarTabla(){
  const r = await fetch('producto.php').then(x=>x.json());
  const data = Array.isArray(r) ? r : (r.items || []);
  const tb = $('#tabla-productos');

  tb.innerHTML = `
    <thead class="sticky">
      <tr>
        <th>ID</th><th>Nombre</th><th>Categoría</th>
        <th>Precio</th><th>Stock</th><th>Estado</th><th></th>
      </tr>
    </thead>
    <tbody>
      ${data.map(p=>`
        <tr data-id="${p.id_producto}">
          <td>${p.id_producto}</td>
          <td>${p.nombre}</td>
          <td>${p.categoria || ''}</td>
          <td class="derecha">${plata(p.precio)}</td>
          <td class="derecha">${p.stock}</td>
          <td>${(+p.estado) ? 'Activo' : 'Inactivo'}</td>
          <td>
            <button data-editar>Editar</button>
            <button data-eliminar>Eliminar</button>
          </td>
        </tr>
      `).join('')}
    </tbody>`;
}

function editarFila(id, tr){
  const f = $('#form-producto');
  f.reset();
  f.elements['id_producto'].value = id;
  const t = tr.children;
  f.elements['nombre'].value = t[1].textContent.trim();
  // precio viene formateado, limpiar todo salvo dígitos y separador decimal
  const precio = t[3].textContent.replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.');
  f.elements['precio'].value = precio;
  f.elements['stock'].value = t[4].textContent.trim();
  f.elements['estado'].value = t[5].textContent.includes('Activo') ? '1' : '0';

  // setear categoría por texto
  const textoCat = t[2].textContent.trim();
  const opt = [...$('#sel-categoria').options].find(o => o.textContent.trim() === textoCat);
  if (opt) $('#sel-categoria').value = opt.value;
}

async function guardar(e){
  e.preventDefault();
  const fd = new FormData(e.target);

  // normaliza precio/stock
  const p = (fd.get('precio')||'').toString().replace(/[^\d.]/g,'');
  const s = (fd.get('stock')||'').toString().replace(/[^\d]/g,'');
  fd.set('precio', p === '' ? '0' : p);
  fd.set('stock',  s === '' ? '0' : s);

  const resp = await fetch('producto.php', { method:'POST', body: fd });
  if (resp.ok){
    avisar('Guardado');
    e.target.reset();
    cargarTabla();
  } else {
    alert('Error al guardar');
  }
}

function filtrar(){
  const q = ($('#buscar-lista').value || '').toLowerCase();
  $$('#tabla-productos tbody tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

iniciar();
