SteelSeries JavaScript gauges
=============================
Created by Mark Crossley July 2011

Version 2.4.4
Updated: 28 August 2013

+-------------------------------------------------------+
|                                                       |
| Please read the more comprehensive notes on the Wiki: |
| http://wiki.sandaysoft.com/a/SteelSeries_Gauges       |
|                                                       |
| And the FAQ on the Wiki:                              |
| http://wiki.sandaysoft.com/a/SteelSeries_FAQ          |
|                                                       |
+------------------------------------------------------ +

Some brief notes for Cumulus users (but other users should skim this as well):

Copy "realtimegaugesT.txt" to your Cumulus web folder.
Copy "gauges-ssT.htm" to your Cumulus web folder.

Configure Cumulus Internet|Files to:
 realtime file:-
    Local filename = <path>\Cumulus\web\realtimegaugesT.txt
    Remote filename = <website_root_path>/realtimegauges.txt
    Process = Yes
    Realtime = Yes
    FTP = Yes (unless you are local hosting)
 gauges HTML file:-
    Local filename = <path>\Cumulus\web\gauges-ssT.htm
    Remote filename = <website_root_path>/gauges-ss.htm
    Process = Yes
    Realtime = No
    FTP = Yes (unless you are local hosing)

NOTE: Cumulus does not actually update any data when it processes the web
      page, it simply replaces the 'static-ish' values such as your station
      name, location, version etc. If you wish you can edit the .htm file and
      directly enter the information, then you do not need to get Cumulus to
      process the file, just copy it once to your web site, removing the 'T'
      from the filename.

If required edit the "gauges.js", the key items are at the top:
    The relative path on your website to the "realtimegauges.txt" file.
    The relative path on your website to your 'trend' graphs folder.
    The relative path on your website to your old 'gauges' page.
      - users with 'old' browsers will be redirected to this page.
    If you do not require the UV/Solar Index gauges, then change the lines
      showUvGauge       : true,
      showSolarGauge    : true,
    to
      showUvGauge       : false,
      showSolarGauge    : false,


If you have installed to a web folder different from your Cumulus 'root' you
will also need to edit the "gauges-ss.htm" file, and amend the relative path
to your Cumulus "weatherstyle.css" file.

Relative Paths :
  Are just that, they specify where something is on your web site folder
  structure relative to the page you are currently displaying.
  So if you copy these gauges to a folder called 'gauges-ss' in the root of
  your website, the relative path of the Cumulus css file is one folder back in the
  path. You would then enter the path as "../weatherstyle.css".

Copy (or move) the folders 'css' and 'scripts' and their contents (the files
that are contained in the ZIP file) to the folder where your "gauges-ss.htm" file is
located (probably the same folder where all your other Cumulus HTM files are located).


What Next?
----------
After you get your new gauges page up and running, you will probably want to make it the
default gauges page on your web site. So assuming you are running the 'standard' Cumulus
web pages (if not then you can figure all this stuff out for yourself), you will need to
edit all the Cumulus supplied template files.

These files reside in your "<path to cumulus>\cumulus\web" folder. You will need to edit
each xxxxxT.htm file, and near the bottom change the link from "gauges.htm" to "gauges-ss.htm"
(also include the path if you have installed the SS gauges into a subfolder from you main
Cumulus web site).

Next time Cumulus updates your web site, the links on all your existing pages should now
point to the new SS gauges.

It is as well to leave the original Cumulus gauges page on your site, the new page will direct
any really old incompatible browsers back to the original page.

If you decide on a different 'standard' gauge size, then you need to edit the gauges-ss.css
file. By default all the gauges use the ".gaugeSizeStd" class, simply change the width and height
settings there.

You can also remove any HTML elements associated  with gauges you will not use as well, again
this is not mandatory, the script will remove them dynamically for you.

Browser Redirects
-----------------

If you want to redirect browsers that do not have scripting enabled, then you will have to
do this in the HTML file itself. In the header section add the following code:
  <noscript>
    <meta http-equiv="refresh" content="3; url=index.htm"/>
  </noscript>
Obviously with the url changed to where ever you want redirect pointing.


Changing Languages
------------------

To switch statically, you need to edit the "gauges.js" file, and change the line 12
  var strings = LANG.EN,
to
  var strings = LANG.XX,
 (where XX is the desired language code).

To add a new translation, edit the "language.js" file and copy one of the existing sections
e.g. English, to the end of the file, changing all the LANG.EN values to LANG.XX (where XX is
the code for the new language), and editing all the strings. The zip file contains a
language.js file with English, French, German, Dutch, Swedish, Danish, Finnish, Norwegian, Italian,
Spanish, and Catalan translations to get you going.

If you are only going to use one language, then deleting the unused language options and the
changeLang() function from the language.js file will speed up the page load time slightly.

To switch languages dynamically, you need to add script to your page which sets the LANG
object to equal the desired language and tand replace the '<#forecastenc>' tag with the one of your choice.

NOTE: If your forecast messages use accented characters (or any character not in the basic 103
characters in the LCD font), then I recommend that you disable the digital font on the status/forecast
display. Set the following in gauges.js:

    digitalForecast       : false,

Weather Display users have different options for the forecast message to be used. By default the
ccrlocal file uses the Davis VP %vpforecasttext% tag. Change this to what suits you best:

    %vpforecasttext%            Davis VP forecast
    %forecasticonword%          Words for the (Davis?) forecast icon
    %dailywarning/forecast%     forecast from input daily weather


Adding Logo's/Custom Images to the Gauge Backgrounds
----------------------------------------------------
The supplied code contains some commented out instructions to add a small logo to the temperature
gauge, and a larger image to the DewPoint gauge. These will probably be removed by most people,
they are added to demonstrate how to use this feature. See the comments in gauges.js about
removing/adding these logos.

In order to let the gauge background appear through your images you should make them
semi-transparent, which means saving them as PNG files.

The SteelSeries code will clip your images if they exceed the gauge background area, I suggest you
size the images similar to your desired gauge size. The code will resize the image to fit the
hen calls the changeLang() function.
e.g.
    // Dynamic script to change the default language to German
    changeLang(LANG.DE);

This will re-label all the gauges, and update the text/radio buttons etc on the web page.

However, changing the language for the gauges DOES NOT translate the displayed forecast
as the text of the message is being supplied by your weather station/software.

Forecast Messages
-----------------
By default for Cumulus the <#forecastenc> message is displayed which shows either the Cumulus
generated forecast or the external station generated forecast depending on how Cumulus is configured.
Starting with version 1.9.2 Cumulus has additional forecast message options:
<#cumulusforecastenc> - Always displays the Cumulus generated Zambretti forecast
<#wsforecastenc> - Always displays the external weather station forecast

If you wish to use one of these options, then you should edit the "realtimegaugesT.txt" file
whole background, so it you want to retain the aspect ratio make your images square!


Removing a Wind Rose 'gauge'
----------------------------
From release 2.0 I have integrated the Wind Rose 'gauge' into the standard 'package', from v2.1.0 it is enabled
by default. To disable the Wind Rose you have to make the following changes...

1. Edit gauges-ssT.htm/gauges-ss-basic.htm/gauges-ss-basic-inc.php and delete the 'radar' scripts
towards the end of the document.
       <script src="scripts/windrose.js"></script>
       <script src="scripts/RGraph.common.core.min.js"></script>
       <script src="scripts/RGraph.rose.min.js"></script>

2. Edit gauges.js, and change...
     showRoseGauge     : true,
   To...
     showRoseGauge     : false,

That's it, the Wind Rose should now be removed from your page.
Note for VWS users the Wind Rose will be automatically disabled, but these users should still remove the
scripts from the HTML as above to reduce the page load times.


Altering the gauge 'layout' on the page
---------------------------------------
It is easy to 'move' the gauges around the page to create alternative layouts. By default, there are
four rows of gauges laid out like this (o = optional gauge)...

  * * *
  * * o
  * * *
   o o

To move the gauges you just need to edit the HTML file and move <div>'s (and their contents) with a
class="gauge". Each 'row' is contained within a <div> with a class="row". If you do re-order the
gauges, then DO NOT change the "tip_N" numbers, each number is associated with a particular gauge not
it's position on the page.

I use the following 'horizontal' layout on my personal page (no Solar or UV optional gauges, but with
the optional Wind Rose)

   * * * *
  * * * * o


Altering the gauge sizes on the page
------------------------------------

From version 2.2.0 the sizes of the gauges is controlled via CSS and longer coded in the gauges.js
script. By default all the gauge canvas tags are set to pick up their size from the ".gaugeSizeStd"
class in gauges-ss.css file. To change the size of all the gauges, simply edit this class and set the
width & height to your required size - the width and height should always be the same.

You can easily have different sized gauges on the same page, in the gauges-ss.css I have created two
additional classes ".gaugeSizeSml" and ".gaugeSizeLrg", (again you can edit the width/height values
of these classes to whatever you want), to assign one of these alternative sizes to a gauge, edit
the HTML and change (for example)...

      <canvas id="canvas_baro" class="gaugeSizeStd"></canvas>
      to
      <canvas id="canvas_baro" class="gaugeSizeLrg"></canvas>

This would change the Barometer from a 221 pixel gauge, to 261 pixels (using the default values).


Weather Display Users
=====================
These files will work with WD if you switch the following value in gauges.js:
    weatherProgram    : 0,
  To...
    weatherProgram    : 1,

This will make the script use the WD customclientraw.txt file rather than the Cumulus realtimegauges.txt file.
A template for this file suitable for processing by WD is provided in the zip file - customclientrawlocal.txt

To process the customclientrawlocal.txt, in WD you need to:
* in control panel, webfiles/web page setup, real time ftp setup
* see the custom client raw file setup...and tick to create that
* make sure the needed customclientrawlocal.txt is in the clientraw folder location

The provided HTML files gauges-ssT.htm etc, are designed to be 'processed' by Cumulus before uploading
to the web site and renaming as gauges-ss.htm
This processing replaces all the tags like <#location> with general information about your station (the
station name) in this case.

To use the templates with WD you will have to manually edit the HTML file, and replace each of these tags
with information appropriate to you. I suggest you then save the file as gauges-ss.htm

You will also want to replace the Menu bar at the bottom of the HTML page which is specific to the Cumulus
sample web pages.

customclientrawlocal.txt
------------------------
The value for Humidex is set to Celcius by default. You may want to change this
tag from %humidexcelsius% to %humidexfaren% if you use Fahrenheit as your temperature
scale. (there is no WD tag to report the value in your default scale). This and the forecast tag (see above)
are the only things you should have to edit in the ccr file.


Virtual Weather Station (VWS) Users
===================================
These files will work with VWS if you have setup VWS to upload the WeatherFlash conditions files
(wflash.txt, wflash2.txt).  You do not have to purchase WeatherFlash to use these scripts, but
just have to set up VWS to upload the files via HTTP or FTP methods.  See VWS, Internet, WeatherFlash
dialog for setup and use either Server File or Active Server Page to perform the upload with
an interval of 10 seconds or so.

steelseriesVWSjson.php
----------------------
Configure the steelseriesVWSjson.php file settings area near the top of the file for the
location of the WeatherFlash Data/ directory (using relative file addressing), and for your
other preferences (units, timezone, etc.).

In scripts/gauges.js,
* change the weatherProgram variable to 2 to indicate VWS is being used.
* change the imgPathURL to the relative URL location of the VWS vwsNNN.jpg graphs.
* change the realTimeURL_VWS to the relative URL path of the steelseriesVWSjson.php script

In gauges-ss-basic.htm,
* remove the wind rose scripts by deleting the following lines...
       <script src="scripts/windrose.js"></script>
       <script src="scripts/RGraph.common.core.min.js"></script>
       <script src="scripts/RGraph.rose.min.js"></script>

Note that VWS does *not* produce data for all the entries to be displayed.
The following are missing due to this lack of VWS supplied data:
* windrose display: the display will be disabled by default.
* rain chart: the time of last rain is 'n/a'.
* all-time min/max barometer pressure: the Barometer gauge will not show red areas up to
  the all record low pressure and from the record high pressure to the max of the gauge.
* some gauges show only current values as the min/max values are not computed by VWS.
* the humidex number is not provided by VWS, but computed by the steelseriesVWSjson.php script instead,
  so there is no humidex graph available.

(Thanks to Ken True of saratoga-weather.org for the VWS support script)

WeatherCat Users
================

Please see the WeatherCat wiki page for instructions: http://wiki.trixology.com/index.php/Steel_Series_Gauges


Meteobridge Users
=================

Some features of the gauges page are not available, when you configure the program type to "4" the
script automatically disables the Wind Rose gauge and the pop-up graphs.

(Thanks to Ken True of saratoga-weather.org for the Meteobridge support script)


Release History
=======================

2.4.4
  * Updated language.js/language.min.js
    - Added missing Swedish translation strings.
  * Updated gauges.js
    - Fixed rainfall rate gauge starting from zero at each refresh for high rate values.

2.4.3
  * Updated gauges.js
    - Changed UV level thresholds from integer boundaries to 1 dp rounded boundaries. UVI is normally
      quoted as a rounded integer value, so if we are displaying decimals we should use n.5 as the transition.
    - Added missing unit conversion for today's maximum hourly rain rate.
  * Updated language.js/language.min.js
    - Changed English UV "Little Risk" wording to "Moderate Risk" to fall in-line with many recommended wordings.
      Other translations need looking at.

2.4.2
  * Updated gauges.js
    - Fixed rain gauge autoscaling between 0.5 and 1.0 when using Inches!

2.4.1
  * Updated gauges.js
    - Fixed rain rate gauge autoscaling between 0.5 and 1.0 when using Inches

2.4.0
  * Updated gauges.js
    - Added global gauge option fullScaleDeflectionTime to control pointer 'speed'
    - Changed the UV gauge to use new gradient scale colours by default
    - Added Today's High value to the UV gauge
    - Changed rain gauge to always use blue LEDs - line 653
    - Fixed the 0.5" rain gauge code introduced in version 2.3.1
    - Applied fix for VWS not supplying the correct value for max rain rate today
  * Updated the realtime JSON files to include today's high UV value
    - Cumulus - realtimegaugesT.txt - v11
    - Weather Display - customeclientrawlocal.txt - v10
    - Weather Cat - realtimegaugesWC.txt - v12
    - Meteobridge - see Ken True's web site for updated script - v10


2.3.2
  * Only WeatherCat users need to update from v2.3.1 unless you want the additional Portuguese translation
  * WeatherCat version 1.2 or later is required to run this update
  * Updated gauges.js
    - Fixed handling of current theoretical solar radiation in doSolar() for WC users
    - Made realtimegauges JSON file weather program dependent so updates to the JSON file for one program can
      be made independently of the others
  * Updated realtimegaugesWC.txt
    - Added tag value for CurrentSolarMax to replace "N/A"
    - Version uplifted to 11
  * Updated language.js/language.min.js
    - Added Portuguese translation by 'Werk_AG'

2.3.1
  * Updated gauges.js
    - Fixed wind direction variablity calculation to cope with full 360 direction changes in the last 10 minutes
    - Change wind direction METAR variablity speed threshold from USA based 6kts to European 3kts (line 1783
      if you want to change it back)
    - Added full wind data to the METAR string
    - Fixed the solar gauge, todays max indicator being shown with programs that do not supply this value
    - Added missing code to refresh the solar graph periodically
    - Added fix for WeatherCat not providing current theoretical solar max value
    - Added new user configurable options for the rain and rain-rate gauges default max scale values
    - Reset the inch rain and rain-rate gauges default max scale value from 1.0 to 0.5 inches, and when the max
      scale is less than 1.0in, use two decimal places.
  * Updated gauges-ss-basic.htm
    - Fixed two HTML5 errors
  * Updated realtimegaugesT.txt (ver 10) (Cumulus)
    - Added missing todays solar max value
  * Updated realtimegaugesWC.txt (ver 10) (WeatherCat)
    - Moved todays max value from current theoretical max to todays max
  * Updated src/steelseries.js
    - New library version v0.14.3 - Fixes script exception/crash in Firefox v21+
    - Also updated src/steelseries.min.js & steelseries_tween.min.js
  * Removed jquery-1.8.2.min.js from the distribution

2.3.0
  * Updated gauges.js
    - Added support for Meteobridge.
  * Updated windrose.js
    - Fixed 'blurry' appearance of the rose plot at some gauge sizes.

2.2.3
  * Updated gauges.js
    - Fixed bug in handling WeatherCat wind speeds in Knots
  * Updated steelseries.js, steelseries.min.js, steelseries_tween.min.js
     - Now up to SS v0.14.0 (adds support for user LED's)
  * Updated windrose.js
    - Minor tweaks

2.2.2
   * Updated gauges.js
     - Fixed mph & knots wind unit handling for WeatherCat users only
   * Updated languages.js
     - Nederlands strings updated

2.2.1
   * Updated gauges-ssT.htm
     - Fixed typo in <span id="lang_longtitude"> -> <span id="lang_longitude">
   * Updated gauges.js
     - Fixed automatic gauge resizing on 'mobile' devices.

2.2.0
   * Updated gauges.js
     - Added support for WeatherCat
     - Changed gauge shadow default to 30% black, and added gauge.shadowColour parameter
     - All gauges now take their size from the HTML/CSS, this means they can easily be indiviually resized
     - Moved solarGaugeScaleMax from 'config' to 'gauge' where it more logically belongs with the other scale values
   * Updated gauges-ss.css
     - Added classes gaugeSizeSml, gaugeSizeStd, gaugeSizeLrg
   * Updated windrose.js
     - Now picks up gauge shadow colour from gauges.gauge.shadowColour
     - Gauge shadow code now picked up from gauges.js
     - Internal renaming of variables from radar to rose
   * Added file gauges-ss-basic-inc.php
     - Provides a page to integrate with Ken True's popular Saratoga web site templates
   * Update gauges-ssT.htm, gauges-ss-basic.htm, gauges-ss-basic-inc.php
     - All gauge sizes (width/height) now replaced with class="gaugeSizeStd"
     - Amended the status LCD panel and timer LCD panel sizes to match sizes previously set in the gauges.js script
     - Changed rose script from RGraph.radar.min.js to RGraph.radar.min.js
   * Updated steelseries.js, steelseries.min.js, steelseries_tween.min.js
     - Now up to SS v 0.13.0
   * Removed RGraph.radar.js/Rgraph.radar.min.js
     - Added RGraph.rose.js/RGraph.rose.min.js

2.1.1
   * Updated windrose.js
     - Made the compass point symbols slightly larger and darker.
     - Fixed problems with the odometer positioning on some pages.
   * Updated language.js/language.min.js
     - Completed Greek, Finnish, & Norwegan translations.
     - Updated Spanish & Catalan translations.
   * Renamed the combined steelseries & tween file from "steelseries.min.js" to "steelseries_tween.min.js"
     - No functional changes
   * Updated gauges-ssT.htm & gauges-ss-basic.htm
     - To pick up renamed steelseries_tween.min.js file
     - No functional changes
   * Updated gauges.js
     - Fixed wind run display units handling when source data is non-metric and the browser does not have a cookie set.
     - Added in 'missing' code to make the LED flash red when the page timeout occurs.

2.1.0
   * New file gauges-ss-basic.htm
     - This is a minimal html page to display the gauges, suitable for including in an existing page via an <iframe>
       tag, or including in PHP scripts.
   * Updated gauges.js
     - Made the Wind rose enabled by default.
     - Added option to disable the Wind Run odometer on the Wind Rose.
     - Changes to support Wind Run odometer.
     - Added support for VWS.
   * Updated windrose.js
     - Changes to support the Wind Run odometer.
   * Updated gauges.css
     - Changes to support the Wind Run odometer.
   * Updated gauges-ssT.htm
     - Windrose radar scripts are now enabled by default
   * Updated realtimegaugesT.txt & customclientrawlocal.txt
     - Added "windrun" = wind run today - for odometer
   * Updated languages.js/languages.min.js
     - Added - windruntoday: "Wind run today" - translations required please!
   * New file steelseriesVWSjson.php
     - Generates the JSON data for VWS users
   * Removed file weatherstyle.css
     - This is used by the Cumulus template(gauges-ssT.htm) and was only included for WD users, Cumulus users
       would already have this file. I expect WD & VWS users to use the gauges-ss-basic.htm which does not
       use this style sheet.


2.0.4
   * Updated gauges.js
     - Fixed check/redirect for browsers not supporting canvas, this had been broken by the 2.0 changes.
   * Updated steelseries.min.js
     - Now version 0.12.1 - fixes with WindDir gauge when setting average value=360, implements configurable time
       for full scale pointer deflection.
   * Renamed gauges-ssT.html to gauges-ssT.htm to match the rest of the Cumulus template files

2.0.3
   * Updated gauges.js
     - Internal structural change to the LED handling
     - Removes RGraph attribution from HTML if the Wind Rose is not used
     - Added onClick event to the status LED to restart page updates after a timeout
     - Added gauge drop shadows
   * Updated gauges-ssT.html
     - Changed default canvas size from 251 to match the 'scripted' size of 221
     - Added RGraph attribution (required by licencing terms)
   * Updated steelseries.js (and .min)
     - Latest 0.12.0 build from Github
   * Updated windrose.js
     - Fixed display issues on resizing by resizing rose canvas object on the main page
     - Added gauge drop shadows
   * Updated language.js
     - French translation now complete, thanks Jacques
     - Change page timeout text to read '...click status LED to restart' instead of '...refresh browser'
   * Updated gauges-ss.css
     - Added some elements from weatherstyle.css to reduce dependency on weatherstyle.css

2.0.2
   * Updated gauges.js
     - Fixed WD problems when using windspeed units of km/h
     - Changed barometer scale to use 1 decimal place on the kPa scale
   * Updated gauges-ss.css
     - Added 'content' class definitionS

2.0.1
    * Updated gauges.js
      - Fixed syntax error that affected WD users

2.0.0
    * Much of the code rewritten and/or reformatted
      - Most things now contained in a 'gauges' object to avoid polluting the global namespace with
        numerous variables etc.
      - Load orders changed to speed up initial page load/display
    * Updated gauges.js
      - Added ability to select the display units:
          Temp: °C, °F
          Rain: mm, inch
          Wind: km/h, m/s, mph, knots
          Baro: hPa, mb, inHg, kPa
      - Added (optional) cookie handling to preserve end user unit preferences across sessions
      - Added variables to set the default min/max values for gauges
      - Changed the temperature gauge scaling logic so both gauges always use the same range (except
        for the indoor temperature)
      - Default units are now 'metric': °C, mm, hPa, km/h
      - Fixed bug in getord() routine
      - Added config.dewDisplayType setting to control initial 'dew' gauge display
      - Added smaller gauge size option for 'mobile' devices
    * Updated Language handling, all languages now use a single (English by default) template HTML file,
      calling changeLang(LANG.newLanguage) now updates the HTML as well as the gauges.
    * Updated realtimeGaugesT.txt & customclientrawlocal.txt
      - Added todays dominant wind direction
    * Added Danish, Norwegian, and Italian translations
    * Changed gauges-ssT.html to use <div>'s for the layout rather than tables.
    * Removed ddimgtooltip.css - now incorporated into gauges-ss.css
    * Removed ddimgtooltip.js  - now incorporated into gauges.js
    * Removed tween.min.js     - now incorporated into steelseries.min.js
    * Updated realtimeGaugesT.txt and ccrT.txt files to ver8 - added dominant wind direction
    * Updated steelseries.js
      - Updated to v0.11.14
    * Added optional Wind Rose 'gauge', this also adds the following scripts. The Wind Rose is not enabled by
      default, and the scripts will not downloaded by the page.
      - windrose.js
      - RGraph.common.core.min.js
      - RGraph.radar.min.js

1.6.6
    * Updated languages.js
      - Added Danish translation - thanks Henrik - but no template HTML file
      - Added Finnish translation - thanks Timo
    * Updated gauges.js
      - Fixed the humidty graph being downloaded every realtime update.
    * Added gauges-ssT-fi.htm
      - Finnish translation

1.6.5
    * Updated gauges.js
      - Fixed last rain date calculation
      - Added g_weatherProgram variable to indentify Cumulus or Weather Display
      - Added g_tipImgs array for WD using wxgraphs
      - Fixed temperature gauge not displaying temperature range colour sections on range change.
      - Fixed WD baro pressure trend - WD is supplying a 3 hour value, so needed to be divided by 3.
      - Added localisation of baro trend text
      - Added extended temperature trend strings "slowly/quickly/rapidly"
      - Added support for kPa pressure units
      - Change default gauge scale number orientation to horizontal
      - Changed WindDir gauge labels to NOT be coloured by default: drawDir() -> "useColorLabels : false"
    * Updated realtimeGaugesT.txt
      - Removed pressure trend text - localised string now derived from trend value
    * Updated customclientrawlocal.txt
      - Removed pressure trend text - localised string now derived from trend value
      - Changed forecast tag to use the Davis VP forecast by default
      - Changed todays max gust direction to use the new tag %maxgstdirectiondegree%
    * Updated language.js
      - Added additional strings for barometer/temperature trends
      - Fixed some NL translations
    * Updated steelseries.js (& .min)
      - Updated to v0.11.1
      - WindDirection, added initialisation parameter 'useColorLabels', default = false
    * General
      - Removed any extraneous BOM characters for UTF-8 encoded files (.html .js .css)

1.6.4
    * Updated gauges.js
      - Fixed temperature gauges (out & dew) not displaying the min/max shaded area

1.6.3
    * Updated gauges.js
      - Fixed wind max. avg. speed
      - Added g_showPopupDataGraphs variable to switch off graphs from the popup data
      - Added different graph image options for each gauge option (dew point, apparent,
        etc., out and in humidity)
    * Updated language.js
      - Dutch translations now complete
    * Updated ddimagestooltip.js (and min)
      - Removed explicit graph file names, now they are only specified in gauges.js


1.6.2
    * Updated gauges.js
      - Fixed max gust today indicator on wind gauge
      - Fixed baro look-n-feel for 'mb' stations
      - Fixed Solar gauge area drawing when value > theoretical
      - Changed Cumulus 'in' pressure units to 'inHg'
      - Change UV readings to recognise level 0 as unique
      - Added back links to Cumulus/Weather Display websites
    * Updated languages.js
      - French translations now complete
      - Added additional UV level 0 text

1.6.1
    * Updated realtimegaugesT.txt
      - fixed typo for SolarRad

1.6.0
    * Updated gauges.js
      - Made the script more friendly for Weather Display. It now parses all numeric values before
        use and strips out non-numeric data such as units etc.
      - Added support for optional Solar Radiation Gauge
      - Moved changeLang() function to language.js
    * Added customclientrawlocal.txt
      - This is the Weather Display equivalent of realtimegaugesT.txt
    * Updated realtimegaugesT.txt
      - Removed temptrendtext
      - Added Solar values
      - Updated version to 6
    * Updated languages.js
      - Added strings for rising/falling/steady, these will now appear localised on the pop-up data rather
        than in the station language
      - Added strings for Solar gauge
      - Added changeLang() function
    * Updated gauges-ssT.htm (and variants)
      - Made them more program agnostic
      - Added Solar Rad. gauge
    * Updated ddimgtooltip.js
      - Added support for Solar gauge
    * Updated steelseries.js
      - Made WindDirection LCD label colours match the pointer colours

1.5.4
    * Updated gauges.js
      - Added WindDirection LCD titles to the changeLang() function
      - Increased default page timeout from 10 to 20 minutes
    * Updated steelseries.js
      - Now version 0.10.2; adds the setLcdTitleStrings() method to the WindDirection gauge

1.5.3
    * Updated gauges.js
      - Setting g_pageUpdateLimit = 0 disables the page update time limits
      - Removed the old redundant no HTML5 support code

1.5.2
    * Updated gauges.js
      - Fixes script 'hangs' when the realtimegauges.txt file is zero length (e.g. when it is being
        updated on the server during the download), and retry after 2 seconds.
      - Added a page timeout counter, this stops page updates after a specfied time - default 10 minutes
        You can over ride this with a parameter and password in the URL (default = 'its-me'), for example:
          http://www.sometwhere.com/gauges-ss.htm?pageUpdate=its-me
      - Fixed the browser redirect on no HTML5 Canvas support, it has been broken for a few releases.
    * Updated language.js
      - Added page timeout string
      - Restructured to reduce size a little
      - Removed canvas features not supported string
    * Updated gauges-ssT.htm
      - Added 'no script' message
    * Updated this ReadMe.txt with information about browser redirects for script disabled

1.5.1
   * Updated SteelSeries library
     - v0.9.17 - fixes sector/area drawing issues with Chrome Dev release 19
   * Updated gauges-ss.css
     - Added references to external ttf, svg, and eot font files for backward compatibility with browsers
       that do not support the woff font embedded in the css file.
     - Changed gauge table style so it is centered horizontally on page.
   * Updated gauges-ssT.htm (+ all translations)
     - Changed html so gauges are always centered horizontally on page
   * Adds 'font' folder back in to archive
     - A subset of the original font files included
   * Updated gauges.js
     - minor changes to attempt to fix missing zero values on the rain gauges

1.5.0
   * REQUIRES Cumulus 1.9.2 build *1029* or later
   * Updated gauges.js
     - Moved popup initialiastion into gauges.js and after gauge initialisation, this
       speeds up the page display at the expense of the popup images not being available immediately after
       page load.
     - Changed launch of init() from onLoad to onDomReady - in supported browsers.
   * Updated ddimgtooltips.js (+ minimised version)
     - Moved popup initialiastion into gauges.js
   * Added Swedish translation
     - Courtesy of Björn
     - Updated language.js
     - Added gauges-ssT-se.htm
   * Updated gauges-ssT.htm (+ translations)
     - Removed onLoad() from body tag

1.4.4
   * Removed 'font' folder
   * Updated gauges.css
     - Embedded the LCD font in the CSS file to avoid download timing problems
   * Updated steelseries.js (+ minimised version)
     - Altered LCD font positioning code to try and ensure consistency across browsers (tested on Chrome, IE and FF)

1.4.3
   * Updated gauges.js
     - Reduced the default range for the barometer from 960-1040 to 990-1030hPa (29.0-30.5 to 29.2-30.4inHg).
       This should look better on those sites that have very little pressure variation.
     - Finally(?) at third attempt got the METAR STDY wind calculation correct!
     - Fixed comma decimal bug with temperature and pressure trends.

1.4.2a
   * Updated steelseries.js (+ minimised)
     - Up to version 0.9.14, improved TrendIndicator 'glow'
     - Bug fix from 0.9.13

1.4.2
   * Updated gauges.js
     - Fixed bug in METAR STDY wind calculation
     - Fixed Wind Direction titles always displaying in English
   * Updated language.js
     - Added Dutch translations for UV gauge (thanks to 'Marc')
     - HTML5 cleanups
   * Updated gauge-ssT.htm (+ translations)
     - HTML5 cleanups
   * Updated steelseries.js (+ minimised)
     - Up to version 0.9.13, improved TrendIndicator 'glow'

1.4.1
   * Updated gauges.js
     - Fixed comma decimal bug in UV gauge
   * Updated steelseries.js (+ minimised)
     - Up to version 0.9.12, no functional changes from 0.9.11
   * Updated gauges-ssT.htm
     - I left it using the full steelseries script that I debug with rather then the
       minimised version - oops!
   * Updated language.js
     - Partially translated UV gauge

1.4.0
    * Updated gauges-ssT.htm (plus other languages)
      - Added UV gauge
      - Made Cumulus version/build fields dymanically updated by the script
    * Updated ddimgtooltip.js (plus minimised)
      - Amended to cope with non-graphic pop-ups for UV gauge
    * Updated language.js
      - Added UV entries, English only for now, translations required
    * Updated steelseries.js (plus minimised)
      - Uplifted to version 0.9.11a, Cumulus cutdown version
    * Updated realtimeguagesT.txt
      - Added UV and Cumulus version values

1.3.4
    * Updated ddimgtooltip.js/ddimgtooltip.min.js
      - Fixes temperature graph issue
    * Updated steelseries.js to library version 0.9.10
      - Implements new pointer types TYPE15 & TYPE16
      - Implements the TURNED gauge background
      - Improved Trend Indicator
      - Improved pointer shadows

1.3.3
    * Updated steelseries.js to library version 0.9.7
      - Implements trend indicators on Radial gauges
      - Fixes frame redraw bug in Wind gauge
    * Updated gauges.js
      - Implements trend indicators
    * Updated realtimegaugesT.txt
      - Added temptrend and presstrend values

1.3.2
    * No functional changes from v1.3.1
    * Updated all HTML pages
      - Moved hidden DIV to start of the body
      - Moved all the scripts to the end of the document
      - Made w3c validator compliant
    * Updated gauges-ss.css
      - Part of w3c validator compliance changes
    * Updated ddimgtooltip.js/ddimgtooltip.min.js
      - Part of w3c validator compliance changes

1.3.1
    * Updated this readme
      - With corrected remote file slashes, and details on configuring the standard Cumulus pages
        to point to the new SS gauge page
    * Updated steelseries.js to library version 0.9.6
      - The inch rain gauge exposed a bug in the core library
    * Updated gauges.js
      - Made tick label orientation a globally configured item
      - Made rain gauge colouring configurable from global variables at the top of the script
    * Updated realtimegaugesT.txt
      - Small changes for future consistency

1.3.0
    * REQUIRES Cumulus b1025 to function fully (wind direction variation)
    * Updated steelseries.js
      - Added WindDirection component, dual pointer for latest & average directions to replace Compass
      - Switched to a slimed down Cumulus specific version of the library.
      - For the full library please visit https://github.com/HanSolo/SteelSeries-Canvas
    * Updated gauges.js
      - Now uses new WindDirection component, you can switch off the wind direction variation indication
        using the g_showWindVariation variable (you have a windmilling Fine Offset station for instance!)
      - Removed Wind Direction LCD panel handling - now redundant with new gauge.
      - Default gauge size now 251 (was 250), odd number sizes render better
      - Fixed IE9 javascript exception when realtime txt fetches timed out
    * Updated gauges-ssT.htm (and other languges)
      - Removed radio buttons from wind direction gauge
      - Changed gauge size from 250 to 251
    * Switched realtimegauges.txt to JSON format data
      - Removes the need for the parseReatime.js script

1.2.2
    * Updated steelseries.js
      - Minor tweak to stop filled 'areas' overlapping shaded 'sectors' on radial gauges
      - Minor fix to LED component redraw when changing colour (the halo density used to increase
        with each colour change)
      - Added shadows to LCD text for a more 3D effect - Standard LCD colour only.
      - Optimised the compass rose drawing routines
    * Added gauges-altT.htm and gauges-alt.css
      - Alternative minimal page without any gauge option buttons, and a 'compressed' layout
    * Updated gauges.js
      - Removed logo's showing by default

1.2.1
    * Updated gauges.js
      - Minor: Changed section colours for temperature and rain rates
      - Changed logo images to use the imgPathURL variable for their path
    * Updated steelseries.js
      - Added boolean parameters showDegrees and showRose to the compass component

1.2.0
    * Updated gauges.js
      - Added demo gauge background image layers to Temperature and Dew Point gauges
    * Updated steelseries
      - Added gauge background image layer
    * Added "images" folder
      - Two demo background layer images (logoSmall.png, logoLarge.png)

1.1.5
    * Updated gauges.js
      - Added g_forecast_width variable to easily change the size of the status/forecast display
    * Updated realtimegaugesT.txt
      - Changed temperature units to use new Cumulus 1.9.2 <#tempunitnodeg> web tag.
        The scripts will still work with Cumulus 1.9.1 and the old realtimegaugesT.txt.

1.1.4
    * Updated language.js
      - added Dutch translation courtesy of Ron "nitrx"
    * Added gauges-ssT-nl.htm
      - new Dutch template translation courtesy of Ron "nitrx"
    * Updated gauges.js
      - added sector colouring to the rainrate gauge based on the descriptions in the wiki
        (http://wiki.sandaysoft.com/a/Rain_measurement)

1.1.3
    * Updated gauges.js
      - fixed incorrect LANG properties .lowest_infoF and .highest_infoF in the temp gauge popup.
    * Updated language.js
      - added German translation courtesy of Martin "sharonna"
    * Added gauges-ssT-de.htm
      - new German template translation courtesy of Martin "sharonna"

1.1.2
    * Updated gauges.js
      - changes to the changeLang() function to fix 'flashing' effects
    * Updated steelseries.js
      - changes to radial gauge SET methods to better support language switching
    * Updated .htm files
      - to remove the calls to changeLang() that ran before the gauges were initialised.

1.1.1
    * Updated gauges.js
      - fixed temperature popup data strings for languages with masculine/feminine

1.1.0
    * Now works with Cumulus 1.9.1, adds autoscrolling for long forecasts, changes how multiple
      languages are handled.
    * Updated steelseries.js
      - updated to release 'standard release' 0.7.2 from Gerrit
      - fixed logic around LED blinking
      - fixed singleLCD panel clipping text with long thin displays
      - added autoScrolling, automatically scrolls long messages that do not fit in the display,
        short messages are still displayed statically.
    * Updated gauges.js
      - added 'hot' scale shading (above 45C, 110F)
      - added check for Cumulus build number in 'station off-line' code
    * Updated realtimegaugesT.txt
      - added cumulus build number
    * Updated parseRealtime.js
      - updated for extra build number field
    * Updated gauges-ssT.htm, gauges-ssT-Fr.htm
      - added hidden span to force early .ttf font download from web servers that do serve .woff files
      - added include for language.js
      - updated to HTML 5 standards
    * Added language.js file
      - contains language translations, default file contains English & French

1.0.1
    * Updated gauges.js, fixed default windspeed unit. Must be 'mph'

1.0 * Updated gauges.js
      - Now checks for existance of gauge in HTML before attempting to draw it
      - Now checks the results of parseRealtimeGauges() for expected number of values
        in order to detect incomplete/failed realtime downloads
      - LED redraws now limited to state changes, stops 'corona' intensity increasing over time
      - Added changeLang() function, call this after updating the LANG object
      - General code tidy up
    * Updated parseRealtime.js
      - Now returns the number of Cumulus webtag values found
    * Updated gauges-ss.htm
      - Renamed file to gauges-ssT.htm as it is intended to be processed by Cumulus
      - Genernal code tidy up and made to match standard Cumulus templates better
    * Changed default paths so gauges-ss can be installed in main Cumulus folder
      on your web site.

0.9 * Updated gauges.js
      - Fixed scale shading for farenheit temperatures
      - Changed rain and rain rate inches gauges to start range of 0-1 inch
      - Fixed displaying script version in FireFox
    * Updated steelseries.js
      - Added variable decimals to fractionalScale type of radialBargraph gauge

0.8 * Updated ddimgtooltip.js & ddimgtooltip.css
      - Moved all formating out to the CSS file (courtesy of Ray)
      - Added rounded corners and slightly large graph image (courtesy of Ray)
    * Updated realtimegaugesT.txt
      - Added <#timeUTC> data
    * Updated parseRealtime.js
      - Added timeUTC handling
    * Updated gauges.js
      - Added functionality to display error message, and flash status LED if the
        data is 'stale' because the realtime file is not updating.
      - Added string LANG.led_title_offline
      - Added g_stationOfflineTimeout variable to determine offline limit

0.7 * Updated gauges.js:
      - Reintroduced cache defeat on realtimegauges.txt GET (IE9 requirement)
      - Added minimum ranges to barometer scale; 970-1040 hPa or 29.0-30.5 inHg
      - Improved handling/gauge appearance of inHg and inches of rain units
      - Improved temperature range handling; now C: -40 to +60, F: -30 to +130
    * Updated steelseries.js:
      - fix for small fonts on some browser/OS/driver combinations.
      - added 'blinking' method to the sensor warning led.
      - added variable number of decimals on factional scales

0.6 * Updated gauges.js:
      - more tweaking of graph downloads.
      - added option to put 'status' LCD in 'normal' text mode for accented character display.
      - all embedded strings now in one section for 'easier' language localisation
      - English language updates
      - added redirect to 'old' gauges page for incompatible browsers
    * Updated steelseries.js:
      - new version from Gerrit
      - increased radial/radialbargraph scale font size slightly - improves FF5/Windows appearance(?)
      - added compass point Symbol customisation
    * Updated gauges-ss.htm:
      - now formatted like the 'standard' Cumulus template pages
    * Minified the ddimgtooltip.js, parseRelatime.js, tween.js, and steelseries.js files as these are pretty stable
      and not much for people to modify in there.

0.5 * Updated parseRealtime.js, changes decimal points to match the end users locale
    * Updated gauges.js, now counts down correctly on http retries.
      Popup data graphs now only downloaded every 15mins by default.
      Fixed some remaining comma decimal conversions (hope that is all of them now)

0.4 * Updated gauges.js (added forescast .trim() for Davis forecasts, force barometer scale to match expected)
    * Updated ddimgtooltip.js (initial img path was hard coded)
    * Updated realtimegaugesT.txt (wrong version included in v0.3)
