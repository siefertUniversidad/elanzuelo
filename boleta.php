<?php
require 'db.php';
header('Content-Type: application/json');

if(isset($_GET['id'])){
  $id=(int)$_GET['id'];
  $h=$cn->query("SELECT v.id_venta,v.fecha,c.nombre cliente,c.rut,v.vendedor_nombre,v.total
                 FROM venta v JOIN cliente c ON c.id_cliente=v.id_cliente
                 WHERE v.id_venta=$id")->fetch_assoc();
  if(!$h){http_response_code(404);echo json_encode(['ok'=>false]);exit;}
  $it=[]; $rs=$cn->query("SELECT d.cantidad,d.precio_unit,p.nombre
                          FROM venta_detalle d JOIN producto p ON p.id_producto=d.id_producto
                          WHERE d.id_venta=$id");
  while($f=$rs->fetch_assoc()) $it[]=$f;
  $h['items']=$it; echo json_encode($h); exit;
}

$page=max(1,(int)($_GET['page']??1)); $limit=10; $off=($page-1)*$limit;
$items=[]; $rs=$cn->query("SELECT v.id_venta,v.fecha,c.nombre cliente,c.rut,v.total,v.vendedor_nombre
                           FROM venta v JOIN cliente c ON c.id_cliente=v.id_cliente
                           ORDER BY v.id_venta DESC LIMIT $limit OFFSET $off");
while($f=$rs->fetch_assoc()) $items[]=$f;
echo json_encode(['items'=>$items,'page'=>$page,'pageSize'=>$limit]);
