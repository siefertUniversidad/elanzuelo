<?php
require 'db.php';
header('Content-Type: application/json');
if($_SERVER['REQUEST_METHOD']!=='POST'){http_response_code(405);echo json_encode(['ok'=>false]);exit;}

$in=json_input(); $cli=$in['cliente']??[]; $det=$in['detalles']??[];
$cn->begin_transaction();
try{
  $rut=$cn->real_escape_string($cli['rut']??'');
  $nom=$cn->real_escape_string($cli['nombre']??'');
  $em =$cn->real_escape_string($cli['email']??'');
  $tel=$cn->real_escape_string($cli['telefono']??'');
  $dir=$cn->real_escape_string($cli['direccion']??'');
  $vend=$cn->real_escape_string($cli['vendedor_nombre']??'Vendedor');
  $cn->query("INSERT INTO cliente(rut,nombre,email,telefono,direccion) VALUES('$rut','$nom','$em','$tel','$dir')");
  $id_cli=$cn->insert_id;

  $total=0;
  foreach($det as $d){
    $idp=(int)$d['id_producto']; $c=(int)$d['cantidad'];
    $rs=$cn->query("SELECT precio,stock FROM producto WHERE id_producto=$idp FOR UPDATE");
    if(!$rs||!$rs->num_rows) throw new Exception('Producto inexistente');
    $p=$rs->fetch_assoc();
    if($c<1||$c>$p['stock']) throw new Exception('Stock insuficiente');
    $total += $c*(float)$p['precio'];
  }

  $cn->query("INSERT INTO venta(id_cliente,vendedor_nombre,total) VALUES($id_cli,'$vend',$total)");
  $id_venta=$cn->insert_id;

  foreach($det as $d){
    $idp=(int)$d['id_producto']; $c=(int)$d['cantidad'];
    $precio=(float)$cn->query("SELECT precio FROM producto WHERE id_producto=$idp")->fetch_assoc()['precio'];
    $cn->query("INSERT INTO venta_detalle(id_venta,id_producto,cantidad,precio_unit) VALUES($id_venta,$idp,$c,$precio)");
    $cn->query("UPDATE producto SET stock=stock-$c WHERE id_producto=$idp");
  }

  $cn->commit();
  $fecha=$cn->query("SELECT fecha FROM venta WHERE id_venta=$id_venta")->fetch_assoc()['fecha']??null;
  echo json_encode(['ok'=>true,'id_venta'=>$id_venta,'total'=>$total,'fecha'=>$fecha]);
}catch(Exception $e){
  $cn->rollback(); http_response_code(400); echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);
}
