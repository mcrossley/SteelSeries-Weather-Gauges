<?php
//----------------------------------------------------------------------
// Generate JSON data for the Weather SteelSeries Gauges
// using Saratoga template variables
// Author: Mark Crossley
//
// Ver 0.1 - 03 Dec 2014 - Initial release, 0.X = a work in progress, breakages and changes on the fly likely!
// ver 0.2 - 22 Jan 2015 - Added timeout for no file update
//----------------------------------------------------------------------
// Released under GNU GENERAL PUBLIC LICENSE, Version 2, June 1991
// See the enclosed License file
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//----------------------------------------------------------------------

// Based on variable availability in CU-defs.php - V1.10 - 14-Jan-2013

$weatherSW = 'CU'; // Weather software: CU-Cumulus, WD-WD
$timeout = 20;  // Seconds to wait for file update before giving up (PHP default runtime limit is 30 seconds)

$RealtimeFilename['CU'] = '/CUtagsRealtime.php';  	// Cumulus realtime PHP variable file [proposed]
$RealtimeFilename['WD'] = '/????';					// WD realtime PHP variable file

//$ExtrasFilename['WD'] = 'WeatherLinktags.php';		// WD Additional Settings files

// ---------------------------------------------------

$error = false;

$response = ['timestamp' => 0, 'status' => 'OK', 'data' => '{}'];

$endTime = time() + $timeout;


if (file_exists($RealtimeFilename[$weatherSW])) {
    $lastmodif = isset($_GET['timestamp']) ? $_GET['timestamp'] : 0 ;
    $currentmodif = filemtime($RealtimeFilename[$weatherSW]);
    while ($currentmodif <= $lastmodif && time() < $endTime) {
        usleep(1000000);
        clearstatcache();
        $currentmodif = filemtime($RealtimeFilename[$weatherSW]);
    }
    if (time() >= $endTime) {
    	$response['timestamp'] = $lastmodif;
		$response['status'] = 'Timed Out!';
	} else {
	    // wait 0.5 seconds for file to be closed, just in case we caught it during an update
	    usleep(500000);
	    $response['timestamp'] = $currentmodif;

		// load the realtime variable file
		if (array_key_exists($weatherSW, $RealtimeFilename)) {
			if ((include $RealtimeFilename[$weatherSW]) !== 'OK') {
				$response['status'] = 'Error: File [' . $RealtimeFilename[$weatherSW] . '] not found';
				$error = true;
			}
		}

		if (file_exists('Settings.php')) {
			if ((include_once 'Settings.php') !== 'OK') {
				$response['status'] = 'Error: File [Settings.php] not found';
				$error = true;
			}
		}

		if (isset($SITE['WXtags']) and file_exists($SITE['WXtags'])) { // load tags/-defs files
	         global $WX;
	         if ((include_once $SITE['WXtags']) !== 'OK') {
				$response['status'] = 'Error: File [' . ($SITE['WXtags']) . '] not found';
				$error = true;
	         }
		}

		// load extras file required
		// if (array_key_exists($weatherSW, $ExtrasFilename)) {
		// 	if ((include $ExtrasFilename[$weatherSW]) !== 'OK') {
		// 		$response['status'] = "Error: File '$ExtrasFilename[$weatherSW]' not found";
		// 		$error = true;
		// 	}
		// }

		if (!$error) {
		    $response['status'] = 'OK';
		    $response['data'] = buildJson();
		}
	}

} else {
    $response['status'] = 'Error: File [' . $RealtimeFilename[$weatherSW] . '] not found';
}

// set up the response headers
header('Cache-Control: private');
header('Cache-Control: no-cache, must-revalidate');
header('Content-type: text/json');
// JSON encode the response
echo json_encode($response);
// all done!

// --- end of script ---

function buildJson() {
	return [
		date => $time,
		timeUTC => "$utcdate-year,$utcdate-month,$utcdate-day,$utctime-hour,$utctime-minute,$utctime-second",	// No translation in CU-defs.php

		tempunit => $uomtemp,			// No equiv of $tempunitnodeg,
		windunit => $uomwind,
		pressunit => $uombaro,
		rainunit => $uomrain,
		cloudbaseUnit => 'ft',  		// No translation in CU-defs.php

		temp => $temperature,
		tempTL => $mintemp,
		TtempTL => $mintempt,
		tempTH => $maxtemp,
		TtempTH => $maxtempt,
		temptrend => $tempchangehour,
		intemp => $indoortemp,   		// No translation in CU-defs.php

		dew => $dewpt,
		dewpointTL => $mindew, 		// No translation in CU-defs.php
		TdewpointTL => $mindewt,	// No translation in CU-defs.php
		dewpointTH => $maxdew,		// No translation in CU-defs.php
		TdewpointTH => $maxdewt,	// No translation in CU-defs.php

		apptemp => $apparenttemp,
		apptempTL => $loapparenttemp,		// No translation in CU-defs.php
		TapptempTL => $loapparenttemptime,	// No translation in CU-defs.php
		apptempTH => $hiapparenttemp,		// No translation in CU-defs.php
		TapptempTH => $hiapparenttemptime,

		wchill => $windch,
		wchillTL => $minwindch,
		TwchillTL => $minwindcht,

		heatindex => $heati,
		heatindexTH => $maxheat,
		TheatindexTH => $maxheatt,

		humidex => $humidex,

		wlatest => $gstspd,				// No translation in CU-defs.php
		wspeed => $avgspd,
		wgust => $gstspd,
		wgustTM => $maxgst,
		TwgustTM => $maxgstt,
		bearing => $dirdeg,				// No translation in CU-defs.php
		avgbearing => $avdir10minute,	// No translation in CU-defs.php
		windrun => $windruntoday,
		Tbeaufort => $bftmaxgustlast24hrnum,	// No translation in CU-defs.php
		windTM => $maxavgspd,					// No translation in CU-defs.php
		bearingTM => $bearingTM,
		BearingRangeFrom10 => $mindir10minute,	// No translation in CU-defs.php
		BearingRangeTo10 => $maxdir10minute,	// No translation in CU-defs.php
		domwinddir => $last24houravdirwordday,	// No translation in CU-defs.php
		WindRoseData => [$WindRoseData],	// No translation in CU-defs.php

		press => $baro,
		pressTL => $lowbaro,
		TpressTL => $lowbarot,
		pressTH => $highbaro,
		TpressTH => $highbarot,
		pressL => $recordlowbaro,				// No translation in CU-defs.php
		pressH => $recordhighbaro,				// No translation in CU-defs.php
		presstrendval => $trend,

		rfall => $dayrn,
		rrate => $rrate,
		rrateTM => $currentrainratehr,
		TrrateTM => $maxrainratetime,
		hourlyrainTH => $maxhourrn,				// No translation in CU-defs.php
		ThourlyrainTH => $maxhourrnt,			// No translation in CU-defs.php
		LastRainTipISO => $dateoflastrainalways,

		hum => $humidity,
		humTL => $lowhum,			// No translation in CU-defs.php
		ThumTL => $lowhumt,			// No translation in CU-defs.php
		humTH => $highhum,			// No translation in CU-defs.php
		ThumTH => $highhumt,		// No translation in CU-defs.php
		inhum => $indoorhum,		// No translation in CU-defs.php

		UV => $VPuv,
		UVTH => $highuv,
		SolarRad => $VPsolar,
		SolarTM => $highsolar,
		CurrentSolarMax => $maxsolarfortime,		// No translation in CU-defs.php

		cloudbasevalue => $cloudheightfeet,			// No translation in CU-defs.php
		SensorContactLost => "0",					// No translation in CU-defs.php
		forecast => $vpforecasttext, 				// No equiv of $forecastenc

		version => $wdversion,
		build => $wdbuild,
		ver => "12"
	];
}
?>