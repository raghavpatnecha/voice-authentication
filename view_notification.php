<?php

$conn = new mysqli("localhost","root","","autofetch");

if (isset($_POST['orderid'])) { // If the id post variable is set
    echo $_POST['orderid'];

	
	$tableData = stripcslashes($_POST['orderid']);
	// Decode the JSON array
$tableData = json_decode($tableData,TRUE);

// now $tableData can be accessed like a PHP array
//echo $tableData;
echo $tableData[0]['blob'];

$sql = "INSERT INTO voice (name, profileid,audi) VALUES('" . $tableData[0]['name'] . "','" . $tableData[0]['profileId'] . "', '" . $tableData[0]['blob'] . "')";
mysqli_query($conn, $sql);
	
	
if($sql)
{
echo "Success";

}
else
{
echo "Error";

}
}



            
?>