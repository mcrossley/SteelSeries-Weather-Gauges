<?php
//----------------------------------------------------------------------
// Generate JSON data for the Weather SteelSeries Gauges
// Author: Mark Crossley
//
// Ver 0.1 - 05/01/14 - Initial release, 0.X = a work in progress, breakages and changes on the fly likely!
// ver 0.2 - 26/09/14 - Added error handling for include "tag-file" getting file in use error
// ver 0.3 - 22/01/15 - Added timeout for no file update
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

// convert PHP errors to exceptions for include "..." failure handling
// ... the tag file could be inaccessible due to being updated
function exceptions_error_handler($severity, $message, $filename, $lineno) {
    throw new ErrorException($message, 0, $severity, $filename, $lineno);
}
set_error_handler('exceptions_error_handler');

$weatherSW = 0; // Weather software: 0-Cumulus
$timeout = 20;  // Seconds to wait for file update before giving up (PHP default runtime limit is 30 seconds)
$RealtimeFilename = $_SERVER['DOCUMENT_ROOT'].'/cumuluswebtagsRealtime.php';  // optional realtime PHP variable file
$CurrentFilename =  $_SERVER['DOCUMENT_ROOT'].'/cumuluswebtags.php';  // current PHP variable file

// set up the response headers
header('Cache-Control: private');
header('Cache-Control: no-cache, must-revalidate');
header('Content-type: text/json');

$response = ['timestamp' => 0, 'status' => '', 'data' => '{}'];

$endTime = time() + $timeout;

if (file_exists($RealtimeFilename)) {
	$lastmodif = isset($_GET['timestamp']) ? $_GET['timestamp'] : 0 ;
	$currentmodif = filemtime($RealtimeFilename);
	while ($currentmodif <= $lastmodif && time() < $endTime) {
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

		if ($weatherSW === 0) {
			$response['data'] = decodeCumulus($CurrentFilename, $RealtimeFilename);
		} else {
			//TODO: Add other software
		}
	}
} else {
	$response['status'] = 'Error: File "' . $RealtimeFilename . '" not found';
}


function decodeCumulus($currFile, $RealFile) {
	global $response, $sf;
	error_reporting(E_ALL);

	try {
		// incorporate all the Cumulus variables
		try {
			include_once $currFile;
			include_once $RealFile;
		} catch (Exception $e) {
			// wait a wee while - 0.2s
			usleep(200000);
			include_once $currFile;
			include_once $RealFile;
		}

		return [
			'date' => $timehhmmss,
			'timeUTC' => $timeUTC_ss,
			'temp' => $temp,
			'tempTL' => $tempTL,
			'tempTH' => $tempTH,
			'intemp' => $intemp,
			'dew' => $dew,
			'dewpointTL' => $dewpointTL,
			'dewpointTH' => $dewpointTH,
			'apptemp' => $apptemp,
			'apptempTL' => $apptempTL,
			'apptempTH' => $apptempTH,
			'wchill' => $wchill,
			'wchillTL' => $wchillTL,
			'heatindex' => $heatindex,
			'heatindexTH' => $heatindexTH,
			'humidex' => $humidex,
			'wlatest' => $wlatest,
			'wspeed' => $wspeed,
			'wgust' => $wgust,
			'wgustTM' => $wgustTM,
			'bearing' => $bearing,
			'avgbearing' => $avgbearing,
			'press' => $press,
			'pressTL' => $pressTL,
			'pressTH' => $pressTH,
			'pressL' => $pressL,
			'pressH' => $pressH,
			'rfall' => $rfall,
			'rrate' => $rrate,
			'rrateTM' => $rrateTM,
			'hum' => $hum,
			'humTL' => $humTL,
			'humTH' => $humTH,
			'inhum' => $inhum,
			'SensorContactLost' => $SensorContactLost,
// Example options for the status message
			'forecast' => $forecastenc,
//			'forecast' => (explode(' ',$LastDataReadT)[1])." on $day $shortmonthname $year ~ Sun today: $SunshineHours hrs ~ Min/Max today: $tempTL/$tempTH °$tempunitnodeg",
//			'forecast' => "$time ~ Sun today: $SunshineHours hrs ~ Min/Max today: $tempTL/$tempTH °$tempunitnodeg",
//			'forecast' => "$time ~ Sun today: $SunshineHours hrs ~ New record set today? ".($newrecord?'Yes':'No'),
//			'forecast' => "$hour:$minute $shortdayname $day $shortmonthname | Sun today: $SunshineHours hrs | New record set today? ".($newrecord?'Yes':'No'),
			'tempunit' => $tempunitnodeg,
			'windunit' => $windunit,
			'pressunit' => $pressunit,
			'rainunit' => $rainunit,
			'temptrend' => $temptrend,
			'TtempTL' => $TtempTL,
			'TtempTH' => $TtempTH,
			'TdewpointTL' => $TdewpointTL,
			'TdewpointTH' => $TdewpointTH,
			'TapptempTL' => $TapptempTL,
			'TapptempTH' => $TapptempTH,
			'TwchillTL' => $TwchillTL,
			'TheatindexTH' => $TheatindexTH,
			'TrrateTM' => $TrrateTM,
			'ThourlyrainTH' => $ThourlyrainTH,
			'LastRainTipISO' => $LastRainTipISO,
			'hourlyrainTH' => $hourlyrainTH,
			'ThumTL' => $ThumTL,
			'ThumTH' => $ThumTH,
			'TpressTL' => $TpressTL,
			'TpressTH' => $TpressTH,
			'presstrendval' => $presstrendval,
			'Tbeaufort' => $Tbeaufort,
			'TwgustTM' => $TwgustTM,
			'windTM' => $windTM,
			'bearingTM' => $bearingTM,
			'BearingRangeFrom10' => $BearingRangeFrom10,
			'BearingRangeTo10' => $BearingRangeTo10,
			'UV' => $UV,
			'UVTH' => $UVTH,
			'SolarRad' => $SolarRad,
			'SolarTM' => $solarTH,
			'CurrentSolarMax' => $CurrentSolarMax,
			'domwinddir' => $domwinddir,
			'WindRoseData' => array_map('intval', explode(',', $WindRoseData)),
			'windrun' => $windrun,
			'cloudbasevalue' => $cloudbasevalue,
			'cloudbaseunit' => $cloudbaseunit,
			'version' => $version,
			'build' => $build,
			'ver' => '12'
			];
	} catch (Exception $e) {
		$response['status'] = $e->getMessage() . ' line:' . $e->getLine();
		return null;
	}
}

// JSON encode the response
echo json_encode($response);
// all done!
?>