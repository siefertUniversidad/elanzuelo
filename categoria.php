<?php
require 'db.php';
header('Content-Type: application/json');
$rs = $cn->query("SELECT id,nombre FROM categoria ORDER BY nombre");
$out=[]; while($f=$rs->fetch_assoc()) $out[]=$f;
echo json_encode($out);
