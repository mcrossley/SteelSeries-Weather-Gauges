Installation Instructions:

WEEWX_SKINS_DIR is the location of the weewx skins directory:
  If you installed weewx from .deb or .rpm, this is /etc/weewx/skins
  If you installed weewx using setup.py, this is /home/weewx/skins

1) copy files

mkdir WEEWX_SKINS_DIR/ss
cp weather_server/WeeWX/skin.conf WEEWX_SKINS_DIR/ss
cp weather_server/WeeWX/index.html.tmpl WEEWX_SKINS_DIR/ss
cp weather_server/WeeWX/gauge-data.txt.tmpl WEEWX_SKINS_DIR/ss
mkdir WEEWX_SKINS_DIR/ss/css
cp web_server/css/*.css WEEWX_SKINS_DIR/ss/css
mkdir WEEWX_SKINS_DIR/ss/scripts
cp web_server/scripts/*.js WEEWX_SKINS_DIR/ss/scripts

2) make adjustments to WEEWX_SKINS_DIR/ss/scripts/gauges.js

weatherProgram : 6,
imgPathURL : '',
stationTimeout : 10,        // set to twice archive interval, in minutes
showUvGauge : true,         // false if there is no UV sensor
showSolarGauge : true,      // false if there is no solar radiation sensor
showRoseGauge : false,      // true if field WindRoseData is populated

3) add a SteelSeries section to StdReport in weewx.conf

[StdReport]
    ...
    [[SteelSeries]]
        skin = ss
        HTML_ROOT = public_html/ss

4) restart weewx

sudo /etc/init.d/weewx stop
sudo /etc/init.d/weewx start
