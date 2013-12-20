/*!
 * Windrose gauge for SteeelSeries Gauges v2
 * Mark Crossley
 * Last modified : 06.03.2013
 * Revision      : 2.2.4
 */
/*global steelseries gauges RGraph */
/*jshint jquery:true nomen:false */

var windRose = (function () {
// Create some variables to hold references to the buffers
    var _bufferRose, _ctxBufferRose, _bufferRoseFrame, _bufferRoseBackground, _bufferRoseForeground, _ctxRoseGauge,
        _rosePlotSize, _gaugeSize, _gaugeTitle, _compassString, _firstRun = true,
        _canvasOdo, _showOdo, _gaugeOdo, _odoWidth, _odoHeight,
        _odoDigits = 5,  // Total number of odometer digits including the decimal

        init = function (size, showOdo) {
            var div,
                ctxFrame, ctxBackground, ctxForegound,
                roseCanvas;

            _gaugeSize = size;
            _showOdo = showOdo || false;

            // Create a hidden div to host the Rose plot
            div = document.createElement('div');
            div.style.display = 'none';
            document.body.appendChild(div);

            // Calcuate the size of the gauge background and so the size of rose plot required
            _rosePlotSize = Math.floor(_gaugeSize * 0.68);

            // rose plot canvas buffer
            _bufferRose = document.createElement('canvas');
            _bufferRose.width = _rosePlotSize;
            _bufferRose.height = _rosePlotSize;
            _bufferRose.id = 'rosePlot';
            _ctxBufferRose = _bufferRose.getContext('2d');
            div.appendChild(_bufferRose);

            // Create a steelseries gauge frame
            _bufferRoseFrame = document.createElement('canvas');
            _bufferRoseFrame.width = _gaugeSize;
            _bufferRoseFrame.height = _gaugeSize;
            ctxFrame = _bufferRoseFrame.getContext('2d');
            steelseries.drawFrame(ctxFrame, gauges.gauge.frameDesign, _gaugeSize / 2, _gaugeSize / 2, _gaugeSize, _gaugeSize);

            // Create a steelseries gauge background
            _bufferRoseBackground = document.createElement('canvas');
            _bufferRoseBackground.width = _gaugeSize;
            _bufferRoseBackground.height = _gaugeSize;
            ctxBackground = _bufferRoseBackground.getContext('2d');
            steelseries.drawBackground(ctxBackground, gauges.gauge.background, _gaugeSize / 2, _gaugeSize / 2, _gaugeSize, _gaugeSize);
            // Optional - add a background image
//            if (g_imgSmall !== null) {
//                var drawSize = g_size * 0.831775;
//                var x = (g_size - drawSize) / 2;
//                ctxBackground.drawImage(g_imgSmall, x, x, drawSize, drawSize);
//            }
            // Add the compass points
            drawCompassPoints(ctxBackground, _gaugeSize);

            // Create a steelseries gauge forground
            _bufferRoseForeground = document.createElement('canvas');
            _bufferRoseForeground.width = _gaugeSize;
            _bufferRoseForeground.height = _gaugeSize;
            ctxForegound = _bufferRoseForeground.getContext('2d');
            steelseries.drawForeground(ctxForegound, gauges.gauge.foreground, _gaugeSize, _gaugeSize, false);

            // Get the context of the gauge canvas on the HTML page
            if ($('#canvas_rose').length) {
                roseCanvas = document.getElementById('canvas_rose');
                _ctxRoseGauge = roseCanvas.getContext('2d');
                // resize canvas on main page
                roseCanvas.width = _gaugeSize;
                roseCanvas.height = _gaugeSize;
                // add a shadow to the gauge
                if (gauges.config.showGaugeShadow) {
                    $('#canvas_rose').css(gauges.gaugeShadow(_gaugeSize));
                }

                // Render an empty gauge, looks better than just the shadow background and odometer ;)
                // Paint the gauge frame
                _ctxRoseGauge.drawImage(_bufferRoseFrame, 0, 0);

                // Paint the gauge background
                _ctxRoseGauge.drawImage(_bufferRoseBackground, 0, 0);

                // Paint the gauge foreground
                _ctxRoseGauge.drawImage(_bufferRoseForeground, 0, 0);

                // Create an odometer
                if (_showOdo) {
                    _odoHeight = Math.ceil(_gaugeSize * 0.08); // Sets the size of the odometer
                    _odoWidth = Math.ceil(Math.floor(_odoHeight * 0.68) * _odoDigits);  // 'Magic' number, do not alter
                    // Create a new canvas for the oodometer
                    _canvasOdo = document.createElement('canvas');
                    $(_canvasOdo).attr({
                        'id': 'canvas_odo',
                        'width': _odoWidth,
                        'height': _odoHeight
                    });
                    // Position it
                    $(_canvasOdo).css({
                        'position': 'absolute',
                        'top': Math.ceil(_gaugeSize * 0.7 + $('#canvas_rose').position().top) + 'px',
                        'left': Math.ceil((_gaugeSize - _odoWidth) / 2 + $('#canvas_rose').position().left) + 'px'
                    });
                    // Insert it into the DOM before the Rose gauge
                    $(_canvasOdo).insertBefore('#canvas_rose');
                    // Create the odometer
                    _gaugeOdo = new steelseries.Odometer('canvas_odo', {
                        height: _odoHeight,
                        digits: _odoDigits - 1,
                        decimals: 1
                    });
                }
            }

            _firstRun = false;
        },


        // Just draw an empty gauge as a placeholder when the page loads
        // NOT currently used
/*
        drawWindRose = function () {
            if (_ctxRoseGauge) {
                // Paint the gauge frame
                _ctxRoseGauge.drawImage(_bufferRoseFrame, 0, 0);

                // Paint the gauge background
                _ctxRoseGauge.drawImage(_bufferRoseBackground, 0, 0);

                // Paint the gauge foreground
                _ctxRoseGauge.drawImage(_bufferRoseForeground, 0, 0);
            }
        },
*/
        // Redraw the gauge with data
        doWindRose = function () {
            var rose,
                offset,
                data;

            if (_ctxRoseGauge && !_firstRun) {
                data = gauges.getWindRoseData();

                // Clear the gauge
                _ctxRoseGauge.clearRect(0, 0, _gaugeSize, _gaugeSize);

                // Clear the existing rose plot
                _ctxBufferRose.clearRect(0, 0, _rosePlotSize, _rosePlotSize);

                // Create a new rose plot
                rose = new RGraph.Rose('rosePlot', data);
                rose.Set('chart.strokestyle', 'black');
                rose.Set('chart.background.axes.color', 'gray');
                rose.Set('chart.colors.alpha', 0.5);
                rose.Set('chart.colors', ['Gradient(#408040:red:#7070A0)']);
                rose.Set('chart.margin', Math.ceil(40 / data.length));

                rose.Set('chart.title', _gaugeTitle);
                rose.Set('chart.title.size', Math.ceil(0.05 * _rosePlotSize));
                rose.Set('chart.title.bold', false);
                rose.Set('chart.gutter.top', 0.2 * _rosePlotSize);
                rose.Set('chart.gutter.bottom', 0.2 * _rosePlotSize);

                rose.Set('chart.tooltips.effect', 'snap');
                rose.Set('chart.labels.axes', '');
                rose.Set('chart.background.circles', true);
                rose.Set('chart.background.grid.spokes', 16);
                rose.Set('chart.radius', _rosePlotSize / 2);
                rose.Draw();

                // Paint the gauge frame
                _ctxRoseGauge.drawImage(_bufferRoseFrame, 0, 0);

                // Paint the gauge background
                _ctxRoseGauge.drawImage(_bufferRoseBackground, 0, 0);

                // Paint the rose plot
                offset = Math.floor((_gaugeSize - _rosePlotSize) / 2);
                _ctxRoseGauge.drawImage(_bufferRose, offset, offset);

                // Paint the gauge foreground
                _ctxRoseGauge.drawImage(_bufferRoseForeground, 0, 0);

                // update the odometer
                if (_showOdo) {
                    _gaugeOdo.setValueAnimated(gauges.getWindRun());
                }
            }
        },


        // Helper function to put the compass points on the background
        drawCompassPoints = function (ctx, size) {
            ctx.save();
            // set the font
            ctx.font = 0.08 * size + 'px serif';
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Draw the compass points
            for (var i = 0; i < 4; i++) {
                ctx.translate(size / 2, size * 0.125);
                ctx.fillText(_compassString[i * 2], 0, 0, size);
                ctx.translate(-size / 2, -size * 0.125);
                // Move to center
                ctx.translate(size / 2, size / 2);
                ctx.rotate(Math.PI / 2);
                ctx.translate(-size / 2, -size / 2);
            }
            ctx.restore();
        },

        setTitle = function (newTitle) {
            _gaugeTitle = newTitle;
        },

        setCompassString = function (newStr) {
            var ctxBackground;

            _compassString = newStr;

            if (!_firstRun) {
                // get the background context
                ctxBackground = _bufferRoseBackground.getContext('2d');

                // Redraw the background
                steelseries.drawBackground(ctxBackground, gauges.gauge.background, _gaugeSize / 2, _gaugeSize / 2, _gaugeSize, _gaugeSize);

                // Add the compass points
                drawCompassPoints(ctxBackground, _gaugeSize);
            }
        };

    return {
        init: init,
        doWindRose: doWindRose,
        setTitle: setTitle,
        setCompassString: setCompassString
    };

}());
