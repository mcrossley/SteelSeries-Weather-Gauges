<?php
//----------------------------------------------------------------------
// Generate JSON data for the Weather SteelSeries Gauges
// Author: Mark Crossley
//
// Ver 0.1 - 03 Dec 2014 - Initial release, 0.X = a work in progress, breakages and changes on the fly likely!
//----------------------------------------------------------------------
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//----------------------------------------------------------------------

$timeout = 28;  // Seconds to wait for file update before giving up (PHP default runtime limit is 30 seconds)

$RealtimeFilename = $_SERVER['DOCUMENT_ROOT'].'/realtimegauges.txt';  // full path to your realtime gauges data file

// set up the response headers
header('Cache-Control: private');
header('Cache-Control: no-cache, must-revalidate');
header('Content-type: text/json');

$response = array(
	'timestamp' => 0,
	'status' => '',
	'data' => '{}');

$endTime = time() + $timeout;

if (file_exists($RealtimeFilename) && time() < $endTime) {
	$lastmodif = isset($_GET['timestamp']) ? $_GET['timestamp'] : 0 ;
	$currentmodif = filemtime($RealtimeFilename);
	while ($currentmodif <= $lastmodif) {
		usleep(1000000);
		clearstatcache();
		$currentmodif = filemtime($RealtimeFilename);
	}
	if (time() >= $endTime) {
		$response['timestamp'] = $lastmodif;
		$response['status'] = 'Timed Out!';
	} else {
		// wait 0.2 seconds for file to be closed, just in case we caught it during an update
		usleep(200000);
		$response['timestamp'] = $currentmodif;
		$response['status'] = 'OK';
		$response['data'] = json_decode(file_get_contents($RealtimeFilename), true);
	}
} else {
	$response['status'] = "Realtime file [$RealtimeFilename] not found";
}

// JSON encode the response
echo json_encode($response);
// all done!
?>