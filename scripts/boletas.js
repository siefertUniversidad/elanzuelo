// scripts/boletas.js
const ruta = (php, qs = "") => `${php}${qs ? `?${qs}` : ""}`;
const $ = (s, sc = document) => sc.querySelector(s);
const avisar = (m) => { const t = $('#aviso'); t.textContent = m; t.classList.add('mostrar'); setTimeout(()=>t.classList.remove('mostrar'),1600); };
const plata = (n) => new Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP' }).format(+n || 0);

let pagina = 1;

async function iniciar(){
  await cargarLista();
  $('#anterior').onclick = () => { if (pagina > 1) { pagina--; cargarLista(); } };
  $('#siguiente').onclick = () => { pagina++; cargarLista(); };

  const url = new URL(location.href);
  const id = url.searchParams.get('id');
  if (id) cargarDetalle(id);
}

async function cargarLista(){
  const qs = new URLSearchParams({ page: pagina }).toString();
  const resp = await fetch(ruta('boleta.php', qs)).catch(()=>null);
  const data = resp ? await resp.json().catch(()=>null) : null;

  const items = (data && Array.isArray(data.items)) ? data.items : [];
  $('#pagina').textContent = `Página ${pagina}`;

  const tb = $('#tabla-boletas');
  tb.innerHTML =
    '<thead class="sticky"><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>RUT</th><th>Total</th><th>Vendedor</th><th></th></tr></thead>' +
    '<tbody>' + items.map(o => `
      <tr>
        <td>${o.id_venta}</td>
        <td>${o.fecha}</td>
        <td>${o.cliente}</td>
        <td>${o.rut || ''}</td>
        <td class="derecha">${plata(o.total)}</td>
        <td>${o.vendedor_nombre || ''}</td>
        <td><button data-id="${o.id_venta}">Ver</button></td>
      </tr>`).join('') + '</tbody>';

  tb.onclick = (e) => {
    const btn = e.target.closest('button[data-id]');
    if (btn) cargarDetalle(btn.dataset.id);
  };
}

async function cargarDetalle(id){
  const qs = new URLSearchParams({ id }).toString();
  const resp = await fetch(ruta('boleta.php', qs)).catch(()=>null);
  const d = resp ? await resp.json().catch(()=>null) : null;
  if (!d) { avisar('No se pudo cargar'); return; }

  const items = Array.isArray(d.items) ? d.items : [];

  $('#detalle').hidden = false;
  $('#tarjeta-detalle').innerHTML = `
    <p><strong>Boleta:</strong> ${d.id_venta}</p>
    <p><strong>Fecha:</strong> ${d.fecha}</p>
    <p><strong>Cliente:</strong> ${d.cliente} — ${d.rut || ''}</p>
    <p><strong>Vendedor:</strong> ${d.vendedor_nombre || ''}</p>
    <hr />
    ${items.map(i => `<p>${i.nombre} × ${i.cantidad} — ${plata(i.precio_unit)}</p>`).join('')}
    <hr />
    <p><strong>Total:</strong> ${plata(d.total)}</p>`;
}

iniciar();
