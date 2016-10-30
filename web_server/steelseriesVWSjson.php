<?php
// steelseriesVWSjson.php script by Ken True - webmaster@saratoga-weather.org
// purpose:  read the WeatherFlash wflash.txt/wflash2.txt files and create
//    a JSON output for use with Mark Crossley's Steel Series Gauges
//
// Version 1.00 - 22-Jan-2013 - Initial release
// Version 1.01 - 22-Jan-2013 - fixed VWS time issue with wflash[1] leading '+' instead of '0'
// Version 1.02 - 23-Jan-2013 - fixed VWS date issue with international wflash2[275] d/m/y format
// Version 1.03 - 24-Jan-2013 - added windrun for V2.1 gauges support
// Version 1.04 - 04-Sep-2014 - added cloud base and indoor humidity lo/hi for v2.5 gauge support
// Version 1.05 - 08-Jul-2016 - (MC) code format tidying
//
$Version = 'steelseriesVWSjson.php Version 1.05 - 08-Jul-2016';
//
// error_reporting(E_ALL);  // uncomment to turn on full error reporting
//
// script available at http://saratoga-weather.org/scripts.php
//
// you may copy/modify/use this script as you see fit,
// no warranty is expressed or implied.
//
// This script loads and displays the contents of the VWS WeatherFlash
//   data files (wflash.txt, wflash2.txt) which are in F,mph,inHg,in units
//   and converts to the desired units specified below (or in Settings.php for template users)
//
// The output JSON file uses SteelSeries Weather-Display configuration
//   In the SteelSeries gauges.js file, set:
//
//      weatherProgram    : 1,                      //Set 0=Cumulus, 1=Weather Display
//      realTimeURL_WD    : './steeseriesVWSjson.php',
//        *** Change this to your script location if the file is not in the same folder as the gauges-ss.htm ***
//
//
// NOTE: the settings below are unnecessary if this script is run in the same directory as
//   the Saratoga template's Settings.php .. in that case, the settings below will be
//   acquired from the corresponding data in Settings.php and Settings-weather.php for VWS sites.
//
// settings ------------------------------
$wflashDir = './wflash/Data/';  // directory for the the wflash.txt and wflash2.txt files
//                              // relative to directory location of this script
//                              // do NOT use absolute address (/ start) or http://... addressing
$uomTemp = '&deg;F';   // ='&deg;C', ='&deg;F'
$uomBaro = ' inHg';    // =' hPa', =' mb', =' inHg'
$uomWind = ' mph';     // =' km/h', =' kts', =' m/s', =' mph'
$uomRain = ' in';      // =' mm', =' in'
$WDdateMDY = true;     // =true  dates are 'month/day/year'
//                     // =false dates are 'day/month/year'
$uomWindRun = (preg_match('|C|',$uomTemp)) ? 'km/h' : 'mph';
$uomCloudBase = (preg_match('|C|',$uomTemp)) ? 'm' : 'ft';
//
$ourTZ = 'America/Los_Angeles';  //NOTE: this *MUST* be set correctly to
// translate UTC times to your LOCAL time for the displays.
$timeOnlyFormat = 'g:i a';          // USA format h:mm[am|pm\
//$timeOnlyFormat = 'H:i';          // Euro format hh:mm  (hh=00..23);

// ---------------------------------------
// end of settings -- no further changes to the source are needed below


// -------------------begin code ------------------------------------------
if (isset($_REQUEST['sce']) and strtolower($_REQUEST['sce']) == 'view' ) {
    //--self downloader --
    $filenameReal = __FILE__;
    $download_size = filesize($filenameReal);
    header('Pragma: public');
    header('Cache-Control: private');
    header('Cache-Control: no-cache, must-revalidate');
    header('Content-type: text/plain');
    header('Accept-Ranges: bytes');
    header("Content-Length: $download_size");
    header('Connection: close');

    readfile($filenameReal);
    exit;
}
$doDebug = isset($_REQUEST['debug']);

if (file_exists('Settings.php')) {
    include_once 'Settings.php';
    $Status .= "// Settings.php overrides applied \n";
}
// overrides from Settings.php if available
global $SITE;
if (isset($SITE['uomTemp'])) 	    {$uomTemp = $SITE['uomTemp'];}
if (isset($SITE['uomBaro'])) 	    {$uomBaro = $SITE['uomBaro'];}
if (isset($SITE['uomWind'])) 	    {$uomWind = $SITE['uomWind'];}
if (isset($SITE['uomRain'])) 	    {$uomRain = $SITE['uomRain'];}
if (isset($SITE['timeOnlyFormat'])) {$timeOnlyFormat = $SITE['timeOnlyFormat'];}
if (isset($SITE['WDdateMDY']))      {$WDdateMDY = $SITE['WDdateMDY'];}
if (isset($SITE['tz'])) 		    {$ourTZ = $SITE['tz'];}
if (isset($SITE['wflashdir']))      {$wflashDir = $SITE['wflashdir'];}
// end of overrides from Settings.php



$Status = "// $Version \n";
/* needed output (with Cumulus tags cited below) is:

{"date":"<#date format=hh:nn>",
"temp":"<#temp>",
"tempTL":"<#tempTL>",
"tempTH":"<#tempTH>",
"intemp":"<#intemp>",
"dew":"<#dew>",
"dewpointTL":"<#dewpointTL>",
"dewpointTH":"<#dewpointTH>",
"apptemp":"<#apptemp>",
"apptempTL":"<#apptempTL>",
"apptempTH":"<#apptempTH>",
"wchill":"<#wchill>",
"wchillTL":"<#wchillTL>",
"heatindex":"<#heatindex>",
"heatindexTH":"<#heatindexTH>",
"humidex":"<#humidex>",
"wlatest":"<#wlatest>",
"wspeed":"<#wspeed>",
"wgust":"<#wgust>",
"wgustTM":"<#wgustTM>",
"bearing":"<#bearing>",
"avgbearing":"<#avgbearing>",
"press":"<#press>",
"pressTL":"<#pressTL>",
"pressTH":"<#pressTH>",
"pressL":"<#pressL>",
"pressH":"<#pressH>",
"rfall":"<#rfall>",
"rrate":"<#rrate>",
"rrateTM":"<#rrateTM>",
"hum":"<#hum>",
"humTL":"<#humTL>",
"humTH":"<#humTH>",
"inhum":"<#inhum>",
"inhumTL":"",
"inhumTH":"",
"SensorContactLost":"<#SensorContactLost>",
"forecast":"<#forecastenc>",
"tempunit":"<#tempunitnodeg>",
"windunit":"<#windunit>",
"pressunit":"<#pressunit>",
"rainunit":"<#rainunit>",
"temptrend":"<#temptrend>",
"TtempTL":"<#TtempTL>",
"TtempTH":"<#TtempTH>",
"TdewpointTL":"<#TdewpointTL>",
"TdewpointTH":"<#TdewpointTH>",
"TapptempTL":"<#TapptempTL>",
"TapptempTH":"<#TapptempTH>",
"TwchillTL":"<#TwchillTL>",
"TheatindexTH":"<#TheatindexTH>",
"TrrateTM":"<#TrrateTM>",
"ThourlyrainTH":"<#ThourlyrainTH>",
"LastRainTipISO":"<#LastRainTipISO>",
"hourlyrainTH":"<#hourlyrainTH>",
"ThumTL":"<#ThumTL>",
"ThumTH":"<#ThumTH>",
"TpressTL":"<#TpressTL>",
"TpressTH":"<#TpressTH>",
"presstrendval":"<#presstrendval>",
"Tbeaufort":"<#Tbeaufort>",
"TwgustTM":"<#TwgustTM>",
"windTM":"<#windTM>",
"bearingTM":"<#bearingTM>",
"timeUTC":"<#timeUTC format=yyyy,m,d,h,m,s>",
"BearingRangeFrom10":"<#BearingRangeFrom10>",
"BearingRangeTo10":"<#BearingRangeTo10>",
"UV":"<#UV>",
"UVTH":"<#UVTH>",
"SolarRad":"<#SolarRad>",
"SolarTM":"<#solarTH>",
"CurrentSolarMax":"<#CurrentSolarMax>",
"domwinddir":"<#domwinddir>",
"WindRoseData":[<#WindRoseData>],
"windrun":"<#windrun>",
"cloudbase":"<#cloudbasevalue>",
"cloudbaseunit":"<#cloudbasunit>",
"version":"<#version>",
"build":"<#build>",
"ver":"12"}

Sample using Cumulus output:

{"date":"15:41",
"temp":"9.6",
"tempTL":"7.2",
"tempTH":"11.9",
"intemp":"18.6",
"dew":"7.5",
"dewpointTL":"6.1",
"dewpointTH":"8.5",
"apptemp":"8.4",
"apptempTL":"5.4",
"apptempTH":"10.3",
"wchill":"9.6",
"wchillTL":"6.5",
"heatindex":"9.6",
"heatindexTH":"11.9",
"humidex":"9.8",
"wlatest":"1",
"wspeed":"2",
"wgust":"7",
"wgustTM":"15",
"bearing":"195",
"avgbearing":"198",
"press":"1026.11",
"pressTL":"1022.90",
"pressTH":"1026.28",
"pressL":"965.70",
"pressH":"1045.30",
"rfall":"0.0",
"rrate":"0.0",
"rrateTM":"0.0",
"hum":"87",
"humTL":"78",
"humTH":"94",
"inhum":"63",
"SensorContactLost":"0",
"forecast":" Partly cloudy with little temperature change. ",
"tempunit":"C",
"windunit":"mph",
"pressunit":"hPa",
"rainunit":"mm",
"temptrend":"-0.5",
"TtempTL":"01:03",
"TtempTH":"13:30",
"TdewpointTL":"00:27",
"TdewpointTH":"12:21",
"TapptempTL":"01:03",
"TapptempTH":"13:34",
"TwchillTL":"01:41",
"TheatindexTH":"13:30",
"TrrateTM":"00:00",
"ThourlyrainTH":"00:00",
"LastRainTipISO":"2013-12-08 13:31",
"hourlyrainTH":"0.0",
"ThumTL":"13:31",
"ThumTH":"01:15",
"TpressTL":"03:46",
"TpressTH":"09:58",
"presstrendval":"0.10",
"Tbeaufort":"F2",
"TwgustTM":"03:46",
"windTM":"6",
"bearingTM":"264",
"timeUTC":"2014,12,9,15,41,4",
"BearingRangeFrom10":"160",
"BearingRangeTo10":"240",
"UV":"0.0",
"UVTH":"0.9",
"SolarRad":"7",
"SolarTM":"160",
"CurrentSolarMax":"0",
"domwinddir":"SW",
"WindRoseData":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,81.0,1332.0,3848.0,4828.0,1655.0,288.0,24.0,0.0,0.0],
"windrun":"59.3",
"cloudbase":"1734",
"cloudbaseunit":"ft",
"version":"1.9.4",
"build":"1085",
"ver":"12"}

*/
$wflashFile = "${wflashDir}wflash.txt";
if (file_exists($wflashFile) and filesize($wflashFile) > 100) {
    $wflash = explode(',', implode('', file($wflashFile)));
} else {
    $Status .= "// $wflashFile not available\n";
    $wflash = array();
}

$wflash2File = "${wflashDir}wflash2.txt";
if (file_exists($wflash2File) and filesize($wflash2File) > 100) {
    $wflash2 = explode(',', implode('', file($wflash2File)));
} else {
    $Status .= "// $wflash2File not available\n";
    $wflash2 = array();
}

# Set timezone in PHP5/PHP4 manner
if (!function_exists('date_default_timezone_set')) {
    putenv('TZ=' . $ourTZ);
} else {
    date_default_timezone_set($ourTZ);
}


// Assemble the JSON data array for output
$JSONdata = array();

$JSONdata['date'] 	= preg_replace('|\+|', '0', $wflash[1]); // CU Sample= '15:41'
$JSONdata['dateFormat'] = ($WDdateMDY) ? 'm/d/y' : 'd/m/y'; // CU Sample= 'm/d/y'
$JSONdata['temp'] 	= convertTemp($wflash[9], $uomTemp); // CU Sample= '64.7'
$JSONdata['tempTL'] = convertTemp($wflash2[92], $uomTemp); // CU Sample= '34.4'
$JSONdata['tempTH'] = convertTemp($wflash2[36], $uomTemp); // CU Sample= '64.7'
$JSONdata['intemp'] = convertTemp($wflash[8], $uomTemp); // CU Sample= '73.2'
$JSONdata['dew'] 	= convertTemp($wflash[24], $uomTemp); // CU Sample= '34.9'
$JSONdata['dewpointTL'] = convertTemp($wflash2[107], $uomTemp, 1); // CU Sample= '30.1'
$JSONdata['dewpointTH'] = convertTemp($wflash2[51], $uomTemp); // CU Sample= '40.8'
$JSONdata['apptemp'] = convertTemp($wflash[29], $uomTemp); // CU Sample= '63.4'
$JSONdata['apptempTL'] = '0.0'; // CU Sample= '32.2'
$JSONdata['apptempTH'] = '0.0'; // CU Sample= '72.3'
$JSONdata['wchill'] = convertTemp($wflash[21], $uomTemp); // CU Sample= '64.7'
$JSONdata['wchillTL'] = convertTemp($wflash2[104], $uomTemp); // CU Sample= '34.4'
$JSONdata['heatindex'] = convertTemp($wflash[23], $uomTemp); // CU Sample= '64.7'
$JSONdata['heatindexTH'] = convertTemp($wflash2[50], $uomTemp); // CU Sample= '64.7'
$JSONdata['humidex'] = calcHumidex($wflash[9], $wflash[7], $uomTemp); // CU Sample= '61.6'
$JSONdata['wlatest'] = convertWind($wflash[4], $uomWind); // CU Sample= '0.0'
$JSONdata['wspeed'] = convertWind($wflash[4], $uomWind); // CU Sample= '0.4'
$JSONdata['wgust'] = convertWind($wflash[5],$uomWind); // CU Sample= '7.0'
$JSONdata['wgustTM'] = convertWind($wflash2[32],$uomWind); // CU Sample= '11.0'
$JSONdata['bearing'] = round($wflash[3]); // CU Sample= '292'
$JSONdata['avgbearing'] = round($wflash2[2]); // CU Sample= '311'
$JSONdata['press'] = convertBaro($wflash[25], $uomBaro); // CU Sample= '30.138'
$JSONdata['pressTL'] = convertBaro($wflash2[108], $uomBaro); // CU Sample= '30.124'
$JSONdata['pressTH'] = convertBaro($wflash2[52], $uomBaro); // CU Sample= '30.229'
$JSONdata['pressL'] = convertBaro($wflash2[108], $uomBaro); // CU Sample= '26.001'
$JSONdata['pressH'] = convertBaro($wflash2[52], $uomBaro); // CU Sample= '30.569'
$JSONdata['rfall'] = convertRain($wflash2[254], $uomRain); // CU Sample= '0.00'
$JSONdata['rrate'] = convertRain($wflash2[257], $uomRain); // CU Sample= '0.00'
$JSONdata['rrateTM'] = convertRain($wflash2[150], $uomRain); // CU Sample= '0.000'
$JSONdata['hum'] = round($wflash[7]); // CU Sample= '33'
$JSONdata['humTL'] = round($wflash2[90]); // CU Sample= '31'
$JSONdata['humTH'] = round($wflash2[34]); // CU Sample= '86'
$JSONdata['inhum'] = round($wflash[6]); // CU Sample= '32'
$JSONdata['inhumTL'] = round($wflash2[89]); // CU Sample= '31'
$JSONdata['inhumTH'] = round($wflash2[33]); // CU Sample= '86'
$JSONdata['SensorContactLost'] = '0'; // CU Sample= '0'
$JSONdata['forecast'] = preg_replace('|\+|', ' ', $wflash2[271]); // CU Sample= 'increasing clouds and warmer. precipitation possible within 12 to 24 hrs. windy.'
$JSONdata['tempunit'] = preg_match('|C|i', $uomTemp) ? 'C' : 'F'; // CU Sample= 'F'
$JSONdata['windunit'] = trim($uomWind); // CU Sample= 'mph'
$JSONdata['pressunit'] = trim($uomBaro); // CU Sample= 'inHg'
$JSONdata['rainunit'] = trim($uomRain); // CU Sample= 'in'
$JSONdata['temptrend'] = convertTempRate($wflash[37], $uomTemp); // CU Sample= '-1.0'
$JSONdata['TtempTL'] = fixupTime($wflash2[120]); // WD Sample= '7:40 AM'
$JSONdata['TtempTH'] = fixupTime($wflash2[64]); // WD Sample= '3:19 PM'
$JSONdata['TdewpointTL'] = fixupTime($wflash2[135]); // WD Sample= '7:40 AM'
$JSONdata['TdewpointTH'] = fixupTime($wflash2[79]); // WD Sample= '9:16 AM'
$JSONdata['TapptempTL'] = 'n/a'; // WD Sample= '7:13 AM'
$JSONdata['TapptempTH'] = 'n/a'; // WD Sample= '1:14 PM'
$JSONdata['TwchillTL'] = fixupTime($wflash2[132]); // WD Sample= '3:19 PM'
$JSONdata['TheatindexTH'] = fixupTime($wflash2[78]); // WD Sample= '3:19 PM'
$JSONdata['TrrateTM'] = 'n/a'; // WD Sample= '00:00 AM'
$JSONdata['ThourlyrainTH'] = 'n/a'; // CU Sample= '17:14'
$JSONdata['LastRainTipISO'] = 'n/a'; // CU Sample= '2013/12/28 14:12'
$JSONdata['hourlyrainTH'] = $wflash2[255]; // CU Sample= '0.000'
$JSONdata['ThumTL'] = fixupTime($wflash2[118]); // WD Sample= '3:22 PM'
$JSONdata['ThumTH'] = fixupTime($wflash2[62]); // WD Sample= '8:05 AM'
$JSONdata['TinhumTL'] = fixupTime($wflash2[117]); // WD Sample= '3:22 PM'
$JSONdata['TinhumTH'] = fixupTime($wflash2[61]); // WD Sample= '8:05 AM'
$JSONdata['TpressTL'] = fixupTime($wflash2[136]); // WD Sample= '2:18 PM'
$JSONdata['TpressTH'] = fixupTime($wflash2[80]); // WD Sample= '10:09 AM'
$JSONdata['presstrendval'] = convertBaro($wflash[53], $uomBaro); // CU Sample= '-0.019'
$JSONdata['Tbeaufort'] = getBeaufort($wflash[4]); // WD Sample = '3', CU Sample= 'F3'
$JSONdata['TwgustTM'] = fixupTime($wflash2[60]); // WD Sample= '2:19 PM'
$JSONdata['windTM'] = convertWind($wflash2[3], $uomWind); // CU Sample= '6.2'
$JSONdata['bearingTM'] = round($wflash2[2]); // CU Sample= '315'
$fixedTimestamp = strtotime(fixupDate($wflash2[275], $WDdateMDY).' '.$JSONdata['date']);
$JSONdata['timeUTC'] = gmdate('Y,m,d,H,i,s', $fixedTimestamp); // WD/CU Sample= '2013,01,20,23,39,59'
$JSONdata['BearingRangeFrom10'] = '359'; // CU Sample= '289'
$JSONdata['BearingRangeTo10'] = '0'; // CU Sample= '6'
$JSONdata['UV'] = round($wflash[19], 1); // CU Sample= '0.7'
$JSONdata['UVTH'] = round($wflash[46], 1); // CU Sample= '1.7';
$JSONdata['SolarRad'] = round($wflash[20]); // CU Sample= '267'
$JSONdata['SolarTM'] = round($wflash2[47]); // CU Sample= '560'
$JSONdata['CurrentSolarMax'] = round($wflash2[47]); // CU Sample= '438'
$JSONdata['domwinddir'] = getWindDir($wflash2[3]); // WD Sample= 'Northwesterly', CU Sample= 'NW'
$JSONdata['WindRoseData'] = '[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0]';
// Note: VWS does not collect/publish this windrose data
// a WD Sample='[22.0,23.0,7.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,3.0,233.0,139.0]'
$JSONdata['windrun'] = convertWind($wflash2[258], $uomWindRun); // new in ver=9
$JSONdata['cloudbase'] = round($wflash[27], 0); // CU Sample= '1783', new in ver 11
$JSONdata['cloudbaseunit'] = $uomCloudBase; // CU Sample= 'ft', new in ver 11
$JSONdata['version'] = substr($wflash2[283], 1); // WD Sample= '10.37R'
$JSONdata['build'] = ' n/a'; // WD Sample= '45'
$JSONdata['ver'] = '11'; // for SS gauges 2.5.0);

// JSON assembly done.  Output the JSON file+status
if ($doDebug) {
    print "<pre>\n";
} else {
    header('Cache-Control: no-cache, must-revalidate');
    header('Content-Type: application/json');
}
print '{';
$comma = '';
foreach ($JSONdata as $key => $val) {
    print $comma;
    print "\"$key\":\"$val\"";
    $comma = ",\n";
}
print "}\n";

if ($doDebug) {
    print $Status;
    print "</pre>\n";
}

// --- end of main program -----

// functions

#-------------------------------------------------------------------------------------
# VWS support function - getBeaufort
#-------------------------------------------------------------------------------------

function getBeaufort ($rawwind) {
    global $Debug;

    // first convert mph in wflash to knots

    $WINDkts = round($rawwind * 0.8689762);

    // return a number for the beaufort scale based on wind in knots
    if ($WINDkts < 1)   {return (0);}
    if ($WINDkts < 4)   {return (1);}
    if ($WINDkts < 7)   {return (2);}
    if ($WINDkts < 11)  {return (3);}
    if ($WINDkts < 17)  {return (4);}
    if ($WINDkts < 22)  {return (5);}
    if ($WINDkts < 28)  {return (6);}
    if ($WINDkts < 34)  {return (7);}
    if ($WINDkts < 41)  {return (8);}
    if ($WINDkts < 48)  {return (9);}
    if ($WINDkts < 56)  {return (10);}
    if ($WINDkts < 64)  {return (11);}
    if ($WINDkts >= 64) {return (12);}
    return ("0");
} // end getBeaufortNumber


#-------------------------------------------------------------------------------------
# utility functions to handle conversions from
# WeatherFlash F,mph,inHg,in data to desired units-of-measure
#-------------------------------------------------------------------------------------

function convertTemp ($rawtemp,$useunit) {
    $dpTemp = 1;
    if (!is_numeric($rawtemp)) {return ($rawtemp);} // no conversions for missing values
    if (preg_match('|C|i',$useunit)) { // convert F to C
        return (sprintf("%01.${dpTemp}f", round(($rawtemp - 32.0) / 1.8, $dpTemp)));
    } else {  // leave as F
        return (sprintf("%01.${dpTemp}f", round($rawtemp * 1.0, $dpTemp)));
    }
}
#-------------------------------------------------------------------------------------

function convertTempRate ($rawtemp,$useunit) { // convert temperature RATE of change
    $dpTemp = 1;
    if (!is_numeric($rawtemp)) {return ($rawtemp);} // no conversions for missing values
    if (preg_match('|C|i',$useunit)) { // convert F to C
        return (sprintf("%01.${dpTemp}f", round($rawtemp / 1.8, $dpTemp)));
    } else {  // leave as F
        return (sprintf("%01.${dpTemp}f", round($rawtemp * 1.0, $dpTemp)));
    }
}

function calcHumidex ($temp,$humidity,$useunit) {
    // Calculate Humidex from temperature and humidity
    // Source of calculation: http://www.physlink.com/reference/weather.cfm
    global $Status;
    $T = convertTemp($temp, 'C');
    $H = $humidity;

    $t = 7.5 * $T / (237.7 + $T);
    $et = pow(10, $t);
    $e = 6.112 * $et * ($H / 100);
    $humidex = $T + (5 / 9) * ($e - 10);
    $Status .= "// calcHumidex T=$T C, H=$H calc=$humidex ";
    if ($humidex < $T) {
        $humidex = $T;
        $Status .= ' set to T, ';
    }
    if (preg_match('|F|i', $useunit)) {
        # convert to F
        $humidex = sprintf("%01.1f", round((1.8 * $humidex) + 32.0, 1));
    }
    $humidex = round($humidex,1);
    $Status .= " humidex=$humidex $useunit\n";
    return ($humidex);
}
#-------------------------------------------------------------------------------------
function convertWind  ($rawwind,$useunit) {
    global $Status;

    $using = '';
    $WIND = '';
    $dpWind = 1;

    // first convert wind to knots
    $WINDkts = $rawwind * 0.8689762;

    // now $WINDkts is wind speed in Knots  convert to desired form and decimals
    if (preg_match('/kmh|km\/h|km/i', $useunit)) { // output KMH
        $WIND = sprintf($dpWind ? "%02.${dpWind}f" : "%d", round($WINDkts * 1.85200, $dpWind));
        $using = 'KMH';
    }
    if (preg_match('/mph/i', $useunit)) {
        $WIND = sprintf($dpWind ? "%02.${dpWind}f" : "%d", round($WINDkts * 1.15077945, $dpWind));
        $using = 'MPH';
    }
    if (preg_match('/mps|m\/s/i', $useunit)) {
        $WIND = sprintf($dpWind ? "%02.${dpWind}f" : "%d", round($WINDkts * 0.514444444, $dpWind));
        $using = 'M/S';
    }
    if (preg_match('/kts|kn|kt|knots/i', $useunit)) {
        $WIND = sprintf($dpWind ? "%02.${dpWind}f" : "%d", round($WINDkts * 1.0, $dpWind));
        $using = 'KTS';
    }

    $Status .= "// convertWind($rawwind mph) [$WINDkts kts] to '$WIND' $using \n";
    return ($WIND);
}
#-------------------------------------------------------------------------------------
function convertBaro ($rawpress,$useunit) {
    $dpBaro = 1; // for hPa,mb,mm

    if (preg_match('/hPa|mb/i',$useunit)) {
        return (sprintf("%02.${dpBaro}f", round($rawpress  * 33.86388158, $dpBaro)));
    } elseif (preg_match('/mm/i',$useunit)) {
        return (sprintf("%02.${dpBaro}f", round($rawpress * 25.3970886, $dpBaro)));
    } else {
        $dpBaro = 2;
        return (sprintf("%02.${dpBaro}f", round($rawpress * 1.0, $dpBaro))); // leave in inHg
    }
}
#-------------------------------------------------------------------------------------
function convertRain ($rawrain, $useunit) {
    $dpRain = 1; // for mm
    if (preg_match('/mm/i', $useunit))  {
        return (sprintf("%02.${dpRain}f", round($rawrain * 25.3970886, $dpRain)));
    } else {
        $dpRain = 2;
        return (sprintf("%02.${dpRain}f", round($rawrain * 1.0, $dpRain))); // leave in mm
    }
}


#-------------------------------------------------------------------------------------
#  convert degrees into wind direction abbreviation
#-------------------------------------------------------------------------------------

function getWindDir ($degrees) {
    // figure out a text value for compass direction
    // Given the wind direction, return the text label
    // for that value.  16 point compass
    $winddir = $degrees;
    if ($winddir == "n/a") {return($winddir);}

    if (!isset($winddir)) {
        return "---";
    }
    if (!is_numeric($winddir)) {
        return ($winddir);
    }
    $windlabel = array ("N","NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S",
        "SSW","SW", "WSW", "W", "WNW", "NW", "NNW");
    $dir = $windlabel[fmod((($winddir + 11) / 22.5), 16)];
    return ($dir);
} // end function getWindDir
#-------------------------------------------------------------------------------------
#-------------------------------------------------------------------------------------
# support function - fixupTime
#-------------------------------------------------------------------------------------

function fixupTime ($intime) {
    global $Status,$timeOnlyFormat;

    $tfixed = preg_replace('/^(\S+)\s+(\S+)$/is', "$2", $intime);
    $t = explode(':', $tfixed);
    if (preg_match('/p/i',$tfixed)) {$t[0] = $t[0] + 12;}
    if ($t[0] > 23) {$t[0] = 12;}
    if (preg_match('/^12.*a/i', $tfixed)) {$t[0] = 0;}
    if ($t[0] < '10') {$t[0] = sprintf("%02d", $t[0]); } // leading zero on hour.
    $t2 = join(':', $t); // put time back together;
    $t2 = preg_replace('/[^\d\:]/is', '', $t2); // strip out the am/pm if any
    $tout = date($timeOnlyFormat, strtotime("today $t2"));
    $Status .= "// fixupTime in='$intime' tfixed='$tfixed' t2='$t2' tout='$tout'\n";
    return ($tout);
} // end VWSfixupTime

#-------------------------------------------------------------------------------------
# support function - fixupDate
#-------------------------------------------------------------------------------------

function fixupDate ($indate,$WDdateMDY) {
    // input: mm/dd/yyyy or dd/mm/yyyy format
    global $Status;

    $d = explode('/', $indate);      // expect ##/##/## form
    if (!isset($d[2])) {$d = explode('-', $indate);} // try ##-##-#### form instead
    if ($d[2] > 70 and $d[2] <= 99) {$d[2] += 1900;} // 2 digit dates 70-99 are 1970-1999
    if ($d[2] < 99) {$d[2] += 2000;} // 2 digit dates (left) are assumed 20xx dates.
    if ($WDdateMDY) {
        $new = sprintf('%04d-%02d-%02d', $d[2], $d[0], $d[1]); //  M/D/YYYY -> YYYY-MM-DD
    } else {
        $new = sprintf('%04d-%02d-%02d', $d[2], $d[1], $d[0]); // D/M/YYYY -> YYYY-MM-DD
    }
    $Status .= "// fixupDate in='$indate' out='$new' \n";
    return ($new);

} // end VWSfixupDate

?>