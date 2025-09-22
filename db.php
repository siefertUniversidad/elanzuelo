<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');
header('Access-Control-Allow-Methods: GET,POST,DELETE,OPTIONS');
if ($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}

$cn = new mysqli('localhost','root','','elanzuelo'); // clave vacía por defecto
if ($cn->connect_errno){http_response_code(500);echo json_encode(['ok'=>false,'error'=>'DB']);exit;}
$cn->set_charset('utf8mb4');

function json_input(){ $raw=file_get_contents('php://input'); $j=json_decode($raw,true); return is_array($j)?$j:[]; }
