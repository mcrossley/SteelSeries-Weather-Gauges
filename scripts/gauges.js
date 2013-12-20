/*!
 * A starter gauges page for Cumulus and Weather Display, based
 * on the JavaScript SteelSeries gauges by Gerrit Grunwald.
 *
 * Created by Mark Crossley, July 2011
 *  see scriptVer below for latest release
 *
 * File encoding = UTF-8
 *
 */
/*globals steelseries, LANG, changeLang, windRose, alert, unescape*/
/*jshint jquery:true,nomen:false,plusplus:false */

var gauges = (function () {
    var strings = LANG.EN,         //Set to your default language. Store all the strings in one object
        config = {
            // Script configuration parameters you may want to 'tweak'
            scriptVer         : '2.4.4 - 2013-08-25',
            weatherProgram    : 0,                      //Set 0=Cumulus, 1=Weather Display, 2=VWS, 3=WeatherCat, 4=Meteobridge
            imgPathURL        : './images/',            //*** Change this to the relative path for your 'Trend' graph images
            oldGauges         : 'gauges.htm',           //*** Change this to the relative path for your 'old' gauges page.
            counter           : 60,                     //download data counter (secs, default 60)
            gaugeMobileScaling: 0.85,                   //scaling factor to apply when displaying the gauges mobile devices, set to 1 to disable
            graphUpdateTime   : 15,                     //period of popup data graph refesh, in minutes (default 15)
            stationTimeout    : 3,                      //period of no data change before we declare the station offline, in minutes (default 3)
            pageUpdateLimit   : 20,                     //period after which the page stops automatically updating, in minutes (default 20),
                                                        // - set to 0 (zero) to disable this feature
            pageUpdatePswd    : 'its-me',               //password to over ride the page updates timeout, do not set to blank even if you do not use a password
            digitalFont       : true,                   //Font control for the gauges & timer
            digitalForecast   : true,                   //Font control for the status display, set this to false for languages that use accented characters in the forecasts
            showPopupData     : true,                   //Popup data displayed
            showPopupGraphs   : true,                   //If popup data is displayed, show the graphs?
            showWindVariation : true,                   //Show variation in wind direction over the last 10 minutes on the direction gauge
            showIndoorTempHum : true,                   //Show the indoor temperature/humidity options
            showUvGauge       : true,                   //Display the UV Index gauge
            showSolarGauge    : true,                   //Display the Solar gauge
            showRoseGauge     : true,                   //Show the optional Wind Rose gauge
            showRoseGaugeOdo  : true,                   //Show the optional Wind Rose gauge Windrun Odometer
            showGaugeShadow   : true,                   //Show a drop shadow outside the gauges
                                                        // The realtime files should be absolute paths, "/xxx.txt" refers to the public root of your web server
            realTimeURL_Cumulus: 'realtimegauges.txt',     //*** Cumulus Users: Change to your location of the realtime file ***
            realTimeURL_WD     : 'customclientraw.txt',    //*** WD Users: Change to your location of the ccr file ***
            realTimeURL_VWS    : 'steelseriesVWSjson.php', //*** VWS Users: Change to your location of the JSON script generator ***
            realTimeURL_WC     : 'realtimegaugesWC.txt',   //*** WeatherCat Users: Change to your location of the JSON script generator ***
            realTimeURL_MB     : 'MBrealtimegauges.txt',   //*** Meteobridge Users: Change to the location of the JSON file
            useCookies        : true,                   //Persistently store user preferences in a cookie?
            tipImages         : [],
            dewDisplayType    : 'app'                   //Initial 'scale' to display  'dew' - Dewpoint
                                                        // on the 'dewpoint' gauge.   'app' - Apparent temperature
                                                        //                            'wnd' - Wind Chill
                                                        //                            'hea' - Heat Index
                                                        //                            'hum' - Humidex
        },

        // test for canvas support before we do anything else, especially reference steelseries which will cause the script to abort!
        _canvas = (!!document.createElement("canvas").getContext ?
            true :
            (function () {
                $('body').html(strings.canvasnosupport);
                setTimeout(function () {
                    window.location = config.oldGauges;
                }, 3000);
                return false;
            }())
        ),

        //Gauge global look'n'feel settings
        gauge = {
            minMaxArea             : 'rgba(212,132,134,0.3)', //area sector for todays max/min. (red, green, blue, transparency)
            windAvgArea            : 'rgba(132,212,134,0.3)',
            frameDesign            : steelseries.FrameDesign.TILTED_GRAY,
            background             : steelseries.BackgroundColor.BEIGE,
            foreground             : steelseries.ForegroundType.TYPE1,
            pointer                : steelseries.PointerType.TYPE8,
            pointerColour          : steelseries.ColorDef.RED,
            gaugeType              : steelseries.GaugeType.TYPE4,
            lcdColour              : steelseries.LcdColor.STANDARD,
            knob                   : steelseries.KnobType.STANDARD_KNOB,
            knobStyle              : steelseries.KnobStyle.SILVER,
            labelFormat            : steelseries.LabelNumberFormat.STANDARD,
            tickLabelOrientation   : steelseries.TickLabelOrientation.HORIZONTAL, // was .NORMAL up to v1.6.4
            rainUseSectionColours  : false,                                       // Only one of these colour options should be true
            rainUseGradientColours : false,                                       // Set both to false to use the pointer colour
            tempTrendVisible       : true,
            pressureTrendVisible   : true,
            uvLcdDecimals          : 1,
            // default gauge ranges - before auto-scaling/ranging
            tempScaleDefMinC       : -20,
            tempScaleDefMaxC       : 40,
            tempScaleDefMinF       : 0,
            tempScaleDefMaxF       : 100,
            baroScaleDefMinhPa     : 990,
            baroScaleDefMaxhPa     : 1030,
            baroScaleDefMinkPa     : 99,
            baroScaleDefMaxkPa     : 103,
            baroScaleDefMininHg    : 29.2,
            baroScaleDefMaxinHg    : 30.4,
            windScaleDefMaxMph     : 20,
            windScaleDefMaxKts     : 20,
            windScaleDefMaxMs      : 10,
            windScaleDefMaxKmh     : 30,
            rainScaleDefMaxmm      : 10,
            rainScaleDefMaxIn      : 0.5,
            rainRateScaleDefMaxmm  : 10,
            rainRateScaleDefMaxIn  : 0.5,
            uvScaleDefMax          : 16,				//Northern Europe may be lower - max. value recorded in the UK is 8, so use a scale of 10 for UK
            solarGaugeScaleMax     : 1400,              //Max value to be shown on the solar gauge - theoretical max without atmosphere ~ 1374 W/m²
                                                        // - but Davis stations can read up to 1800
            shadowColour           : 'rgba(0,0,0,0.3)'  //Colour to use for gauge shadows - default 30% transparent black
        },

        commonParams = {
            // Common parameters for all the SteelSeries gauges
            fullScaleDeflectionTime : 5,				//Bigger numbers (seconds) slow the gauge pointer movements more
            gaugeType               : gauge.gaugeType,
            minValue                : 0,
            niceScale               : true,
            ledVisible              : false,
            frameDesign             : gauge.frameDesign,
            backgroundColor         : gauge.background,
            foregroundType          : gauge.foreground,
            pointerType             : gauge.pointer,
            pointerColor            : gauge.pointerColour,
            knobType                : gauge.knob,
            knobStyle               : gauge.knobStyle,
            lcdColor                : gauge.lcdColour,
            lcdDecimals             : 1,
            digitalFont             : config.digitalFont,
            tickLabelOrientation    : gauge.tickLabelOrientation,
            labelNumberFormat       : gauge.labelFormat
        },
        _firstRun = true,          //Used to setup units & scales etc
        _userUnitsSet = false,     //Tracks if the display units have been set by a user preference
        _refreshGraphs = false,    //Flag to signal refesh of the pop data graphs
        data = {},                 //Stores all the values from realtime.txt
        _countDownTimer,
        _count = 11,               //countdown tracker, initially set to download timeout value
        _httpError = 0,            //global to track download errors
        _pageUpdateParam,          //Stores the password if any from the page URL
        _statusStr = strings.statusStr,
        _cacheDefeat = '?' + (new Date()).getTime().toString(), //used to force reload of popup data graphs,
        _pageLoaded = new Date(),
        _displayUnits = null,      //Stores the display units cookie settings
        _displayDewGauge = null,   //Stores the dewppoint gauge preferred scale
        _temp = {},
        _dew = {},
        _wind = {},
        _dir = {},
        _rain = {},
        _rrate = {},
        _baro = {},
        _hum = {},
        _uv = {},
        _solar = {},
        _led = {},
        _sampleDate,
        _realtimeVer,   //minimum version of the realtime JSON file required
        _programLink = ['<a href="http://sandaysoft.com/products/cumulus" target="_blank">Cumulus</a>',
                        '<a href="http://www.weather-display.com/" target="_blank">Weather Display</a>',
                        '<a href="http://www.ambientweather.com/virtualstation.html" target="_blank">Virtual Weather Station</a>',
                        '<a href="http://trixology.com/weathercat/" target="_blank">WeatherCat</a>',
						'<a href="http://www.meteobridge.com/" target="_blank">Meteobridge</a>'],
        _gaugeTemp, _gaugeDew, _gaugeRain, _gaugeRRate,
        _gaugeHum, _gaugeBaro, _gaugeWind, _gaugeDir,
        _gaugeStatus, _gaugeTimer, _gaugeUV, _gaugeSolar, _gaugeLed,
/*        _imgBackground,    // Uncomment if using a background image on the gauges */

// Nothing below this line needs to be modified for the gauges as supplied
// - unless you really know what you are doing
// - but remember, if you break it, it's up to you to fix it ;-)
// -------------------------------------------------------------

        //
        // init() Called when the document is ready, pre-draws the Status Display then calls
        // the first Ajax fetch of realtimegauges.txt. First draw of the gauges now defered until
        // the Ajax data is available as a 'speed up'.
        //
        init = function () {

            // Cumulus, Weather Display, VWS, WeatherCat?
            switch (config.weatherProgram) {
            case 0:
                _realtimeVer = 11;   //minimum version of the realtime JSON file required
                config.realTimeURL = config.realTimeURL_Cumulus;
                // the trend images to be used for the popup data, used in conjuction with config.imgPathURL
                // by default this is configured for the Cumulus 'standard' web site
                // ** If you specify one image in a sub-array, then you MUST provide images for all the other sub-elements
                config.tipImgs = [                                  // config.tipImgs for Cumulus users using the 'default' weather site
                    ['temp.png', 'intemp.png'],                     // Temperature: outdoor, indoor
                    // Temperature: dewpoint, apparent, windChill, heatIndex, humidex
                    ['temp.png', 'temp.png', 'temp.png', 'temp.png', 'temp.png'],
                    'raint.png',                                    // Rainfall
                    'rain.png',                                     // Rainfall rate
                    ['hum.png', 'hum.png'],                         // Humidity: outdoor, indoor
                    'press.png',                                    // Pressure
                    'wind.png',                                     // Wind speed
                    'windd.png',                                    // Wind direction
                    (config.showUvGauge ? 'uv.png' : null),         // UV
                    (config.showSolarGauge ? 'solar.png' : null),   // Solar rad
                    (config.showRoseGauge ? 'windd.png' : null)     // Wind direction for Wind Rose
                ];
                break;
            case 1:
                _realtimeVer = 10;   //minimum version of the realtime JSON file required
                config.realTimeURL = config.realTimeURL_WD;
                config.tipImgs = [                                      // config.tipImgs for Weather Display users with wxgraph
                    ['temp+hum_24hr.php', 'indoor_temp_24hr.php'],      // Temperature: outdoor, indoor
                    // Temperature: dewpnt, apparent, windChill, HeatIndx, humidex
                    ['temp+dew+hum_1hr.php', 'temp+dew+hum_1hr.php', 'temp+dew+hum_1hr.php', 'temp+dew+hum_1hr.php', 'temp+dew+hum_1hr.php'],
                    'rain_24hr.php',                                    // Rainfall
                    'rain_1hr.php',                                     // Rainfall rate
                    ['humidity_1hr.php', 'humidity_7days.php'],         // Humidity: outdoor, indoor
                    'baro_24hr.php',                                    // Pressure
                    'windgust_1hr.php',                                 // Wind speed
                    'winddir_24hr.php',                                 // Wind direction
                    (config.showUvGauge ? 'uv_24hr.php' : null),        // UV graph if UV sensor is present | =null if no UV sensor
                    (config.showSolarGauge ? 'solar_24hr.php' : null),  // Solar rad graph if Solar sensor is present | Solar =null if no Solar sensor
                    (config.showRoseGauge ? 'winddir_24hr.php' : null)  // Wind direction if Rose is enabled | =null if Rose is disabled
                ];
                break;
            case 2:
                _realtimeVer = 10;   //minimum version of the realtime JSON file required
                config.realTimeURL = config.realTimeURL_VWS;
                config.showRoseGauge = false; // no windrose data from VWS
                config.tipImgs = [                                  // config.tipImgs for VWS users
                    ['vws742.jpg', 'vws741.jpg'],                   // Temperature: outdoor, indoor
                    // Temperature: dewpnt, apparent, windChill, HeatIndx, humidex
                    ['vws757.jpg', 'vws762.jpg', 'vws754.jpg', 'vws756.jpg', null],
                    'vws744.jpg',                                   // Rainfall
                    'vws859.jpg',                                   // Rainfall rate
                    ['vws740.jpg', 'vws739.jpg'],                   // Humidity: outdoor, indoor
                    'vws758.jpg',                                   // Pressure
                    'vws737.jpg',                                   // Wind speed
                    'vws736.jpg',                                   // Wind direction
                    (config.showUvGauge ? 'vws752.jpg' : null),     // UV graph if UV sensor is present | =null if no UV sensor
                    (config.showSolarGauge ? 'vws753.jpg' : null),  // Solar rad graph if Solar sensor is present | Solar =null if no Solar sensor
                    (config.showRoseGauge ? 'vws736.jpg' : null)    // Wind direction if Rose is enabled | =null if Rose is disabled
                ];
                break;
            case 3:
                _realtimeVer = 12;   //minimum version of the realtime JSON file required
                config.realTimeURL = config.realTimeURL_WC;
                config.tipImgs = [                                       // config.tipImgs - WeatherCat users using the 'default' weather site
                    ['temperature1.jpg', 'tempin1.jpg'],                 // Temperature: outdoor, indoor
                    // Temperature: dewpoint, apparent, windChill, heatIndex, humidex
                    ['dewpoint1.jpg', 'temperature1.jpg', 'windchill1.jpg', 'heatindex1.jpg', 'temperature1.jpg'],
                    'precipitationc1.jpg',                               // Rainfall
                    'precipitation1.jpg',                                // Rainfall rate
                    ['rh1.jpg', 'rhin1.jpg'],                            // Humidity: outdoor, indoor
                    'pressure1.jpg',                                     // Pressure
                    'windspeed1.jpg',                                    // Wind speed
                    'winddirection1.jpg',                                // Wind direction
                    (config.showUvGauge ? 'uv1.jpg' : null),             // UV
                    (config.showSolarGauge ? 'solarrad1.jpg' : null),    // Solar rad
                    (config.showRoseGauge ? 'winddirection1.jpg' : null) // Wind direction for Wind Rose
                ];
                break;
            case 4:
                _realtimeVer = 10;   //minimum version of the realtime JSON file required
                config.realTimeURL = config.realTimeURL_MB;
                config.showPopupGraphs = false;        // config.tipImgs - no Meteobridge images available
                config.showRoseGauge = false;          // no windrose data from VWS
                config.tipImgs = null;                 // config.tipImgs - no Meteobridge images available
                break;
            default:
                _realtimeVer = 0;   //minimum version of the realtime JSON file required
                config.realtimeURL = null;
                config.showPopupGraphs = false;
                config.tipImgs = null;                     // config.tipImgs - unknown
            }

            // Set the language
            changeLang(strings);

            // Use smaller gauges when running on phone devices
            if (/iphone|ipad|ipod|android|blackberry|rim|mobile|mini|webos|windows\sce|palm/i.test(navigator.userAgent.toLowerCase())) {
                config.gaugeScaling = config.gaugeMobileScaling;
            } else {
                config.gaugeScaling = 1;
            }

            // Logo images to 'personalise' the gauge backgrounds
            // To add a logo to a gauge, add the parameter:
            //    params.customLayer = _imgSmall;
            // to the corresponding drawXxxx() function below.
            //
            // These are for demo only, to add them remove the comments around the following lines, and
            // the _imgBackground definition line above...
/*            _imgBackground = document.createElement('img');                 // small logo
            $(_imgBackground).attr('src', config.imgPathURL + 'logoSmall.png');
*/
            // End of logo images

            // define temperature gauge start values
            _temp.sections = createTempSections(true);
            _temp.areas = [];
            _temp.minValue = gauge.tempScaleDefMinC;
            _temp.maxValue = gauge.tempScaleDefMaxC;
            _temp.title = strings.temp_title_out;
            _temp.value = gauge.tempScaleDefMinC + 0.0001;
            _temp.maxMinVisible = false;
            _temp.selected = 'out';

            //define dew point gauge start values
            _dew.sections = createTempSections(true);
            _dew.areas = [];
            _dew.minValue = gauge.tempScaleDefMinC;
            _dew.maxValue = gauge.tempScaleDefMaxC;
            _dew.value = gauge.tempScaleDefMinC + 0.0001;
            // Has the end user selected a prefered 'scale' before
            _displayDewGauge = getCookie('dewGauge');
            // Set 'dewgauge' radio buttons to match prefered units
            if (_displayDewGauge !== null) {
                _dew.selected = _displayDewGauge;
            } else {
                _dew.selected = config.dewDisplayType;
            }
            setRadioCheck('rad_dew', _dew.selected);
            switch (_dew.selected) {
            case 'dew':
                _dew.title = strings.dew_title;
                _dew.image = 0;
                break;
            case 'app':
                _dew.title = strings.apptemp_title;
                _dew.image = 1;
                break;
            case 'wnd':
                _dew.title = strings.chill_title;
                _dew.image = 2;
                break;
            case 'hea':
                _dew.title = strings.heat_title;
                _dew.image = 3;
                break;
            case 'hum':
                _dew.title = strings.humdx_title;
                _dew.image = 4;
            }
            _dew.minMeasuredVisible = false;
            _dew.maxMeasuredVisible = false;

            // define rain gauge start values
            _rain.maxValue = 10;
            _rain.value = 0.0001;
            _rain.title = strings.rain_title;
            _rain.lcdDecimals = 1;
            _rain.scaleDecimals = 1;
            _rain.labelNumberFormat = gauge.labelFormat;
            _rain.sections = (gauge.rainUseSectionColours ? createRainfallSections(true) : []);
            _rain.valGrad = (gauge.rainUseGradientColours ? createRainfallGradient(true) : null);

            // define rain rate gauge start values
            _rrate.maxMeasured = 0;
            _rrate.maxValue = 10;
            _rrate.value = 0.0001;
            _rrate.title = strings.rrate_title;
            _rrate.lcdDecimals = 1;
            _rrate.scaleDecimals = 0;
            _rrate.labelNumberFormat = gauge.labelFormat;
            _rrate.sections = createRainRateSections(true);

            // define humidity gauge start values
            _hum.areas = [];
            _hum.value = 0.0001;
            _hum.title = strings.hum_title_out;
            _hum.selected = 'out';

            // define pressure/barometer gauge start values
            _baro.sections = [];
            _baro.areas = [];
            _baro.minValue = gauge.baroScaleDefMinhPa;
            _baro.maxValue = gauge.baroScaleDefMaxhPa;
            _baro.value = _baro.minValue + 0.0001;
            _baro.title = strings.baro_title;
            _baro.lcdDecimals = 1;
            _baro.scaleDecimals = 0;
            _baro.labelNumberFormat = gauge.labelFormat;

            // define wind gauge start values
            _wind.maxValue = gauge.windScaleDefMaxKph;
            _wind.areas = [];
            _wind.maxMeasured = 0;
            _wind.value = 0.0001;
            _wind.title = strings.wind_title;

            // define wind direction gauge start values
            _dir.valueLatest = 0;
            _dir.valueAverage = 0;
            _dir.titles = [strings.latest_web, strings.tenminavg_web];

            // define UV start values
            _uv.value = 0.0001;
            _uv.title = strings.uv_title;
            _uv.sections = [
                steelseries.Section(0, 2.9, '#289500'),
                steelseries.Section(2.9, 5.8, '#f7e400'),
                steelseries.Section(5.8, 7.8, '#f85900'),
                steelseries.Section(7.8, 10.9, '#d8001d'),
                steelseries.Section(10.9, 20, '#6b49c8')
            ];
			// Define value gradient for UV
			_uv.gradient = new steelseries.gradientWrapper(0, 16,
				[0, 0.1, 0.19, 0.31, 0.45, 0.625, 1],
				[
                    new steelseries.rgbaColor(0, 200, 0, 1),
                    new steelseries.rgbaColor(0, 200, 0, 1),
                    new steelseries.rgbaColor(255, 255, 0, 1),
                    new steelseries.rgbaColor(248, 89, 0, 1),
                    new steelseries.rgbaColor(255, 0, 0, 1),
                    new steelseries.rgbaColor(255, 0, 144, 1),
                    new steelseries.rgbaColor(153, 140, 255, 1)
				]
			);
            _uv.useSections = false;
			_uv.useValueGradient = true;

            // define Solar start values
            _solar.value = 0.0001;
            _solar.title = strings.solar_title;
            _solar.units = 'W/m²';
            _solar.sections = [
                steelseries.Section(0, 600, 'rgba(40,149,0,0.3)'),
                steelseries.Section(600, 800, 'rgba(248,89,0,0.3)'),
                steelseries.Section(800, 1000, 'rgba(216,0,29,0.3)'),
                steelseries.Section(1000, 1800, 'rgba(107,73,200,0.3)')
            ];
            _solar.lcdDecimals = 0;

            // define led indicator
            _led.on = false;
            _led.blink = false;
            _led.oldBlink = _led.blink;
            _led.title = strings.led_title;
            _led.colour = steelseries.LedColor.GREEN_LED;
            _led.oldColour = _led.colour;

            // set some default units
            // DO NOT CHANGE THESE - THE SCRIPT DEPENDS ON THESE DEFAULTS
            // the units actually displayed, will be read from the realtime.txt file, or from the users last visit

            // Get the display units the user last used when they visited before - if present
            _displayUnits = getCookie('units');
            // Set 'units' radio buttons to match prefered units
            if (_displayUnits !== null) {
                //User wants specific units
                _userUnitsSet = true;

                // temperature
                setRadioCheck('rad_unitsTemp', _displayUnits.temp);
                data.tempunit = '°' + _displayUnits.temp;
                // rain
                setRadioCheck('rad_unitsRain', _displayUnits.rain);
                data.rainunit = _displayUnits.rain;
                // pressure
                setRadioCheck('rad_unitsPress', _displayUnits.press);
                data.pressunit = _displayUnits.press;
                // wind
                setRadioCheck('rad_unitsWind', _displayUnits.wind);
                data.windunit = _displayUnits.wind;
                _displayUnits.windrun = getWindrunUnits(data.windunit);
            } else {
                // Set the defaults to metric )
                _displayUnits = {
                    temp: 'C',
                    rain: 'mm',
                    press: 'hPa',
                    wind: 'km/h',
                    windrun: 'km'
                };

                data.tempunit = '°C';
                data.rainunit = 'mm';
                data.pressunit = 'hPa';
                data.windunit = 'km/h';
            }

            // remove indoor temperature/humidity options?
            if (!config.showIndoorTempHum) {
                $('#rad_temp1').remove();
                $('#lab_temp1').remove();
                $('#rad_temp2').remove();
                $('#lab_temp2').remove();
                $('#rad_hum1').remove();
                $('#lab_hum1').remove();
                $('#rad_hum2').remove();
                $('#lab_hum2').remove();
            }

            // remove the UV gauge?
            if (!config.showUvGauge) {
                $('#canvas_uv').parent().remove();
            }

            // remove the Solar gauge?
            if (!config.showSolarGauge) {
                $('#canvas_solar').parent().remove();
            }

            // remove the Wind Rose?
            if (!config.showRoseGauge) {
                $('#canvas_rose').parent().remove();
                $('#rgraph_attrib').remove();
            }

            // enable popup data
            ddimgtooltip.showTips = config.showPopupData;

            if (config.showPopupGraphs) {
                // Note the number of array elements must match 'i' in ddimgtooltip.tiparray()
                ddimgtooltip.tiparray[0][0] = (config.tipImgs[0][0] !== null ? '' : null);
                ddimgtooltip.tiparray[1][0] = (config.tipImgs[1][0] !== null ? '' : null);
                ddimgtooltip.tiparray[2][0] = (config.tipImgs[2]    !== null ? '' : null);
                ddimgtooltip.tiparray[3][0] = (config.tipImgs[3]    !== null ? '' : null);
                ddimgtooltip.tiparray[4][0] = (config.tipImgs[4][0] !== null ? '' : null);
                ddimgtooltip.tiparray[5][0] = (config.tipImgs[5]    !== null ? '' : null);
                ddimgtooltip.tiparray[6][0] = (config.tipImgs[6]    !== null ? '' : null);
                ddimgtooltip.tiparray[7][0] = (config.tipImgs[7]    !== null ? '' : null);
                ddimgtooltip.tiparray[8][0] = (config.tipImgs[8]    !== null ? '' : null);
                ddimgtooltip.tiparray[9][0] = (config.tipImgs[9]    !== null ? '' : null);
                ddimgtooltip.tiparray[10][0] = (config.tipImgs[10]  !== null ? '' : null);
            }

            // draw the status gadgets first, they will display any errors in the intial setup
            drawLed();
            drawStatus();
            drawTimer();

            getRealtime();
        },

        //
        // drawXXXX functions perform the initial construction of the gauges
        //
        drawLed = function () {
            // create led indicator
            if ($('#canvas_led').length) {
                _gaugeLed = new steelseries.Led(
                    'canvas_led', {
                    ledColor : _led.colour,
                    size : $('#canvas_led').width()
                });
                if (_led.on) {
                    _gaugeLed.toggleLed();
                }
                $('#canvas_led').attr('title', _led.title);
            }
        },

        drawStatus = function () {
            // create forecast display
            if ($('#canvas_status').length) {
                _gaugeStatus = new steelseries.DisplaySingle(
                    'canvas_status', {
                    width             : $('#canvas_status').width(),
                    height            : $('#canvas_status').height(),
                    lcdColor          : gauge.lcdColour,
                    unitStringVisible : false,
                    value             : _statusStr,
                    digitalFont       : config.digitalForecast,
                    valuesNumeric     : false,
                    autoScroll        : true,
                    alwaysScroll      : false
                });
            }
        },

        drawTimer = function () {
            // create timer display
            if ($('#canvas_timer').length) {
                _gaugeTimer = new steelseries.DisplaySingle(
                    'canvas_timer', {
                    width             : $('#canvas_timer').width(),
                    height            : $('#canvas_timer').height(),
                    lcdColor          : gauge.lcdColour,
                    lcdDecimals       : 0,
                    unitString        : strings.timer,
                    unitStringVisible : true,
                    digitalFont       : config.digitalFont,
                    value             : _count
                });
            }
        },

        drawTemp = function () {
            var params = extend(commonParams);
            // create temperature radial gauge
            if ($('#canvas_temp').length) {
                params.size = Math.ceil($('#canvas_temp').width() * config.gaugeScaling);
                params.section = _temp.sections;
                params.area = _temp.areas;
                params.minValue = _temp.minValue;
                params.maxValue = _temp.maxValue;
                params.thresholdVisible = false;
                params.minMeasuredValueVisible = _temp.maxMinVisible;
                params.maxMeasuredValueVisible = _temp.maxMinVisible;
                params.titleString = _temp.title;
                params.unitString = data.tempunit;
                params.trendVisible = gauge.tempTrendVisible;
                //params.customLayer = _imgBackground;      // uncomment to add a background image - See Logo Images above

                _gaugeTemp = new steelseries.Radial('canvas_temp', params);
                _gaugeTemp.setValue(_temp.value);

                // over-ride CSS applied size?
                if (config.gaugeScaling !== 1) {
                    $('#canvas_temp').css({'width': params.size + 'px', 'height': params.size + 'px'});
                }

                // add a shadow to the gauge
                if (config.showGaugeShadow) {
                    $('#canvas_temp').css(gaugeShadow(params.size));
                }
            }
        },

        drawDew = function () {
            var params = extend(commonParams);
            // create dew point radial gauge
            if ($('#canvas_dew').length) {
                params.size = Math.ceil($('#canvas_dew').width() * config.gaugeScaling);
                params.section = _dew.sections;
                params.area = _dew.areas;
                params.minValue = _dew.minValue;
                params.maxValue = _dew.maxValue;
                params.thresholdVisible = false;
                params.titleString = _dew.title;
                params.unitString = data.tempunit;

                _gaugeDew = new steelseries.Radial('canvas_dew', params);
                _gaugeDew.setValue(_dew.value);

                // over-ride CSS applied size?
                if (config.gaugeScaling !== 1) {
                    $('#canvas_dew').css({'width': params.size + 'px', 'height': params.size + 'px'});
                }

                // add a shadow to the gauge
                if (config.showGaugeShadow) {
                    $('#canvas_dew').css(gaugeShadow(params.size));
                }
            }
        },

        drawRain = function () {
            var params = extend(commonParams);
            // create rain radial bargraph gauge
            if ($('#canvas_rain').length) {
                params.size = Math.ceil($('#canvas_rain').width() * config.gaugeScaling);
                params.maxValue = _rain.maxValue;
                params.thresholdVisible = false;
                params.titleString = _rain.title;
                params.unitString = data.rainunit;
                params.valueColor = steelseries.ColorDef.BLUE;
                params.valueGradient = _rain.valGrad;
                params.useValueGradient = gauge.rainUseGradientColours;
                params.useSectionColors = gauge.rainUseSectionColour;
                params.useSectionColors = gauge.rainUseSectionColours;
                params.labelNumberFormat = _rain.labelNumberFormat;
                params.fractionalScaleDecimals = _rain.scaleDecimals;

                _gaugeRain = new steelseries.RadialBargraph('canvas_rain', params);
                _gaugeRain.setValue(_rain.value);

                // over-ride CSS applied size?
                if (config.gaugeScaling !== 1) {
                    $('#canvas_rain').css({'width': params.size + 'px', 'height': params.size + 'px'});
                }

                // add a shadow to the gauge
                if (config.showGaugeShadow) {
                    $('#canvas_rain').css(gaugeShadow(params.size));
                }
            }
        },

        drawRRate = function () {
            var params = extend(commonParams);
            // create rain rate radial gauge
            if ($('#canvas_rrate').length) {
                params.size = Math.ceil($('#canvas_rrate').width() * config.gaugeScaling);
                params.section = _rrate.sections;
                params.maxValue = _rrate.maxValue;
                params.thresholdVisible = false;
                params.maxMeasuredValueVisible = true;
                params.titleString = _rrate.title;
                params.unitString = data.rainunit + '/h';
                params.lcdDecimals = _rrate.lcdDecimals;
                params.labelNumberFormat = _rrate.labelNumberFormat;
                params.fractionalScaleDecimals = _rrate.scaleDecimals;
                params.niceScale = false;

                _gaugeRRate = new steelseries.Radial('canvas_rrate', params);
                _gaugeRRate.setMaxMeasuredValue(_rrate.maxMeasured);
                _gaugeRRate.setValue(_rrate.value);

                // over-ride CSS applied size?
                if (config.gaugeScaling !== 1) {
                    $('#canvas_rrate').css({'width': params.size + 'px', 'height': params.size + 'px'});
                }

                // add a shadow to the gauge
                if (config.showGaugeShadow) {
                    $('#canvas_rrate').css(gaugeShadow(params.size));
                }
            }
        },

        drawHum = function () {
            var params = extend(commonParams);
            // create humidity radial gauge
            if ($('#canvas_hum').length) {
                params.size = Math.ceil($('#canvas_hum').width() * config.gaugeScaling);
                params.section = [steelseries.Section(0, 20, 'rgba(255,255,0,0.3)'),
                                  steelseries.Section(20, 80, 'rgba(0,255,0,0.3)'),
                                  steelseries.Section(80, 100, 'rgba(255,0,0,0.3)')];
                params.area = _hum.areas;
                params.maxValue = 100;
                params.thresholdVisible = false;
                params.titleString = _hum.title;
                params.unitString = '%';

                _gaugeHum = new steelseries.Radial('canvas_hum', params);
                _gaugeHum.setValue(_hum.value);

                // over-ride CSS applied size?
                if (config.gaugeScaling !== 1) {
                    $('#canvas_hum').css({'width': params.size + 'px', 'height': params.size + 'px'});
                }

                // add a shadow to the gauge
                if (config.showGaugeShadow) {
                    $('#canvas_hum').css(gaugeShadow(params.size));
                }
            }
        },

        drawBaro = function () {
            var params = extend(commonParams);
            // create pressure/barometric radial gauge
            if ($('#canvas_baro').length) {
                params.size = Math.ceil($('#canvas_baro').width() * config.gaugeScaling);
                params.section = _baro.sections;
                params.area = _baro.areas;
                params.minValue = _baro.minValue;
                params.maxValue = _baro.maxValue;
                params.niceScale = false;
                params.thresholdVisible = false;
                params.titleString = _baro.title;
                params.unitString = data.pressunit;
                params.lcdDecimals = _baro.lcdDecimals;
                params.trendVisible = gauge.pressureTrendVisible;
                params.labelNumberFormat = _baro.labelNumberFormat;
                params.fractionalScaleDecimals = _baro.scaleDecimals;

                _gaugeBaro = new steelseries.Radial('canvas_baro', params);
                _gaugeBaro.setValue(_baro.value);

                // over-ride CSS applied size?
                if (config.gaugeScaling !== 1) {
                    $('#canvas_baro').css({'width': params.size + 'px', 'height': params.size + 'px'});
                }

                // add a shadow to the gauge
                if (config.showGaugeShadow) {
                    $('#canvas_baro').css(gaugeShadow(params.size));
                }
            }
        },

        drawWind = function () {
            var params = extend(commonParams);
            // create wind speed radial gauge
            if ($('#canvas_wind').length) {
                params.size = Math.ceil($('#canvas_wind').width() * config.gaugeScaling);
                params.area = _wind.areas;
                params.maxValue = _wind.maxValue;
                params.niceScale = false;
                params.thresholdVisible = false;
                params.maxMeasuredValueVisible = true;
                params.titleString = _wind.title;
                params.unitString = data.windunit;

                _gaugeWind = new steelseries.Radial('canvas_wind', params);
                _gaugeWind.setMaxMeasuredValue(_wind.maxMeasured);
                _gaugeWind.setValue(_wind.value);

                // over-ride CSS applied size?
                if (config.gaugeScaling !== 1) {
                    $('#canvas_wind').css({'width': params.size + 'px', 'height': params.size + 'px'});
                }

                // add a shadow to the gauge
                if (config.showGaugeShadow) {
                    $('#canvas_wind').css(gaugeShadow(params.size));
                }
            }
        },

        drawDir = function () {
            var params = extend(commonParams);
            // create wind direction/compass radial gauge
            if ($('#canvas_dir').length) {
                params.size = Math.ceil($('#canvas_dir').width() * config.gaugeScaling);
                params.pointerTypeLatest = gauge.pointer; // default TYPE1,
                params.pointerTypeAverage = steelseries.PointerType.TYPE8; // default TYPE8
                params.pointerColorAverage = steelseries.ColorDef.BLUE;
                params.degreeScale = true;             // Show degree scale rather than ordinal directions
                params.pointSymbols = strings.compass;
                params.roseVisible = false;
                params.lcdTitleStrings = _dir.titles;
                params.useColorLabels = false;

                _gaugeDir = new steelseries.WindDirection('canvas_dir', params);
                _gaugeDir.setValueAverage(+_dir.valueAverage);
                _gaugeDir.setValueLatest(+_dir.valueLatest);

                // over-ride CSS applied size?
                if (config.gaugeScaling !== 1) {
                    $('#canvas_dir').css({'width': params.size + 'px', 'height': params.size + 'px'});
                }

                // add a shadow to the gauge
                if (config.showGaugeShadow) {
                    $('#canvas_dir').css(gaugeShadow(params.size));
                }
            }
        },

        drawWindRose = function () {
            var size;
            if (windRose !== "undefined") {
                size = Math.ceil($('#canvas_rose').width() * config.gaugeScaling);
                windRose.init(size, config.showRoseGaugeOdo);
                windRose.setTitle(strings.windrose);
                windRose.setCompassString(strings.compass);

                // over-ride CSS applied size?
                if (config.gaugeScaling !== 1) {
                    $('#canvas_rose').css({'width': size + 'px', 'height': size + 'px'});
                }
            }
        },

        drawUV = function () {
            var params = extend(commonParams);
            // create UV bargraph gauge
            if ($('#canvas_uv').length) {
                params.size = Math.ceil($('#canvas_uv').width() * config.gaugeScaling);
                params.gaugeType = steelseries.GaugeType.TYPE3;
                params.maxValue = gauge.uvScaleDefMax;
                params.titleString = _uv.title;
                params.niceScale = false;
                params.section = _uv.sections;
                params.useSectionColors = _uv.useSections;
				params.valueGradient = _uv.gradient;
				params.useValueGradient = _uv.useValueGradient;
                params.lcdDecimals = gauge.uvLcdDecimals;

                _gaugeUV = new steelseries.RadialBargraph('canvas_uv', params);
                _gaugeUV.setValue(_uv.value);

                // over-ride CSS applied size?
                if (config.gaugeScaling !== 1) {
                    $('#canvas_uv').css({'width': params.size + 'px', 'height': params.size + 'px'});
                }

                // add a shadow to the gauge
                if (config.showGaugeShadow) {
                    $('#canvas_uv').css(gaugeShadow(params.size));
                }
            }
        },

        drawSolar = function () {
            var params = extend(commonParams);
            // create Solar gauge
            if ($('#canvas_solar').length) {
                params.size = Math.ceil($('#canvas_solar').width() * config.gaugeScaling);
                params.section = _solar.sections;
                params.maxValue = gauge.solarGaugeScaleMax;
                params.titleString = _solar.title;
                params.unitString = _solar.units;
                params.niceScale = false;
                params.thresholdVisible = false;
                params.lcdDecimals = _solar.lcdDecimals;

                _gaugeSolar = new steelseries.Radial('canvas_solar', params);
                _gaugeSolar.setValue(_solar.value);

                // over-ride CSS applied size?
                if (config.gaugeScaling !== 1) {
                    $('#canvas_solar').css({'width': params.size + 'px', 'height': params.size + 'px'});
                }

                // add a shadow to the gauge
                if (config.showGaugeShadow) {
                    $('#canvas_solar').css(gaugeShadow(params.size));
                }
            }
        },

        //
        // doUpdate() called to update all the gauges with fresh data, then start the timer for the next update
        //
        doUpdate = function () {
            // first time only, setup units etc
            if (_firstRun) {
                doFirst();
            }

            if (_refreshGraphs) {
                _cacheDefeat = '?' + (new Date()).getTime().toString();
            }
            if (_gaugeTemp) {
                doTemp();
            }
            if (_gaugeDew) {
                doDew();
            }
            if (_gaugeBaro) {
                doBaro();
            }
            if (_gaugeRain) {
                doRain();
            }
            if (_gaugeRRate) {
                doRRate();
            }
            if (_gaugeHum) {
                doHum();
            }
            if (_gaugeWind) {
                doWind();
            }
            if (_gaugeDir) {
                doDir();
            }
            if (_gaugeUV) {
                doUV();
            }
            if (_gaugeSolar) {
                doSolar();
            }
            if (config.showRoseGauge && typeof windRose !== "undefined") {
                doRose();
            }
            if (_refreshGraphs) {
                _refreshGraphs = false;
            }

            if (_firstRun && config.showPopupData && config.showPopupGraphs) {
                // now download the trend images
                // - has to be done here as doFirst may remove elements from the page
                // - and we delay the download of the images speeding up page display
                //
                $('#imgtip0_img').attr('src', config.imgPathURL + config.tipImgs[0][0] + _cacheDefeat);
                $('#imgtip1_img').attr('src', config.imgPathURL + config.tipImgs[1][_dew.image] + _cacheDefeat);
                $('#imgtip2_img').attr('src', config.imgPathURL + config.tipImgs[2] + _cacheDefeat);
                $('#imgtip3_img').attr('src', config.imgPathURL + config.tipImgs[3] + _cacheDefeat);
                $('#imgtip4_img').attr('src', config.imgPathURL + config.tipImgs[4][0] + _cacheDefeat);
                $('#imgtip5_img').attr('src', config.imgPathURL + config.tipImgs[5] + _cacheDefeat);
                $('#imgtip6_img').attr('src', config.imgPathURL + config.tipImgs[6] + _cacheDefeat);
                $('#imgtip7_img').attr('src', config.imgPathURL + config.tipImgs[7] + _cacheDefeat);
                $('#imgtip8_img').attr('src', config.imgPathURL + config.tipImgs[8] + _cacheDefeat);
                $('#imgtip9_img').attr('src', config.imgPathURL + config.tipImgs[9] + _cacheDefeat);
                $('#imgtip10_img').attr('src', config.imgPathURL + config.tipImgs[10] + _cacheDefeat);
                // kick off a timer for popup graphic updates
                setInterval(function () {
                        _refreshGraphs = true;
                    },
                    config.graphUpdateTime * 60 * 1000);

            }
            if (_firstRun) {
                _firstRun = false;
            }
            _count = config.counter;
            countDown();
        },

        //
        // getRealtime() fetches the realtimegauges.txt file from the server
        //
        getRealtime = function () {
            setStatus(strings.StatusMsg);
            _count = 11; // 10 seconds timeout
            countDown();
            $.ajax({url: config.realTimeURL,
                    dataType: 'text',
                    cache: false,
                    success: checkRtResp,
                    error: checkRtError,
                    timeout: 10000
            });
        },

        //
        // checkRtResp() called by the Ajax fetch once data has been downloaded
        //
        checkRtResp = function (response, status, xhr) {
            countDown(true);
            response = response.replace(/[\r\n]/g, ''); // remove any new line characters
            _httpError = 0;
            processData(response);
        },

        //
        // checkRtError() called by the Ajax fetch if an error occurs during the fetching realtimegauges.txt
        //
        checkRtError = function (xhr, status, error) {
            // Clear any existing download timer
            clearTimeout(_countDownTimer);
            setLed(false, strings.led_title_unknown);
            _httpError = status + ': ' + error;
            _count = 11; // 10 seconds
            countDown();
        },

        //
        // processData() massages the data returned in realtimegauges.txt, and calls doUpdate() to update the page
        //
        processData = function (dataStr) {
            var str, dt, tm, today, now, then, tmp, elapsedMins;
            // get the realtime fields into a handy 'data' object
            try {
                data = JSON.parse(dataStr);
            } catch (e) {
                // JSON parse bombs if the file is zero length,
                // so start a quickish retry...
                setStatus(strings.realtimeCorrupt);
                _count = 3; // 2 seconds
                countDown();
                return;
            }
            // and check we have the expected number
            if (data.ver !== undefined && data.ver >= _realtimeVer) {
                // OK, we have the expected number of data fields

                //Check WeatherCat version >=1.2 required
                if (config.weatherProgram === 3) {
                    // first split the WC version string "VN.NN, Build XXX
                    data.build = data.version.match(/[\d]+$/)[0];
                    data.version = data.version.match(/[\d.]+/)[0];
                    if (+data.version < 1.2) {
                        alert('Version of WeatherCat must be 1.2 or later to use these gauges!');
                        return;
                    }
                }
                // mainpulate the last rain time into something more friendly
                try {
                    str = data.LastRainTipISO.split(' ');
                    dt = str[0].replace(/\//g, '-').split('-');  // WD uses dd/mm/yyyy :(
                    tm = str[1].split(':');
                    today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (data.dateFormat === undefined) {
                        data.dateFormat = 'y/m/d';
                    } else {
                        // frig for WD bug which leaves a trailing % character from the tag
                        data.dateFormat = data.dateFormat.replace('%', '');
                    }
                    if (data.dateFormat === 'y/m/d') {
                        // ISO/Cumulus format
                        then = new Date(dt[0], dt[1] - 1, dt[2], tm[0], tm[1], 0, 0);
                    } else if (data.dateFormat === 'd/m/y') {
                        then = new Date(dt[2], dt[1] - 1, dt[0], tm[0], tm[1], 0, 0);
                    } else { // m/d/y
                        then = new Date(dt[2], dt[0] - 1, dt[1], tm[0], tm[1], 0, 0);
                    }
                    if (then.getTime() >= today.getTime()) {
                        data.LastRained = strings.LastRainedT_info + ' ' + str[1];
                    } else if (then.getTime() + 86400000 >= today.getTime()) {
                        data.LastRained = strings.LastRainedY_info + ' ' + str[1];
                    } else {
                        data.LastRained = then.getDate().toString() + ' ' + strings.months[then.getMonth()] + ' ' + strings.at + ' ' + str[1];
                    }
                } catch (e) {
                    data.LastRained = data.LastRainTipISO;
                }
                if (data.tempunit.length > 1) {
                    // clean up temperature units - remove html encoded degree symbols
                    data.tempunit = data.tempunit.replace(/&\S*;/, '°');  // old Cumulus versions uses &deg;, WeatherCat uses &#176;
                } else {
                    // using new realtimegaugesT.txt with Cumulus > 1.9.2
                    data.tempunit = '°' + data.tempunit;
                }

                // Check for station off-line
                now = new Date();
                tmp = data.timeUTC.split(',');
                _sampleDate = Date.UTC(tmp[0], tmp[1] - 1, tmp[2], tmp[3], tmp[4], tmp[5]);
                if (now - _sampleDate > config.stationTimeout * 60 * 1000) {
                    elapsedMins = Math.floor((now - _sampleDate) / (1000 * 60));
                    // the realtimegauges.txt file isn't being updated
                    _led.colour = steelseries.LedColor.RED_LED;
                    _led.title = strings.led_title_offline;
                    _led.blink = true;
                    if (elapsedMins < 120) {
                        // up to 2 hours ago
                        tm = elapsedMins.toString() + ' ' + strings.StatusMinsAgo;
                    } else if (elapsedMins < 2 * 24 * 60) {
                        // up to 48 hours ago
                        tm = Math.floor(elapsedMins / 60).toString() + ' ' + strings.StatusHoursAgo;
                    } else {
                        // days ago!
                        tm = Math.floor(elapsedMins / (60 * 24)).toString() + ' ' + strings.StatusDaysAgo;
                    }
                    data.forecast = strings.led_title_offline + ' ' + strings.StatusLastUpdate + ' ' + tm;
                } else if (+data.SensorContactLost === 1) {
                    // Fine Offset sensor status
                    _led.colour = steelseries.LedColor.RED_LED;
                    _led.title = strings.led_title_lost;
                    _led.blink = true;
                    data.forecast = strings.led_title_lost;
                } else {
                    _led.colour = steelseries.LedColor.GREEN_LED;
                    _led.title = strings.led_title_ok + '. ' + strings.StatusLastUpdate + ': ' + data.date;
                    _led.blink = false;
                }

                // de-encode the forecast string if required (Cumulus support for extended characters)
                data.forecast = $('<div/>').html(data.forecast).text();
                data.forecast.trim();

                if (data.pressunit === 'in') {  // Cumulus pressunit tag value
                    data.pressunit = 'inHg';
                }

                data.windunit = data.windunit.toLowerCase(); // WeatherCat sends "MPH"
                if (data.windunit === 'knots') {             // WeatherCat sends "Knots", we use "kts"
                    data.windunit = 'kts';
                }
                if (data.windunit === 'kmh') {  // WD wind unit omits '/'
                    data.windunit = 'km/h';
                }

                // Temperature data conversion for display required?
                if (data.tempunit[1] !== _displayUnits.temp && _userUnitsSet) {
                    // temp needs converting
                    if (data.tempunit[1] === 'C') {
                        convTempData(c2f);
                    } else {
                        convTempData(f2c);
                    }
                } else if (_firstRun) {
                    _displayUnits.temp = data.tempunit[1];
                    setRadioCheck('rad_unitsTemp', _displayUnits.temp);
                }

                // Rain data conversion for display required?
                if (data.rainunit !== _displayUnits.rain && _userUnitsSet) {
                    // rain needs converting
                    convRainData(_displayUnits.rain === 'mm' ? in2mm : mm2in);
                } else if (_firstRun) {
                    _displayUnits.rain = data.rainunit;
                    setRadioCheck('rad_unitsRain', _displayUnits.rain);
                }

                // Wind data conversion for display required?
                if (data.windunit !== _displayUnits.wind && _userUnitsSet) {
                    // rain needs converting
                    convWindData(data.windunit, _displayUnits.wind);
                } else if (_firstRun) {
                    _displayUnits.wind = data.windunit;
                    _displayUnits.windrun = getWindrunUnits(data.windunit);
                    setRadioCheck('rad_unitsWind', _displayUnits.wind);
                }

                // Pressure data conversion for display required?
                if (data.pressunit !== _displayUnits.press && _userUnitsSet) {
                    convBaroData(data.pressunit, _displayUnits.press);
                } else if (_firstRun) {
                    _displayUnits.press = data.pressunit;
                    setRadioCheck('rad_unitsPress', _displayUnits.press);
                }

                setLed(true, _led.title);
                setStatus(data.forecast);
                doUpdate();

            } else {
                // set an error message
                if (data.ver < _realtimeVer) {
                    _gaugeTimer.setValue(0);
                    setStatus('Your ' + config.realTimeURL.substr(config.realTimeURL.lastIndexOf('/') + 1) + ' file template needs updating!');
                    return;
                } else {
                    // oh-oh! The number of data fields isn't what we expected
                    setStatus(strings.realtimeCorrupt);
                }
                setLed(false, strings.led_title_unknown);
                _count = 4; // 3 second retry
                countDown();
            }
        },

        //
        // setStatus() applies the supplied string to the status LCD display
        //
        setStatus = function (str) {
            _statusStr = str;
            if (_gaugeStatus) {
                _gaugeStatus.setValue(str);
            }
        },

        //
        // setLed() sets the warning LED state and popup text
        //
        setLed = function (onOff, title) {
            _led.title = title || _led.title;
            if (_gaugeLed) {
                _gaugeLed.setLedOnOff(onOff);
                if ($('#canvas_led').length) {
                    $('#canvas_led').attr('title', _led.title);
                }
                if (_led.colour !== _led.oldColour) {
                    _gaugeLed.setLedColor(_led.colour);
                    _led.oldColour = _led.colour;
                }
                if (_led.blink !== _led.oldBlink) {
                    _gaugeLed.blink(_led.blink);
                    _led.oldBlink = _led.blink;
                }
            }
        },

        //
        // countDown() updates the countdown LCD display, and if the count reaches zero fires off a new Ajax update
        //
        countDown = function (stop) {
            if (stop !== undefined && stop) {
                clearTimeout(_countDownTimer);
                _count = 0;
                _gaugeTimer.setValue(_count);
                return;
            }
            // has the page update limit been reached - and no password supplied
            var now = new Date();
            if (stop === false) {
                // we are being called from the LED onClick event, so reset the time the page was loaded
                _pageLoaded = now;
            }
            if (config.pageUpdateLimit > 0 &&
                now > _pageLoaded.getTime() + config.pageUpdateLimit * 60000 &&
                _pageUpdateParam !== config.pageUpdatePswd)
            {
                setStatus(strings.StatusPageLimit);
                _led.colour = steelseries.LedColor.RED_LED;
                _led.title = strings.StatusPageLimit;
                _led.blink = true;
                setLed(true);
                _count = 1;
                _gaugeTimer.setValue(0);
                // set an onclick event on the LED to restart
                $('#canvas_led').click(function () {
                        // refresh the page data
                        gauges.countDown(false);
                        // and disable the onClick event again
                        $('#canvas_led').off('click');
                    }
                );
                // and stop
                return;
            }
            _count -= 1;
            if (_gaugeTimer) {
                _gaugeTimer.setValue(_count);
            }
            if (_count === 0) {
                getRealtime();
                _count = config.counter;
            } else {
                _countDownTimer = setTimeout(countDown, 1000);
                if (_httpError !== 0) {
                    setStatus(strings.StatusHttp + ' - ' + _httpError + ' - ' + strings.StatusRetryIn);
                }
            }
        },

        //
        // doXXXXX() functions update each relevant gauge with the latest information
        //
        doTemp = function (radio) {
            // if rad isn't specified, just use existing value
            var sel = (radio === undefined ? _temp.selected : radio.value),
                popupImg, t1,
                scaleStep, tip;

            if (sel === 'out') {
                _temp.minValue = data.tempunit[1] === 'C' ? gauge.tempScaleDefMinC : gauge.tempScaleDefMinF;
                _temp.maxValue = data.tempunit[1] === 'C' ? gauge.tempScaleDefMaxC : gauge.tempScaleDefMaxF;
                _temp.low = extractDecimal(data.tempTL);
                _temp.lowScale = getMinTemp();
                _temp.high = extractDecimal(data.tempTH);
                _temp.highScale = getMaxTemp();
                _temp.value = extractDecimal(data.temp);
                _temp.title = strings.temp_title_out;
                _temp.loc = strings.temp_out_info;
                popupImg = 0;
                _temp.trendVal =  extractDecimal(data.temptrend);
                if (gauge.tempTrendVisible) {
                    t1 = tempTrend(+_temp.trendVal, data.tempunit, false);
                    if (t1 > 0) {
                        _temp.trend = steelseries.TrendState.UP;
                    } else if (t1 < 0) {
                        _temp.trend = steelseries.TrendState.DOWN;
                    } else {
                        _temp.trend = steelseries.TrendState.STEADY;
                    }
                }
            } else {
                _temp.low = extractDecimal(data.intemp);
                _temp.lowScale = _temp.low;
                _temp.high = _temp.low;
                _temp.highScale = _temp.low;
                _temp.value = _temp.low;
                _temp.title = strings.temp_title_in;
                _temp.loc = strings.temp_in_info;
                popupImg = 1;
                _temp.maxMinVisible = false;
                if (gauge.tempTrendVisible) {
                    _temp.trend = steelseries.TrendState.OFF;
                }
            }

            // has the gauge type changed?
            if (_temp.selected !== sel) {
                _temp.selected = sel;
                //Change gauge title
                _gaugeTemp.setTitleString(_temp.title);
                _gaugeTemp.setMaxMeasuredValueVisible(_temp.maxMinVisible);
                _gaugeTemp.setMinMeasuredValueVisible(_temp.maxMinVisible);
                if (config.showPopupGraphs && config.tipImgs[0][0] !== null) {
                    $('#imgtip0_img').attr('src', config.imgPathURL + config.tipImgs[0][popupImg] + _cacheDefeat);
                }
            }

            //auto scale the ranges
            scaleStep = data.tempunit[1] === 'C' ? 10 : 20;
            while (_temp.lowScale < _temp.minValue) {
                _temp.minValue -= scaleStep;
                if (_temp.highScale <= _temp.maxValue - scaleStep) {
                    _temp.maxValue -= scaleStep;
                }
            }
            while (_temp.highScale > _temp.maxValue) {
                _temp.maxValue += scaleStep;
                if (_temp.minValue >= _temp.minValue + scaleStep) {
                    _temp.minValue += scaleStep;
                }
            }

            if (_temp.minValue !== _gaugeTemp.getMinValue() || _temp.maxValue !== _gaugeTemp.getMaxValue()) {
                _gaugeTemp.setMinValue(_temp.minValue);
                _gaugeTemp.setMaxValue(_temp.maxValue);
                _gaugeTemp.setValue(_temp.minValue);
            }
            if (_temp.selected === 'out') {
                _temp.areas = [steelseries.Section(+_temp.low, +_temp.high, gauge.minMaxArea)];
            } else {
                _temp.areas = [];
            }

            if (gauge.tempTrendVisible) {
                _gaugeTemp.setTrend(_temp.trend);
            }
            _gaugeTemp.setArea(_temp.areas);
            _gaugeTemp.setValueAnimated(+_temp.value);

            if (ddimgtooltip.showTips) {
                // update tooltip
                if (_temp.selected === 'out') {
                    tip = _temp.loc + ' - ' + strings.lowestF_info + ': ' + _temp.low + data.tempunit + ' ' + strings.at + ' ' + data.TtempTL +
                         ' | ' +
                         strings.highestF_info + ': ' + _temp.high + data.tempunit + ' ' + strings.at + ' ' + data.TtempTH +
                         '<br>' +
                         strings.temp_trend_info + ': ' + tempTrend(_temp.trendVal, data.tempunit, true) + ' ' + _temp.trendVal + data.tempunit + '/h';
                } else {
                    tip = _temp.loc + ': ' + data.intemp + data.tempunit;
                }
                $('#imgtip0_txt').html(tip);
                if (_refreshGraphs && config.showPopupGraphs && config.tipImgs[0][0] !== null) {
                    $('#imgtip0_img').attr('src', config.imgPathURL + config.tipImgs[0][_temp.selected === 'out' ? 0 : 1] + _cacheDefeat);
                }
            }
        },

        doDew = function (radio) {
            var tip,
                // if rad isn't specified, just use existing value
                sel = (radio === undefined ? _dew.selected : radio.value),
                popupImg, scaleStep;

            _dew.lowScale = getMinTemp();
            _dew.highScale = getMaxTemp();

            switch (sel) {
            case 'dew': // dew point
                _dew.low = extractDecimal(data.dewpointTL);
                _dew.high = extractDecimal(data.dewpointTH);
                _dew.value = extractDecimal(data.dew);
                _dew.areas = [steelseries.Section(+_dew.low, +_dew.high, gauge.minMaxArea)];
                _dew.title = strings.dew_title;
                _dew.minMeasuredVisible = false;
                _dew.maxMeasuredVisible = false;
                popupImg = 0;
                tip = strings.dew_info + ':' +
                     '<br>' +
                     '- ' + strings.lowest_info + ': ' + _dew.low + data.tempunit + ' ' + strings.at + ' ' + data.TdewpointTL +
                     ' | ' + strings.highest_info + ': ' + _dew.high + data.tempunit + ' ' + strings.at + ' ' + data.TdewpointTH;
                break;
            case 'app': // apparent temperature
                _dew.low = extractDecimal(data.apptempTL);
                _dew.high = extractDecimal(data.apptempTH);
                _dew.value = extractDecimal(data.apptemp);
                _dew.areas = [steelseries.Section(+_dew.low, +_dew.high, gauge.minMaxArea)];
                _dew.title = strings.apptemp_title;
                _dew.minMeasuredVisible = false;
                _dew.maxMeasuredVisible = false;
                popupImg = 1;
                tip = tip = strings.apptemp_info + ':' +
                     '<br>' +
                     '- ' + strings.lowestF_info + ': ' + _dew.low + data.tempunit + ' ' + strings.at + ' ' + data.TapptempTL +
                     ' | ' + strings.highestF_info + ': ' + _dew.high + data.tempunit + ' ' + strings.at + ' ' + data.TapptempTH;
                break;
            case 'wnd': // wind chill
                _dew.low = extractDecimal(data.wchillTL);
                _dew.high = extractDecimal(data.wchill);
                _dew.value = extractDecimal(data.wchill);
                _dew.areas = [];
                _dew.title = strings.chill_title;
                _dew.minMeasuredVisible = true;
                _dew.maxMeasuredVisible = false;
                popupImg = 2;
                tip = strings.chill_info + ':' +
                    '<br>' +
                    '- ' + strings.lowest_info + ': ' + _dew.low + data.tempunit + ' ' + strings.at + ' ' + data.TwchillTL;
                break;
            case 'hea': // heat index
                _dew.low = extractDecimal(data.heatindex);
                _dew.high = extractDecimal(data.heatindexTH);
                _dew.value = extractDecimal(data.heatindex);
                _dew.areas = [];
                _dew.title = strings.heat_title;
                _dew.minMeasuredVisible = false;
                _dew.maxMeasuredVisible = true;
                popupImg = 3;
                tip = strings.heat_info + ':' +
                    '<br>' +
                    '- ' + strings.highest_info + ': ' + _dew.high + data.tempunit + ' ' + strings.at + ' ' + data.TheatindexTH;
                break;
            case 'hum': // humidex
                _dew.low = extractDecimal(data.humidex);
                _dew.high = extractDecimal(data.humidex);
                _dew.value = extractDecimal(data.humidex);
                _dew.areas = [];
                _dew.title = strings.humdx_title;
                _dew.minMeasuredVisible = false;
                _dew.maxMeasuredVisible = false;
                popupImg = 4;
                tip = strings.humdx_info + ': ' + _dew.value + data.tempunit;
                break;
            }

            if (_dew.selected !== sel) {
                _dew.selected = sel;
                // change gauge title
                _gaugeDew.setTitleString(_dew.title);
                // and graph image
                if (config.showPopupGraphs && config.tipImgs[1][0] !== null) {
                    $('#imgtip1_img').attr('src', config.imgPathURL + config.tipImgs[1][popupImg] + _cacheDefeat);
                }
                // save the choice in a cookie
                setCookie('dewGauge', sel);
            }

            //auto scale the ranges
            scaleStep = data.tempunit[1] === 'C' ? 10 : 20;
            while (_dew.lowScale < _dew.minValue) {
                _dew.minValue -= scaleStep;
                if (_dew.highScale <= _dew.maxValue - scaleStep) {
                    _dew.maxValue -= scaleStep;
                }
            }
            while (_dew.highScale > _dew.maxValue) {
                _dew.maxValue += scaleStep;
                if (_dew.minValue >= _dew.minValue + scaleStep) {
                    _dew.minValue += scaleStep;
                }
            }

            if (_dew.minValue !== _gaugeDew.getMinValue() || _dew.maxValue !== _gaugeDew.getMaxValue()) {
                _gaugeDew.setMinValue(_dew.minValue);
                _gaugeDew.setMaxValue(_dew.maxValue);
                _gaugeDew.setValue(_dew.minValue);
            }
            _gaugeDew.setMinMeasuredValueVisible(_dew.minMeasuredVisible);
            _gaugeDew.setMaxMeasuredValueVisible(_dew.maxMeasuredVisible);
            _gaugeDew.setMinMeasuredValue(+_dew.low);
            _gaugeDew.setMaxMeasuredValue(+_dew.high);
            _gaugeDew.setArea(_dew.areas);
            _gaugeDew.setValueAnimated(+_dew.value);

            if (ddimgtooltip.showTips) {
                // update tooltip
                $('#imgtip1_txt').html(tip);
                if (_refreshGraphs && config.showPopupGraphs && config.tipImgs[1][popupImg] !== null) {
                    $('#imgtip1_img').attr('src', config.imgPathURL + config.tipImgs[1][popupImg] + _cacheDefeat);
                }
            }
        },

        doRain = function () {
            _rain.value = extractDecimal(data.rfall);

            if (data.rainunit === 'mm') { // 10, 20, 30...
                _rain.maxValue = Math.max(Math.ceil(_rain.value / 10) * 10, 10);
            } else {
                // inches 0.5, 1.0, 2.0, 3.0 ... 10.0, 12.0, 14.0
                if (_rain.value <= 0.5) {
					_rain.maxValue = 0.5;
                } else if (_rain.value < 6) {
                    _rain.maxValue = Math.max(Math.ceil(_rain.value), 0.5);
                } else {
                    _rain.maxValue = Math.ceil(_rain.value / 2) * 2;
                }
                _rain.scaleDecimals = _rain.maxValue < 1 ? 2 : 1;
            }

            if (_rain.maxValue !== _gaugeRain.getMaxValue()) {
                _gaugeRain.setValue(0);
                _gaugeRain.setFractionalScaleDecimals(_rain.scaleDecimals);
                _gaugeRain.setMaxValue(_rain.maxValue);
            }

            _gaugeRain.setValueAnimated(_rain.value);

            if (ddimgtooltip.showTips) {
                // update tooltip
                $('#imgtip2_txt').html(strings.LastRain_info + ': ' + data.LastRained);
                if (_refreshGraphs && config.showPopupGraphs && config.tipImgs[2] !== null) {
                    $('#imgtip2_img').attr('src', config.imgPathURL + config.tipImgs[2] + _cacheDefeat);
                }
            }
        },

        doRRate = function () {
            var tip;

            _rrate.value = extractDecimal(data.rrate);
            _rrate.maxMeasured = extractDecimal(data.rrateTM);
            _rrate.overallMax = Math.max(_rrate.maxMeasured, _rrate.value);  // workaround for VWS bug, not supplying correct max value today

            if (data.rainunit === 'mm') { // 10, 20, 30...
                _rrate.maxValue = Math.max(Math.ceil(_rrate.overallMax / 10) * 10, 10);
            } else {
                // inches 0.5, 1.0, 2.0, 3.0 ...
                if (_rrate.overallMax <= 0.5) {
					_rrate.maxValue = 0.5;
                } else {
					_rrate.maxValue = Math.ceil(_rrate.overallMax);
				}
                _rrate.scaleDecimals = _rrate.maxValue < 1 ? 2 : (_rrate.maxValue < 7 ? 1 : 0);
            }

            if (_rrate.maxValue !== _gaugeRRate.getMaxValue()) {
                _gaugeRRate.setValue(0);
                _gaugeRRate.setFractionalScaleDecimals(_rrate.scaleDecimals);
                _gaugeRRate.setMaxValue(_rrate.maxValue);
            }

            _gaugeRRate.setValueAnimated(_rrate.value);
            _gaugeRRate.setMaxMeasuredValue(_rrate.maxMeasured);

            if (ddimgtooltip.showTips) {
                // update tooltip
                tip = strings.rrate_info + ':<br>' +
                    '- ' + strings.maximum_info + ': ' + data.rrateTM + ' ' + data.rainunit + '/h ' + strings.at + ' ' + data.TrrateTM +
                    ' | ' + strings.max_hour_info + ': ' + extractDecimal(data.hourlyrainTH) + ' ' + data.rainunit + ' ' + strings.at + ' ' + data.ThourlyrainTH;
                $('#imgtip3_txt').html(tip);
                if (_refreshGraphs && config.showPopupGraphs && config.tipImgs[3] !== null) {
                    $('#imgtip3_img').attr('src', config.imgPathURL + config.tipImgs[3] + _cacheDefeat);
                }
            }
        },

        doHum = function (radio) {
            //if rad isn't specified, just use existing value
            var sel = (radio === undefined ? _hum.selected : radio.value),
                popupImg, tip;

            if (sel === 'out') {
                _hum.value = extractDecimal(data.hum);
                _hum.areas = [steelseries.Section(+extractDecimal(data.humTL), +extractDecimal(data.humTH), gauge.minMaxArea)];
                _hum.title = strings.hum_title_out;
                popupImg = 0;
            } else {
                _hum.value = extractDecimal(data.inhum);
                _hum.areas = [];
                _hum.title = strings.hum_title_in;
                popupImg = 1;
            }

            if (_hum.selected !== sel) {
                _hum.selected = sel;
                //Change gauge title
                _gaugeHum.setTitleString(_hum.title);
                if (config.showPopupGraphs) {
                    $('#imgtip4_img').attr('src', config.imgPathURL + config.tipImgs[4][popupImg] + _cacheDefeat);
                }
            }

            _gaugeHum.setArea(_hum.areas);
            _gaugeHum.setValueAnimated(_hum.value);

            if (ddimgtooltip.showTips) {
                //update tooltip
                if (_hum.selected === 'out') {
                    tip = strings.hum_out_info + ':' +
                        '<br>' +
                        '- ' + strings.minimum_info + ': ' + extractDecimal(data.humTL) + '% ' + strings.at + ' ' + data.ThumTL +
                        ' | ' + strings.maximum_info + ': ' + extractDecimal(data.humTH) + '% ' + strings.at + ' ' + data.ThumTH;
                } else {
                    tip = strings.hum_in_info + ': ' + extractDecimal(data.inhum) + '%';
                }
                $('#imgtip4_txt').html(tip);
                if (_refreshGraphs && config.showPopupGraphs && config.tipImgs[4][0] !== null) {
                    $('i#mgtip4_img').attr('src', config.imgPathURL + config.tipImgs[4][popupImg] + _cacheDefeat);
                }
            }
        },

        doBaro = function () {
            var tip, t1;

            _baro.recLow  = +extractDecimal(data.pressL);
            _baro.recHigh = +extractDecimal(data.pressH);
            _baro.todayLow  = +extractDecimal(data.pressTL);
            _baro.todayHigh = +extractDecimal(data.pressTH);
            _baro.value = +extractDecimal(data.press);
            // Convert the WD change over 3 hours to an hourly rate
            _baro.trendVal =  +extractDecimal(data.presstrendval) / (config.weatherProgram === 2 ? 3 : 1);

            if (data.pressunit === 'hPa' || data.pressunit === 'mb') {
                //  min range 990-1030 - steps of 10 hPa
                _baro.minValue = Math.min(Math.floor((_baro.recLow - 2) / 10) * 10, 990);
                _baro.maxValue = Math.max(Math.ceil((_baro.recHigh + 2) / 10) * 10, 1030);
                _baro.trendValRnd = _baro.trendVal.toFixed(1);    // round to 0.1
            } else if (data.pressunit === 'kPa') {
                //  min range 99-105 - steps of 1 kPa
                _baro.minValue = Math.min(Math.floor(_baro.recLow - 0.2), 99);
                _baro.maxValue = Math.max(Math.ceil(_baro.recHigh + 0.2), 105);
                _baro.trendValRnd = _baro.trendVal.toFixed(2);    // round to 0.01
            } else {
                // inHg: min range 29.5-30.5 - steps of 0.5 inHg
                _baro.minValue = Math.min(Math.floor((_baro.recLow - 0.1) * 2) / 2, 29.5);
                _baro.maxValue = Math.max(Math.ceil((_baro.recHigh + 0.1) * 2) / 2, 30.5);
                _baro.trendValRnd = _baro.trendVal.toFixed(3);    // round to 0.001
            }
            if (_baro.minValue !== _gaugeBaro.getMinValue() || _baro.maxValue !== _gaugeBaro.getMaxValue()) {
                _gaugeBaro.setMinValue(_baro.minValue);
                _gaugeBaro.setMaxValue(_baro.maxValue);
                _gaugeBaro.setValue(_baro.minValue);
            }
            if (_baro.recHigh === _baro.todayHigh && _baro.recLow === _baro.todayLow) {
                // VWS does not provide record hi/lo values
                _baro.sections = [];
                _baro.areas = [steelseries.Section(_baro.todayLow, _baro.todayHigh, gauge.minMaxArea)];
            } else {
                _baro.sections = [
                    steelseries.Section(_baro.minValue, _baro.recLow, 'rgba(255,0,0,0.5)'),
                    steelseries.Section(_baro.recHigh, _baro.maxValue, 'rgba(255,0,0,0.5)')
                ];
                _baro.areas = [
                    steelseries.Section(_baro.minValue, _baro.recLow, 'rgba(255,0,0,0.5)'),
                    steelseries.Section(_baro.recHigh, _baro.maxValue, 'rgba(255,0,0,0.5)'),
                    steelseries.Section(_baro.todayLow, _baro.todayHigh, gauge.minMaxArea)
                ];
            }

            if (gauge.pressureTrendVisible) {
                // Use the baroTrend rather than simple arithmetic test - steady is more/less than zero!
                t1 = baroTrend(_baro.trendVal, data.pressunit, false);
                if (t1 > 0) {
                    _baro.trend = steelseries.TrendState.UP;
                } else if (t1 < 0) {
                    _baro.trend = steelseries.TrendState.DOWN;
                } else {
                    _baro.trend = steelseries.TrendState.STEADY;
                }
                _gaugeBaro.setTrend(_baro.trend);
            }

            _gaugeBaro.setArea(_baro.areas);
            _gaugeBaro.setSection(_baro.sections);
            _gaugeBaro.setValueAnimated(_baro.value);

            if (ddimgtooltip.showTips) {
                // update tooltip
                tip = strings.baro_info + ':' +
                    '<br>' +
                    '- ' + strings.minimum_info + ': ' + _baro.todayLow + ' ' + data.pressunit + ' ' + strings.at + ' ' + data.TpressTL +
                    ' | ' + strings.maximum_info + ': ' + _baro.todayHigh + ' ' + data.pressunit + ' ' + strings.at + ' ' + data.TpressTH +
                    '<br>' +
                    '- ' + strings.baro_trend_info + ': ' + baroTrend(_baro.trendVal, data.pressunit, true) + ' ' +
                    (_baro.trendValRnd > 0 ? '+' : '') + _baro.trendValRnd + ' ' + data.pressunit + '/h';
                $('#imgtip5_txt').html(tip);
                if (_refreshGraphs && config.showPopupGraphs && config.tipImgs[5] !== null) {
                    $('#imgtip5_img').attr('src', config.imgPathURL + config.tipImgs[5] + _cacheDefeat);
                }
            }
        },

        doWind = function () {
            var tip;

            _wind.value = extractDecimal(data.wlatest);
            _wind.average = extractDecimal(data.wspeed);
            _wind.gust = extractDecimal(data.wgust);
            _wind.maxGustToday = extractDecimal(data.wgustTM);
            _wind.maxAvgToday = extractDecimal(data.windTM);

            switch (data.windunit) {
            case 'mph':
            case 'kts':
                _wind.maxValue = Math.max(Math.ceil(_wind.maxGustToday / 10) * 10, gauge.windScaleDefMaxMph);
                break;
            case 'm/s':
                _wind.maxValue = Math.max(Math.ceil(_wind.maxGustToday / 5) * 5, gauge.windScaleDefMaxMs);
                break;
            default:
                _wind.maxValue = Math.max(Math.ceil(_wind.maxGustToday / 20) * 20, gauge.windScaleDefMaxKmh);
            }
            _wind.areas = [
                steelseries.Section(0, +_wind.average, gauge.windAvgArea),
                steelseries.Section(+_wind.average, +_wind.gust, gauge.minMaxArea)
            ];
            if (_wind.maxValue !== _gaugeWind.getMaxValue()) {
                _gaugeWind.setMaxValue(_wind.maxValue);
            }

            _gaugeWind.setArea(_wind.areas);
            _gaugeWind.setMaxMeasuredValue(_wind.maxGustToday);
            _gaugeWind.setValueAnimated(_wind.value);

            if (ddimgtooltip.showTips) {
                // update tooltip
                tip = strings.tenminavgwind_info + ': ' + _wind.average + ' ' + data.windunit + ' | ' +
                      strings.maxavgwind_info + ': ' + _wind.maxAvgToday + ' ' + data.windunit + '<br>' +
                      strings.tenmingust_info + ': ' + _wind.gust + ' ' + data.windunit + ' | ' +
                      strings.maxgust_info + ': ' + _wind.maxGustToday + ' ' + data.windunit + ' ' +
                      strings.at + ' ' + data.TwgustTM + ' ' + strings.bearing_info + ': ' + data.bearingTM +
                      (isNaN(parseFloat(data.bearingTM)) ? '' : '° (' + getord(+data.bearingTM) + ')');
                $('#imgtip6_txt').html(tip);
                if (_refreshGraphs && config.showPopupGraphs && config.tipImgs[6] !== null) {
                    $('#imgtip6_img').attr('src', config.imgPathURL + config.tipImgs[6] + _cacheDefeat);
                }
            }
        },

        doDir = function () {
            var windSpd, windGst, range, tip;

            _dir.valueLatest = extractInteger(data.bearing);
            _dir.titleLatest = strings.latest_title;
            _dir.valueAverage = extractInteger(data.avgbearing);
            _dir.titleAverage = strings.tenminavg_title;
            _dir.bearingFrom = extractInteger(data.BearingRangeFrom10);
            _dir.bearingTo   = extractInteger(data.BearingRangeTo10);

            _gaugeDir.setValueAnimatedAverage(+_dir.valueAverage);
            if (_dir.valueAverage === 0) {
                _dir.valueLatest = 0;
            }
            _gaugeDir.setValueAnimatedLatest(+_dir.valueLatest);

            if (config.showWindVariation) {
                windSpd = +extractDecimal(data.wspeed);
                windGst = +extractDecimal(data.wgust);
                switch (data.windunit.toLowerCase()) {
                case 'mph':
                    _wind.avgKnots = 0.868976242 * windSpd;
                    _wind.gstKnots = 0.868976242 * windGst;
                    break;
                case 'kts':
                    _wind.avgKnots = windSpd;
                    _wind.gstKnots = windGst;
                    break;
                case 'm/s':
                    _wind.avgKnots = 1.94384449 * windSpd;
                    _wind.gstKnots = 1.94384449 * windGst;
                    break;
                case 'km/h':
                case 'kmh':
                    _wind.avgKnots = 0.539956803 * windSpd;
                    _wind.gstKnots = 0.539956803 * windGst;
                    break;
                }
                _wind.avgKnots = Math.round(_wind.avgKnots);
                _wind.gstKnots = Math.round(_wind.gstKnots);
                _gaugeDir.VRB = ' - METAR: ' + ('0' + data.avgbearing).slice(-3) + ('0' + _wind.avgKnots).slice(-2) + 'G' + ('0' + _wind.gstKnots).slice(-2) + 'KT ';

                if (windSpd > 0) {
                    // If variation less than 60 degrees, then METAR = Steady
                    // Unless range = 0 and from/to direction = avg + 180
                    range = (+_dir.bearingTo < +_dir.bearingFrom ?  360 + (+_dir.bearingTo) : +_dir.bearingTo) - (+_dir.bearingFrom);

                    if (_wind.avgKnots < 3) { // Europe uses 3kts, USA 6kts as the threshold
                        _gaugeDir.setSection([steelseries.Section(_dir.bearingFrom, _dir.bearingTo, gauge.minMaxArea)]);
                        _gaugeDir.setArea([]);
                    } else {
                        _gaugeDir.setSection([]);
                        _gaugeDir.setArea([steelseries.Section(_dir.bearingFrom, _dir.bearingTo, gauge.minMaxArea)]);
                    }

                    if ((range < 60 && range > 0) || range === 0 && _dir.bearingFrom === _dir.valueAverage) {
                        _gaugeDir.VRB += ' STDY';
                    } else {
                        if (_wind.avgKnots < 3) { // Europe uses 3kts, USA 6kts as the threshold
                            _gaugeDir.VRB += ' VRB';
                        } else {
                            _gaugeDir.VRB += ' ' + _dir.bearingFrom + 'V' + _dir.bearingTo;
                        }
                    }
                } else {
                    // Zero wind speed, calm
                    _gaugeDir.VRB = ' - METAR: 00000KT';
                    _gaugeDir.setSection([]);
                    _gaugeDir.setArea([]);
                }
            } else {
                _gaugeDir.VRB = '';
            }

            if (ddimgtooltip.showTips) {
                // update tooltip
                tip = strings.latest_title + ' ' + strings.bearing_info + ': ' + _dir.valueLatest + '° (' + getord(+_dir.valueLatest) + ')' + _gaugeDir.VRB + '<br>' +
                      strings.tenminavg_web + ' ' + strings.bearing_info + ': ' + _dir.valueAverage + '° (' + getord(+_dir.valueAverage) + ')' + ', ' + strings.dominant_bearing + ': ' + data.domwinddir;
                if (!config.showRoseGauge) {
                    // Wind run is shown on the wind rose if it is available
                    tip += '<br>' + strings.windruntoday + ': ' + data.windrun + ' ' + _displayUnits.windrun;
                }
                $('#imgtip7_txt').html(tip);
                if (_refreshGraphs && config.showPopupGraphs && config.tipImgs[7] !== null) {
                    $('#imgtip7_img').attr('src', config.imgPathURL + config.tipImgs[7] + _cacheDefeat);
                }
            }
        },

        doUV = function () {
            var tip, indx;

            _uv.value = extractDecimal(data.UV);

            if (+_uv.value === 0) {
                indx = 0;
            } else if (_uv.value < 2.5) {
                indx = 1;
            } else if (_uv.value < 5.5) {
                indx = 2;
            } else if (_uv.value < 7.5) {
                indx = 3;
            } else if (_uv.value < 10.5) {
                indx = 4;
            } else {
                indx = 5;
            }

			_uv.risk = strings.uv_levels[indx];
			_uv.headLine = strings.uv_headlines[indx];
			_uv.detail = strings.uv_details[indx];
            _gaugeUV.setUnitString(_uv.risk);
            _gaugeUV.setValueAnimated(_uv.value);

            if (ddimgtooltip.showTips) {
                // update tooltip
                tip = '<b>' + strings.uv_title + ': ' + _uv.value + '</b> - <i>' + strings.solar_maxToday + ': ' + data.UVTH + '</i><br>';
                tip += '<i>' + _uv.headLine + '</i><br>';
                tip += _uv.detail;
                $('#imgtip8_txt').html(tip);
                if (_refreshGraphs && config.showPopupGraphs && config.tipImgs[8] !== null) {
                    $('#imgtip8_img').attr('src', config.imgPathURL + config.tipImgs[8] + _cacheDefeat);
                }
            }
        },

        doSolar = function () {
            var tip, percent;

            _solar.value = +extractInteger(data.SolarRad);
            _solar.maxToday = extractInteger(data.SolarTM);
            _solar.currMaxValue = +extractInteger(data.CurrentSolarMax);

            // Set a section (100 units wide) to show current theoretical max value
            if (data.CurrentSolarMax !== "N/A") {
				_gaugeSolar.setArea([steelseries.Section(_solar.currMaxValue, Math.min(_solar.currMaxValue + 100, gauge.solarGaugeScaleMax), 'rgba(220,0,0,0.5)')]);
			}

            // Need to rescale the gauge?
            _solar.maxValue = Math.max(
                Math.ceil(_solar.value / 100) * 100,
                Math.ceil(_solar.currMaxValue / 100) * 100,
                Math.ceil(_solar.maxToday / 100) * 100,
                gauge.solarGaugeScaleMax);
            if (_solar.maxValue !== _gaugeSolar.getMaxValue()) {
                _gaugeSolar.setMaxValue(_solar.maxValue);
            }

            // Set the values
            _gaugeSolar.setMaxMeasuredValue(_solar.maxToday);
            _gaugeSolar.setValueAnimated(_solar.value);

            if (ddimgtooltip.showTips) {
                // update tooltip
                percent = (+_solar.currMaxValue === 0 ? '--' : Math.round(+_solar.value / +_solar.currMaxValue * 100));
                tip = '<b>' + strings.solar_title + ': ' + _solar.value + ' W/m²</b> - ' +
                      '<i>' + percent + '% ' + strings.solar_ofMax + '</i><br>' +
                      strings.solar_currentMax + ': ' + _solar.currMaxValue + ' W/m²';
                if (data.SolarTM !== undefined) {
                    tip += '<br>' + strings.solar_maxToday + ': ' + _solar.maxToday + ' W/m²';
                }
                $('#imgtip9_txt').html(tip);
                if (_refreshGraphs && config.showPopupGraphs && config.tipImgs[9] !== null) {
                    $('#imgtip9_img').attr('src', config.imgPathURL + config.tipImgs[9] + _cacheDefeat);
                }
            }
        },

        doRose = function () {
            windRose.doWindRose();
            if (ddimgtooltip.showTips) {
                // update tooltip
                $('#imgtip10_txt').html(strings.dominant_bearing + ': ' + data.domwinddir + '<br>' +
                                        strings.windruntoday + ': ' + data.windrun + ' ' + _displayUnits.windrun);
                if (_refreshGraphs && config.showPopupGraphs && config.tipImgs[10] !== null) {
                    $('#imgtip10_img').attr('src', config.imgPathURL + config.tipImgs[10] + _cacheDefeat);
                }
            }
        },

        //
        // doFirst() called by doUpdate() the first time the page is updated to setup various things that are
        // only known when the realtimegauges.txt data is available
        //
        doFirst = function () {

            drawTemp();
            drawDew();
            if (data.tempunit[1] === 'F') {
                _displayUnits.temp = 'F';
                setRadioCheck('rad_unitsTemp', 'F');
                setTempUnits(false);
            }

            drawHum();

            drawBaro();
            if (data.pressunit !== 'hPa') {
                _displayUnits.press = data.pressunit;
                setRadioCheck('rad_rad_unitsPress', data.pressunit);
                setBaroUnits(data.pressunit);
            }

            drawWind();
            drawDir();
            if (data.windunit !== 'km/h') {
                _displayUnits.wind = data.windunit;
                setRadioCheck('rad_rad_unitsPress', data.pressunit);
                setWindUnits(data.windunit);
            }

            if (config.showRoseGauge) {
                drawWindRose();
            }

            drawRain();
            drawRRate();
            if (data.rainunit !== 'mm') {
                _displayUnits.rain = data.rainunit;
                setRainUnits(false);
            }

            if (config.showSolarGauge) {
                drawSolar();
                if (data.SolarTM !== undefined) {
                    _gaugeSolar.setMaxMeasuredValueVisible(true);
                }
            }

            if (config.showUvGauge) {
                drawUV();
            }

            // set the script version on the page
            $('#scriptVer').html(config.scriptVer);
            // set the version information from the station
            $('#programVersion').html(data.version);
            $('#programBuild').html(data.build);
            $('#programName').html(_programLink[config.weatherProgram]);

            // has a page timeout over ride password been supplied?
            _pageUpdateParam = getUrlParam('pageUpdate');

            if (config.showPopupData) {
                // now initialise the pop-up script and download the trend images
                // - has to be done here as doFirst may remove elements from the page
                // - and we delay the download of the images speeding up page display
                ddimgtooltip.init('[id^="tip_"]');
            }
        },

        //
        // createTempSections() creates an array of gauge sections appropriate for Celcius or Farenheit scales
        //
        createTempSections = function (celsius) {
            var section;
            if (celsius) {
                section = [
                    steelseries.Section(-100, -35, 'rgba(195,  92, 211, 0.4)'),
                    steelseries.Section(-35,  -30, 'rgba(139,  74, 197, 0.4)'),
                    steelseries.Section(-30,  -25, 'rgba( 98,  65, 188, 0.4)'),
                    steelseries.Section(-25,  -20, 'rgba( 62,  66, 185, 0.4)'),
                    steelseries.Section(-20,  -15, 'rgba( 42,  84, 194, 0.4)'),
                    steelseries.Section(-15,  -10, 'rgba( 25, 112, 210, 0.4)'),
                    steelseries.Section(-10,   -5, 'rgba(  9, 150, 224, 0.4)'),
                    steelseries.Section(-5,     0, 'rgba(  2, 170, 209, 0.4)'),
                    steelseries.Section(0,      5, 'rgba(  0, 162, 145, 0.4)'),
                    steelseries.Section(5,     10, 'rgba(  0, 158, 122, 0.4)'),
                    steelseries.Section(10,    15, 'rgba( 54, 177,  56, 0.4)'),
                    steelseries.Section(15,    20, 'rgba(111, 202,  56, 0.4)'),
                    steelseries.Section(20,    25, 'rgba(248, 233,  45, 0.4)'),
                    steelseries.Section(25,    30, 'rgba(253, 142,  42, 0.4)'),
                    steelseries.Section(30,    40, 'rgba(236,  45,  45, 0.4)'),
                    steelseries.Section(40,   100, 'rgba(245, 109, 205, 0.4)')
                ];
            } else {
                section = [
                    steelseries.Section(-200, -30, 'rgba(195,  92, 211, 0.4)'),
                    steelseries.Section(-30,  -25, 'rgba(139,  74, 197, 0.4)'),
                    steelseries.Section(-25,  -15, 'rgba( 98,  65, 188, 0.4)'),
                    steelseries.Section(-15,   -5, 'rgba( 62,  66, 185, 0.4)'),
                    steelseries.Section(-5,     5, 'rgba( 42,  84, 194, 0.4)'),
                    steelseries.Section(5,     15, 'rgba( 25, 112, 210, 0.4)'),
                    steelseries.Section(15,    25, 'rgba(  9, 150, 224, 0.4)'),
                    steelseries.Section(25,    32, 'rgba(  2, 170, 209, 0.4)'),
                    steelseries.Section(32,    40, 'rgba(  0, 162, 145, 0.4)'),
                    steelseries.Section(40,    50, 'rgba(  0, 158, 122, 0.4)'),
                    steelseries.Section(50,    60, 'rgba( 54, 177,  56, 0.4)'),
                    steelseries.Section(60,    70, 'rgba(111, 202,  56, 0.4)'),
                    steelseries.Section(70,    80, 'rgba(248, 233,  45, 0.4)'),
                    steelseries.Section(80,    90, 'rgba(253, 142,  42, 0.4)'),
                    steelseries.Section(90,   110, 'rgba(236,  45,  45, 0.4)'),
                    steelseries.Section(110,  200, 'rgba(245, 109, 205, 0.4)')
                ];
            }
            return section;
        },

        //
        // createRainSections() returns an array of section highlights for the Rain Rate gauge
        //
        /*
          Assumes 'standard' descriptive limits from UK met office:
           < 0.25 mm/hr - Very light rain
           0.25mm/hr to 1.0mm/hr - Light rain
           1.0 mm/hr to 4.0 mm/hr - Moderate rain
           4.0 mm/hr to 16.0 mm/hr - Heavy rain
           16.0 mm/hr to 50 mm/hr - Very heavy rain
           > 50.0 mm/hour - Extreme rain

           Roughly translated to the corresponding Inch rates
           < 0.001
           0.001 to 0.05
           0.05 to 0.20
           0.20 to 0.60
           0.60 to 2.0
           > 2.0
        */
        createRainRateSections = function (metric) {
            var section;
            if (metric) {
                section = [ steelseries.Section(0, 0.25, 'rgba(0, 140, 0, 0.5)'),
                            steelseries.Section(0.25, 1, 'rgba(80, 192, 80, 0.5)'),
                            steelseries.Section(1, 4, 'rgba(150, 203, 150, 0.5)'),
                            steelseries.Section(4, 16, 'rgba(212, 203, 109, 0.5)'),
                            steelseries.Section(16, 50, 'rgba(225, 155, 105, 0.5)'),
                            steelseries.Section(50, 1000, 'rgba(245, 86, 59, 0.5)')];
            } else {
                section = [ steelseries.Section(0, 0.05, 'rgba(0, 140, 0, 0.5)'),
                            steelseries.Section(0.05, 0.1, 'rgba(80, 192, 80, 0.5)'),
                            steelseries.Section(0.1, 0.15, 'rgba(150, 203, 150, 0.5)'),
                            steelseries.Section(0.15, 0.6, 'rgba(212, 203, 109, 0.5)'),
                            steelseries.Section(0.6, 2, 'rgba(225, 155, 105, 0.5)'),
                            steelseries.Section(2, 100, 'rgba(245, 86, 59, 0.5)')];
            }
            return section;
        },

        //
        // createRainFallSections()returns an array of section highlights for total rainfall in mm or inches
        //
        createRainfallSections = function (metric) {
            var section;
            if (metric) {
                section = [ steelseries.Section(0, 5, 'rgba(0, 250, 0, 1)'),
                            steelseries.Section(5, 10, 'rgba(0, 250, 117, 1)'),
                            steelseries.Section(10, 25, 'rgba(218, 246, 0, 1)'),
                            steelseries.Section(25, 40, 'rgba(250, 186, 0, 1)'),
                            steelseries.Section(40, 50, 'rgba(250, 95, 0, 1)'),
                            steelseries.Section(50, 65, 'rgba(250, 0, 0, 1)'),
                            steelseries.Section(65, 75, 'rgba(250, 6, 80, 1)'),
                            steelseries.Section(75, 100, 'rgba(205, 18, 158, 1)'),
                            steelseries.Section(100, 125, 'rgba(0, 0, 250, 1)'),
                            steelseries.Section(125, 500, 'rgba(0, 219, 212, 1)')];
            } else {
                section = [ steelseries.Section(0, 0.2, 'rgba(0, 250, 0, 1)'),
                            steelseries.Section(0.2, 0.5, 'rgba(0, 250, 117, 1)'),
                            steelseries.Section(0.5, 1, 'rgba(218, 246, 0, 1)'),
                            steelseries.Section(1, 1.5, 'rgba(250, 186, 0, 1)'),
                            steelseries.Section(1.5, 2, 'rgba(250, 95, 0, 1)'),
                            steelseries.Section(2, 2.5, 'rgba(250, 0, 0, 1)'),
                            steelseries.Section(2.5, 3, 'rgba(250, 6, 80, 1)'),
                            steelseries.Section(3, 4, 'rgba(205, 18, 158, 1)'),
                            steelseries.Section(4, 5, 'rgba(0, 0, 250, 1)'),
                            steelseries.Section(5, 20, 'rgba(0, 219, 212, 1)')];
            }
            return section;
        },

        //
        // createRainfallGradient() returns an array of SS colours for continous gradient colouring of the total rainfall LED gauge
        //
        createRainfallGradient = function (metric) {
            var grad = new steelseries.gradientWrapper(
                0,
                (metric ? 100 : 4),
                [0, 0.1, 0.62, 1],
                [new steelseries.rgbaColor(15,  148,  0, 1),
                 new steelseries.rgbaColor(213, 213,  0, 1),
                 new steelseries.rgbaColor(213,   0, 25, 1),
                 new steelseries.rgbaColor(250,   0,  0, 1)]
            );
            return grad;
        },

        //
        //--------------- Helper functions ------------------
        //

        //
        // getord() converts a value in degrees (0-360) into a localised compass point (N, ENE, NE, etc)
        //
        getord = function (deg) {
            if (deg === 0) {
                // Special case, 0=No wind, 360=North
                return strings.calm;
            } else {
                return (strings.coords[Math.floor((deg + 11.25) / 22.5) % 16]);
            }
        },

        //
        // getUrlParam() extracts the named parameter from the current page URL
        //
        getUrlParam = function (paramName) {
            var regexS, regex, results;
            paramName = paramName.replace(/(\[|\])/g, '\\$1');
            regexS = '[\\?&]' + paramName + '=([^&#]*)';
            regex = new RegExp(regexS);
            results = regex.exec(window.location.href);
            if (results === null) {
                return '';
            } else {
                return results[1];
            }
        },

        //
        // extractDecimal() returns a decimal number from a string, the decimal point can be either a dot or a comma
        // it ignores any text such as pre/appended units
        //
        extractDecimal = function (str) {
            return (/[\-+]?[0-9]+\.?[0-9]*/).exec(str.replace(',', '.'))[0];
        },

        //
        // extractInteger() returns an integer from a string
        // it ignores any text such as pre/appended units
        //
        extractInteger = function (str) {
            return (/[\-+]?[0-9]+/).exec(str)[0];
        },

        //
        // tempTrend() converts a temperature trend value into a localised string, or +1, 0, -1 depending on the value of bTxt
        //
        tempTrend = function (trend, units, bTxt) {
            // Scale is over 3 hours, in Celcius
            var val = trend * 3 * (units[1] === 'C' ? 1 : (5 / 9)),
                ret;
            if (val > 5) {
                ret = (bTxt ? strings.RisingVeryRapidly : 1);
            } else if (val > 3) {
                ret = (bTxt ? strings.RisingQuickly : 1);
            } else if (val > 1) {
                ret = (bTxt ? strings.Rising : 1);
            } else if (val > 0.5) {
                ret = (bTxt ? strings.RisingSlowly : 1);
            } else if (val >= -0.5) {
                ret = (bTxt ? strings.Steady : 0);
            } else if (val >= -1) {
                ret = (bTxt ? strings.FallingSlowly : -1);
            } else if (val >= -3) {
                ret = (bTxt ? strings.Falling : -1);
            } else if (val >= -5) {
                ret = (bTxt ? strings.FallingQuickly : -1);
            } else {
                ret = (bTxt ? strings.FallingVeryRapidly : -1);
            }
            return ret;
        },

        //
        // baroTrend() converts a pressure trend value into a localised string, or +1, 0, -1 depending on the value of bTxt
        //
        baroTrend = function (trend, units, bTxt) {
            var val = trend * 3,
                ret;
            // The terms below are the UK Met Office terms for a 3 hour change in hPa
            // trend is supplied as an hourly change, so multiply by 3
            if (units === 'inHg') {
                val *= 33.8639;
            } else if (units === 'kPa') {
                val *= 10;
                // assume everything else is hPa or mb, could be dangerous!
            }
            if (val > 6.0) {
                ret = (bTxt ? strings.RisingVeryRapidly : 1);
            } else if (val > 3.5) {
                ret = (bTxt ? strings.RisingQuickly : 1);
            } else if (val > 1.5) {
                ret = (bTxt ? strings.Rising : 1);
            } else if (val > 0.1) {
                ret = (bTxt ? strings.RisingSlowly : 1);
            } else if (val >= -0.1) {
                ret = (bTxt ? strings.Steady : 0);
            } else if (val >= -1.5) {
                ret = (bTxt ? strings.FallingSlowly : -1);
            } else if (val >= -3.5) {
                ret = (bTxt ? strings.Falling : -1);
            } else if (val >= -6.0) {
                ret = (bTxt ? strings.FallingQuickly : -1);
            } else {
                ret = (bTxt ? strings.FallingVeryRapidly : -1);
            }
            return ret;
        },

        //
        // getMinTemp() returns the lowest temperature today for gauge scaling
        //
        getMinTemp = function () {
            return Math.min(
                extractDecimal(data.tempTL),
                extractDecimal(data.dewpointTL),
                extractDecimal(data.apptempTL),
                extractDecimal(data.wchillTL));
        },

        //
        // getMaxTemp() returns the highest temperature today for gauge scaling
        //
        getMaxTemp = function () {
            return Math.max(
                extractDecimal(data.tempTH),
                extractDecimal(data.apptempTH),
                extractDecimal(data.heatindexTH),
                extractDecimal(data.humidex));
        },

        // Celcius to Farenheit
        c2f = function (val) {
            return (extractDecimal(val) * 9 / 5 + 32).toFixed(1);
        },
        // Farenheit to Celcius
        f2c = function (val) {
            return ((extractDecimal(val) - 32) * 5 / 9).toFixed(1);
        },
        // mph to ms
        mph2ms = function (val) {
            return (extractDecimal(val) * 0.447).toFixed(1);
        },
        // knots to ms
        kts2ms = function (val) {
            return (extractDecimal(val) * 0.515).toFixed(1);
        },
        // kph to ms
        kmh2ms = function (val) {
            return (extractDecimal(val) * 0.2778).toFixed(1);
        },
        // ms to kts
        ms2kts = function (val) {
            return (extractDecimal(val) * 1.9426).toFixed(1);
        },
        // ms to mph
        ms2mph = function (val) {
            return (extractDecimal(val) * 2.237).toFixed(1);
        },
        // ms to kph
        ms2kmh = function (val) {
            return (extractDecimal(val) * 3.6).toFixed(1);
        },
        // mm to inches
        mm2in = function (val) {
            return (extractDecimal(val) / 25.4).toFixed(2);
        },
        // inches to mm
        in2mm = function (val) {
            return (extractDecimal(val) * 25.4).toFixed(1);
        },
        // miles to km
        miles2km = function (val) {
            return (extractDecimal(val) * 1.609344).toFixed(1);
        },
        // nautical miles to km
        nmiles2km = function (val) {
            return (extractDecimal(val) * 1.85200).toFixed(1);
        },
        // km to miles
        km2miles = function (val) {
            return (extractDecimal(val) / 1.609344).toFixed(1);
        },
        // km to nautical miles
        km2nmiles = function (val) {
            return (extractDecimal(val) / 1.85200).toFixed(1);
        },
        // hPa to inHg (@0°C)
        hpa2inhg = function (val, decimals) {
            decimals = decimals || 2;
            return (extractDecimal(val) * 0.029528744).toFixed(decimals);
        },
        // inHg to hPa (@0°C)
        inhg2hpa = function (val) {
            return (extractDecimal(val) / 0.029528744).toFixed(1);
        },
        // kPa to hPa
        kpa2hpa = function (val) {
            return (extractDecimal(val) * 10).toFixed(1);
        },
        // hPa to kPa
        hpa2kpa = function (val, decimals) {
            decimals = decimals || 2;
            return (extractDecimal(val) / 10).toFixed(decimals);
        },

        //
        // setCookie() writes the 'obj' in cookie 'name' for persistant storage
        //
        setCookie = function (name, obj) {
            var date = new Date(), expires;
            // cookies valid for 1 year
            date.setYear(date.getFullYear() + 1);
            expires = '; expires=' + date.toGMTString();
            document.cookie = name + '=' + encodeURIComponent(JSON.stringify(obj)) + expires;
        },

        //
        // getCookie() reads the value of cookie 'name' from persitent storage
        //
        getCookie = function (name) {
            var i, x, y, ret = null,
                arrCookies = document.cookie.split(';');

            for (i = arrCookies.length; i--;) {
                x = arrCookies[i].split('=');
                if (x[0].trim() === name) {
                    try {
                        y = decodeURIComponent(x[1]);
                    } catch (e) {
                        y = x[1];
                    }
                    ret = JSON.parse(unescape(y));
                    break;
                }
            }
            return ret;
        },

        //
        // setRadioCheck() sets the desired value of the HTML radio buttons to be selected
        //
        setRadioCheck = function (obj, val) {
            $('input:radio[name="' + obj + '"]').filter('[value="' + val + '"]').attr('checked', true);
        },

        //
        // convTempData() converts all the temperature values using the supplied conversion function
        //
        convTempData = function (convFunc) {
            data.apptemp = convFunc(data.apptemp);
            data.apptempTH = convFunc(data.apptempTH);
            data.apptempTL = convFunc(data.apptempTL);
            data.dew = convFunc(data.dew);
            data.dewpointTH = convFunc(data.dewpointTH);
            data.dewpointTL = convFunc(data.dewpointTL);
            data.heatindex = convFunc(data.heatindex);
            data.heatindexTH = convFunc(data.heatindexTH);
            data.humidex = convFunc(data.humidex);
            data.intemp = convFunc(data.intemp);
            data.temp = convFunc(data.temp);
            data.tempTH = convFunc(data.tempTH);
            data.tempTL = convFunc(data.tempTL);
            data.wchill = convFunc(data.wchill);
            data.wchillTL = convFunc(data.wchillTL);
            if (convFunc === c2f) {
                data.temptrend = (+extractDecimal(data.temptrend) * 9 / 5).toFixed(1);
                data.tempunit = '°F';
            } else {
                data.temptrend = (+extractDecimal(data.temptrend) * 5 / 9).toFixed(1);
                data.tempunit = '°C';
            }
        },

        //
        // convRainData() converts all the rain data units using the supplied conversion function
        //
        convRainData = function (convFunc) {
            data.rfall = convFunc(data.rfall);
            data.rrate = convFunc(data.rrate);
            data.rrateTM = convFunc(data.rrateTM);
            data.hourlyrainTH = convFunc(data.hourlyrainTH);
            data.rainunit = convFunc === mm2in ? 'in' : 'mm';
        },

        //
        // convWindData() converts all the wind values using the supplied coversion function
        //
        convWindData = function (from, to) {
            var fromFunc1, toFunc1,
                fromFunc2, toFunc2,
                dummy = function (val) {
                    return val;
                };

            // convert to m/s & km
            switch (from) {
            case 'mph':
                fromFunc1 = mph2ms;
                fromFunc2 = miles2km;
                break;
            case 'kts':
                fromFunc1 = kts2ms;
                fromFunc2 = nmiles2km;
                break;
            case 'km/h':
                fromFunc1 = kmh2ms;
                fromFunc2 = dummy;
                break;
            case 'm/s':
            /* falls through */
            default:
                fromFunc1 = dummy;
                fromFunc2 = dummy;
            }
            // conversion function from km to required units
            switch (to) {
            case 'mph':
                toFunc1 = ms2mph;
                toFunc2 = km2miles;
                _displayUnits.windrun = 'miles';
                break;
            case 'kts':
                toFunc1 = ms2kts;
                toFunc2 = km2nmiles;
                _displayUnits.windrun = 'n.miles';
                break;
            case 'km/h':
                toFunc1 = ms2kmh;
                toFunc2 = dummy;
                _displayUnits.windrun = 'km';
                break;
            case 'm/s':
            /* falls through */
            default:
                toFunc1 = dummy;
                toFunc2 = dummy;
                _displayUnits.windrun = 'km';
            }
            // do the conversions
            data.wgust = toFunc1(fromFunc1(data.wgust));
            data.wgustTM = toFunc1(fromFunc1(data.wgustTM));
            data.windTM = toFunc1(fromFunc1(data.windTM));
            data.windrun = toFunc2(fromFunc2(data.windrun));
            data.wlatest = toFunc1(fromFunc1(data.wlatest));
            data.wspeed = toFunc1(fromFunc1(data.wspeed));
            data.windunit = to;
        },

        //
        // convBaroData() converts all the pressure values using the supplied coversion function
        //
        convBaroData = function (from, to) {
            var fromFunc, toFunc,
                dummy = function (val) {
                    return val;
                };

            // convert to hPa
            switch (from) {
            case 'hPa':
            /* falls through */
            case 'mb':
                fromFunc = dummy;
                break;
            case 'inHg':
                fromFunc = inhg2hpa;
                break;
            case 'kPa':
                fromFunc = kpa2hpa;
                break;
            }
            // convert to required units
            switch (to) {
            case 'hPa':
            /* falls through */
            case 'mb':
                toFunc = dummy;
                break;
            case 'inHg':
                toFunc = hpa2inhg;
                break;
            case 'kPa':
                toFunc = hpa2kpa;
                break;
            }

            data.press = toFunc(fromFunc(data.press));
            data.pressH = toFunc(fromFunc(data.pressH));
            data.pressL = toFunc(fromFunc(data.pressL));
            data.pressTH = toFunc(fromFunc(data.pressTH));
            data.pressTL = toFunc(fromFunc(data.pressTL));
            data.presstrendval = toFunc(fromFunc(data.presstrendval), 3);
            data.pressunit = to;
        },

        //
        // setUnits() Main data conversion routine, calls all the sub-routines
        //
        setUnits = function (radio) {
            var sel = radio.value;

            _userUnitsSet = true;

            switch (sel) {
            // == Temperature ==
            case 'C':
                _displayUnits.temp = sel;
                if (data.tempunit[1] !== sel) {
                    setTempUnits(true);
                    convTempData(f2c);
                    doTemp();
                    doDew();
                }
                break;
            case 'F':
                _displayUnits.temp = sel;
                if (data.tempunit[1] !== sel) {
                    setTempUnits(false);
                    convTempData(c2f);
                    doTemp();
                    doDew();
                }
                break;
            // == Rainfall ==
            case 'mm':
                _displayUnits.rain = sel;
                if (data.rainunit !== sel) {
                    setRainUnits(true);
                    convRainData(in2mm);
                    doRain();
                    doRRate();
                }
                break;
            case 'in':
                _displayUnits.rain = sel;
                if (data.rainunit !== sel) {
                    setRainUnits(false);
                    convRainData(mm2in);
                    doRain();
                    doRRate();
                }
                break;
            // == Pressure ==
            case 'hPa':
            /* falls through */
            case 'inHg':
            /* falls through */
            case 'mb':
            /* falls through */
            case 'kPa':
                _displayUnits.press = sel;
                if (data.pressunit !== sel) {
                    convBaroData(data.pressunit, sel);
                    setBaroUnits(sel);
                    doBaro();
                }
                break;
            // == Wind speed ==
            case 'mph':
            /* falls through */
            case 'kts':
            /* falls through */
            case 'm/s':
            /* falls through */
            case 'km/h':
                _displayUnits.wind = sel;
                if (data.windunit !== sel) {
                    convWindData(data.windunit, sel);
                    setWindUnits(sel);
                    doWind();
                    doDir();
                    if (config.showRoseGauge && typeof windRose !== "undefined") {
                        doRose();
                    }
                }
                break;
            }
            if (config.useCookies) {
                setCookie('units', _displayUnits);
            }
        },

        setTempUnits = function (celcius) {
            if (celcius) {
                data.tempunit = '°C';
                _temp.sections = createTempSections(true);
                _temp.minValue = gauge.tempScaleDefMinC;
                _temp.maxValue = gauge.tempScaleDefMaxC;
                _dew.sections = createTempSections(true);
                _dew.minValue = gauge.tempScaleDefMinC;
                _dew.maxValue = gauge.tempScaleDefMaxC;
            } else {
                data.tempunit = '°F';
                _temp.sections = createTempSections(false);
                _temp.minValue = gauge.tempScaleDefMinF;
                _temp.maxValue = gauge.tempScaleDefMaxF;
                _dew.sections = createTempSections(false);
                _dew.minValue = gauge.tempScaleDefMinF;
                _dew.maxValue = gauge.tempScaleDefMaxF;
            }
            _gaugeTemp.setUnitString(data.tempunit);
            _gaugeTemp.setSection(_temp.sections);
            _gaugeDew.setUnitString(data.tempunit);
            _gaugeDew.setSection(_temp.sections);
        },

        setRainUnits = function (mm) {
            if (mm) {
                data.rainunit = 'mm';
                _rain.lcdDecimals = 1;
                _rain.scaleDecimals = 1;
                _rain.labelNumberFormat = gauge.labelFormat;
                _rain.sections = (gauge.rainUseSectionColours ? createRainfallSections(true) : []);
                _rain.maxValue = gauge.rainScaleDefmm;
                _rain.grad = (gauge.rainUseGradientColours ? createRainfallGradient(true) : null);
                _rrate.lcdDecimals = 1;
                _rrate.scaleDecimals = 0;
                _rrate.labelNumberFormat = gauge.labelFormat;
                _rrate.sections = createRainRateSections(true);
                _rrate.maxValue = gauge.rainRateScaleDefmm;
            } else {
                data.rainunit = 'in';
                _rain.lcdDecimals = 2;
                _rain.scaleDecimals = gauge.rainScaleDefIn < 1 ? 2 : 1;
                _rain.labelNumberFormat = steelseries.LabelNumberFormat.FRACTIONAL;
                _rain.sections = (gauge.rainUseSectionColours ? createRainfallSections(false) : []);
                _rain.maxValue = gauge.rainScaleDefIn;
                _rain.grad = (gauge.rainUseGradientColours ? createRainfallGradient(false) : null);
                _rrate.lcdDecimals = 2;
                _rrate.scaleDecimals = gauge.rainRateScaleDefIn < 1 ? 2 : 1;
                _rrate.labelNumberFormat = steelseries.LabelNumberFormat.FRACTIONAL;
                _rrate.sections = createRainRateSections(false);
                _rrate.maxValue = gauge.rainRateScaleDefIn;
            }
            _rain.value = 0;
            _rrate.value = 0;
            _gaugeRain.setUnitString(data.rainunit);
            _gaugeRain.setSection(_rain.sections);
            _gaugeRain.setGradient(_rain.grad);
            _gaugeRain.setFractionalScaleDecimals(_rain.scaleDecimals);
            _gaugeRain.setLabelNumberFormat(_rain.labelNumberFormat);
            _gaugeRain.setLcdDecimals(_rain.lcdDecimals);
            _gaugeRRate.setUnitString(data.rainunit + '/h');
            _gaugeRRate.setSection(_rrate.sections);
            _gaugeRRate.setFractionalScaleDecimals(_rrate.scaleDecimals);
            _gaugeRRate.setLabelNumberFormat(_rrate.labelNumberFormat);
            _gaugeRRate.setLcdDecimals(_rrate.lcdDecimals);
        },

        setWindUnits = function (to) {
            var maxVal;

            // conversion function to required units
            switch (to) {
            case 'mph':
                maxVal = gauge.windScaleDefMaxMph;
                break;
            case 'kts':
                maxVal = gauge.windScaleDefMaxKts;
                break;
            case 'km/h':
                maxVal = gauge.windScaleDefMaxKmh;
                break;
            case 'm/s':
                maxVal = gauge.windScaleDefMaxMs;
            }
            // set the gauges
            data.windunit = to;
            _wind.maxValue = maxVal;
            _gaugeWind.setUnitString(data.windunit);
            _gaugeWind.setValue(0);
        },

        setBaroUnits = function (to) {
            var minVal, maxVal;

            // set to the required units
            switch (to) {
            case 'hPa':
            /* falls through */
            case 'mb':
                minVal = gauge.baroScaleDefMinhPa;
                maxVal = gauge.baroScaleDefMaxhPa;
                _baro.lcdDecimals = 1;
                _baro.scaleDecimals = 0;
                _baro.labelNumberFormat = gauge.labelFormat;
                break;
            case 'inHg':
                minVal = gauge.baroScaleDefMininHg;
                maxVal = gauge.baroScaleDefMaxinHg;
                _baro.lcdDecimals = 2;
                _baro.scaleDecimals = 1;
                _baro.labelNumberFormat = steelseries.LabelNumberFormat.FRACTIONAL;
                break;
            case 'kPa':
                minVal = gauge.baroScaleDefMinkPa;
                maxVal = gauge.baroScaleDefMaxkPa;
                _baro.lcdDecimals = 2;
                _baro.scaleDecimals = 1;
                _baro.labelNumberFormat = steelseries.LabelNumberFormat.FRACTIONAL;
                break;
            }

            data.pressunit = to;
            _gaugeBaro.setUnitString(to);
            _gaugeBaro.setLcdDecimals(_baro.lcdDecimals);
            _gaugeBaro.setFractionalScaleDecimals(_baro.scaleDecimals);
            _gaugeBaro.setLabelNumberFormat(_baro.labelNumberFormat);
            _baro.minValue = minVal;
            _baro.maxValue = maxVal;
            _baro.value = _baro.minValue;
        },

        //
        // setLang() switches the HTML page language set, called by changeLang() in language.js
        //
        setLang = function (newLang) {
            // reset to the new language
            strings = newLang;

            // temperature
            if ($('#rad_temp1').is(':checked')) {
                _temp.title = strings.temp_title_out;
            } else {
                _temp.title = strings.temp_title_in;
            }

            switch ($('input[name="rad_dew"]:checked').val()) {
            case 'dew':
                _dew.title = strings.dew_title;
                break;
            case 'app':
                _dew.title = strings.apptemp_title;
                break;
            case 'wnd':
                _dew.title = strings.chill_title;
                break;
            case 'hea':
                _dew.title = strings.heat_title;
                break;
            case 'hum':
                _dew.title = strings.humdx_title;
                break;
            }
            // rain
            _rain.title = strings.rain_title;
            // rrate
            _rrate.title = strings.rrate_title;
            // humidty
            if ($('#rad_hum1').is(':checked')) {
                _hum.title = strings.hum_title_out;
            } else {
                _hum.title = strings.hum_title_in;
            }
            // barometer
            _baro.title = strings.baro_title;
            // wind
            _wind.title = strings.wind_title;

            // can't do anything about the LED and status at the moment :(
            //g_led.title = strings.led_title;

            // Update all the title string and
            // call all the gauge functions to update popup data
            if (_gaugeTemp) {
                _gaugeTemp.setTitleString(_temp.title);
                doTemp();
            }
            if (_gaugeDew)  {
                _gaugeDew.setTitleString(_dew.title);
                doDew();
            }
            if (_gaugeBaro) {
                _gaugeBaro.setTitleString(_baro.title);
                doBaro();
            }
            if (_gaugeRain) {
                _gaugeRain.setTitleString(_rain.title);
                doRain();
            }
            if (_gaugeRRate) {
                _gaugeRRate.setTitleString(_rrate.title);
                doRRate();
            }
            if (_gaugeHum)  {
                _gaugeHum.setTitleString(_hum.title);
                doHum();
            }
            if (_gaugeWind) {
                _gaugeWind.setTitleString(_wind.title);
                doWind();
            }
            if (_gaugeDir) {
                _gaugeDir.setPointSymbols(strings.compass);
                _dir.titles = [strings.latest_web, strings.tenminavg_web];
                _gaugeDir.setLcdTitleStrings(_dir.titles);
                doDir();
            }
            if (_gaugeUV) {
                _uv.title = strings.uv_title;
                _gaugeUV.setTitleString(_uv.title);
            }
            if (_gaugeSolar) {
                _solar.title = strings.solar_title;
                _gaugeSolar.setTitleString(_solar.title);
            }
            if (typeof windRose !== "undefined") {
                windRose.setTitle(strings.windrose);
                windRose.setCompassString(strings.compass);
                windRose.doWindRose();
            }
        },

        getWindrunUnits = function (spdUnits) {
            var retVal;
            switch (spdUnits) {
            case 'mph':
                retVal = 'miles';
                break;
            case 'kts':
                retVal = 'n.miles';
                break;
            case 'km/h':
            /* falls through */
            case 'm/s':
            /* falls through */
            default:
                retVal = 'km';
                break;
            }
            return retVal;
        },

        //
        // extend() used to add a parent object attributes to a child object
        //
        extend = function (parent, child) {
            var i;
            child = child || {};
            for (i in parent) {
                if (parent.hasOwnProperty(i)) {
                    child[i] = parent[i];
                }
            }
            return child;
        },

        getWindRoseData = function () {
            return data.WindRoseData;
        },

        getWindRun = function () {
            return extractDecimal(data.windrun);
        },

        gaugeShadow = function (size) {
            var offset = Math.floor(size * 0.015);
            return {
                    'box-shadow': offset + 'px ' + offset + 'px ' + offset + 'px ' + gauge.shadowColour,
                    'border-radius': Math.floor(size / 2) + 'px'
                };
        };

    //
    // Called when the document object has loaded
    // This starts the whole script.
    //
    $(document).ready(function () {
        // Kick it all off
        init();
    });

    return {
        config:     config,
        gauge:      gauge,
        setLang:    setLang,
        doTemp:     doTemp,
        doDew:      doDew,
        doHum:      doHum,
        setUnits:   setUnits,
        getWindRoseData: getWindRoseData,
        getWindRun: getWindRun,
        countDown:  countDown,
        gaugeShadow: gaugeShadow
    };
}()),

// ===============================================================================================================================
// ===============================================================================================================================
// ===============================================================================================================================

/*! Image w/ description tooltip v2.0  -  For FF1+ IE6+ Opr8+
* Created: April 23rd, 2010. This notice must stay intact for usage
* Author: Dynamic Drive at http://www.dynamicdrive.com/
* Visit http://www.dynamicdrive.com/ for full source code
* Modified: M Crossley June 2011, January 2012
* v2.-
*/

ddimgtooltip = {
    tiparray : (function () {
        var style = {background: '#FFFFFF', color: 'black', border: '2px ridge darkblue'},
            i = 11,  // set to number of tooltips required
            tooltips = [];
        for (;i--;) {
            tooltips[i] = [null, ' ', style];
        }
        return tooltips;
    }()),

    tooltipoffsets : [20, -30], //additional x and y offset from mouse cursor for tooltips

    tipDelay : 1000,

    _delayTimer : 0,

    tipprefix : 'imgtip', //tooltip DOM ID prefixes

    createtip : function ($, tipid, tipinfo) {
        if ($('#' + tipid).length === 0) { //if this tooltip doesn't exist yet
            return $('<div id="' + tipid + '" class="ddimgtooltip" />')
                        .html(
                            ((tipinfo[1]) ? '<div class="tipinfo" id="' + tipid + '_txt">' + tipinfo[1] + '</div>' : '') +
                            (tipinfo[0] !== null ? '<div style="text-align:center"><img class="tipimg" id="' + tipid + '_img" src="' + tipinfo[0] + '" /></div>' : '')
                        )
                        .css(tipinfo[2] || {})
                        .appendTo(document.body);
        }
        return null;
    },

    positiontooltip : function ($, $tooltip, e) {
        var x = e.pageX + this.tooltipoffsets[0],
            y = e.pageY + this.tooltipoffsets[1],
            tipw = $tooltip.outerWidth(),
            tiph = $tooltip.outerHeight(),
            wHght = $(window).height(),
            dTop = $(document).scrollTop();

        x = (x + tipw > $(document).scrollLeft() + $(window).width()) ? x - tipw - (ddimgtooltip.tooltipoffsets[0] * 2) : x;
        y = (y + tiph > dTop + wHght) ? dTop + wHght - tiph - 10 : y;
        $tooltip.css({left: x, top: y});
    },

    delaybox : function ($, $tooltip, e) {
        if (this.showTips) {
            ddimgtooltip._delayTimer = setTimeout(function () {
                    ddimgtooltip.showbox($tooltip.selector);
                }, ddimgtooltip.tipDelay);
        }
    },

    showbox : function (tooltip) {
        if (this.showTips) {
            //$(tooltip).show();
            $(tooltip).fadeIn();
        }
    },

    hidebox : function ($, $tooltip) {
        clearTimeout(ddimgtooltip._delayTimer);
        //$tooltip.hide();
        $tooltip.fadeOut();
    },

    showTips : false,

    init : function (targetselector) {
        $(document).ready(function ($) {
            var tiparray = ddimgtooltip.tiparray,
                $targets = $(targetselector);

            if ($targets.length === 0) {
                return;
            }
            $targets.each(function () {
                var $target = $(this),
                    tipsuffix, tipid,
                    $tooltip;
                $target.attr('id').match(/_(\d+)/); //match d of attribute id='tip_d'
                tipsuffix = parseInt(RegExp.$1, 10); //get d as integer
                tipid = this._tipid = ddimgtooltip.tipprefix + tipsuffix; //construct this tip's ID value and remember it
                $tooltip = ddimgtooltip.createtip($, tipid, tiparray[tipsuffix]);

                $target.mouseenter(function (e) {
                    var $tooltip = $('#' + this._tipid);
                    //ddimgtooltip.showbox($, $tooltip, e);
                    ddimgtooltip.delaybox($, $tooltip, e);
                });
                $target.mouseleave(function (e) {
                    var $tooltip = $('#' + this._tipid);
                    ddimgtooltip.hidebox($, $tooltip);
                });
                $target.mousemove(function (e) {
                    var $tooltip = $('#' + this._tipid);
                    ddimgtooltip.positiontooltip($, $tooltip, e);
                });
                if ($tooltip) { //add mouseenter to this tooltip (only if event hasn't already been added)
                    $tooltip.mouseenter(function () {
                        ddimgtooltip.hidebox($, $(this));
                    });
                }
            });
        }); //end dom ready
    }
};

String.prototype.trim = String.prototype.trim || function trim() {
    return this.replace(/^\s+|\s+$/g, '');
};
