<?php
require 'db.php';
header('Content-Type: application/json');
$m = $_SERVER['REQUEST_METHOD'];

if ($m==='GET'){
  $q=$cn->real_escape_string($_GET['q']??'');
  $idc=(int)($_GET['id_categoria']??0);
  $w=[]; if($q!=='') $w[]="p.nombre LIKE '%$q%'"; if($idc>0) $w[]="p.id_categoria=$idc";
  $where=$w?('WHERE '.implode(' AND ',$w)):'';
  $sql="SELECT p.id_producto,p.nombre,p.id_categoria,c.nombre categoria,p.precio,p.stock,p.estado
        FROM producto p JOIN categoria c ON c.id=p.id_categoria $where ORDER BY p.id_producto DESC";
  $rs=$cn->query($sql); $out=[]; while($f=$rs->fetch_assoc()) $out[]=$f;
  echo json_encode(['items'=>$out]); exit;
}

if ($m==='POST'){
  $id=(int)($_POST['id_producto']??0);
  $nombre=$cn->real_escape_string($_POST['nombre']??'');
  $idc=(int)($_POST['id_categoria']??0);
  $precio=(float)($_POST['precio']??0);
  $stock=(int)($_POST['stock']??0);
  $estado=(int)($_POST['estado']??1);
  if($id>0){
    $cn->query("UPDATE producto SET nombre='$nombre',id_categoria=$idc,precio=$precio,stock=$stock,estado=$estado WHERE id_producto=$id");
  }else{
    $cn->query("INSERT INTO producto(nombre,id_categoria,precio,stock,estado) VALUES('$nombre',$idc,$precio,$stock,$estado)");
    $id=$cn->insert_id;
  }
  echo json_encode(['ok'=>true,'id_producto'=>$id]); exit;
}

if ($m==='DELETE'){
  parse_str(file_get_contents('php://input'),$d);
  $id=(int)($d['id']??0);
  if($id>0) $cn->query("DELETE FROM producto WHERE id_producto=$id");
  echo json_encode(['ok'=>true]); exit;
}

http_response_code(405); echo json_encode(['ok'=>false]);
