d3Helpers.modules.donutChart = function (helpers) {
  // style
  //   margin
  //   width
  //   height
  //   colors
  //   innerRadius
  //   outerRadiuss
  helpers.createDonutChart = function (data, style = {}) {
    if (!(data[0].hasOwnProperty("key") && data[0].hasOwnProperty("value"))) {
      return null;
    }

    var defaults = {
      margin: 20,
      width: 120,
      height: 120
    };
    var d3SVG = helpers.prepareD3SVG(style, defaults),
        donutChart = d3SVG.select("g");

    var chartAttributes = {
      transform: `translate(${d3SVG.style.width / 2 + d3SVG.style.margin}, ${d3SVG.style.height / 2 + d3SVG.style.margin})`
    };

    donutChart.attr(chartAttributes);

    var pie = helpers._getUnsortedPieData();

    var colors = helpers._getColors(style);

    var arcWorkpiece = helpers._getArcWorkpiece(style);
    var pieData = pie(data);
    var donutArcs = (
      donutChart
        .selectAll(".arc")
        .data(pieData)
        .enter()
        .append("path")
          .attr({
            "class": "arc",
            d: arcWorkpiece
          })
          .style({
            fill: function (datum, datumIndex) {
              return colors(datumIndex);
            }
          })
    );

    return d3SVG;
  };

  helpers.getNewDataAndAnimateDonutChartUpdate = function (donutChart, data) {
    var keyValueData = helpers.arrayOfObjectsToArrayOfKeyValues(data),
        fullAnimation = helpers.animateDonutChartUpdate(donutChart, keyValueData);

    return fullAnimation;
  };

  helpers.animateDonutChartUpdate = function (donutChart, data) {
    var fullAnimation = new Promise(function (resolve, reject) {
      helpers._addNewData(donutChart, data);
      helpers._animateSegmentsWidthChange(donutChart, data)
        .then(helpers._removeZeroData)
        .then(helpers._animateSegmentsThicknessDecrease)
        .then(helpers._animateSegmentsDescendingOrder)
        .then(helpers._animateSegmentsThicknessIncrease)
        .then(helpers._updateColors)
        .then(resolve);
    });

    return fullAnimation;
  };

  helpers._addNewData = function (donutChart, data) {
    var arcs = donutChart.selectAll(".arc"),
        initialDonutArcsData = arcs.data();

    var initialDonutData = initialDonutArcsData.map(function (arcDatum) {
      return arcDatum.data;
    });

    var colors = helpers._getColors(donutChart.style);

    var oldDataWithZeroedNewKeys = helpers._getDataWithZeroedNewProperties(initialDonutData, data),
        zeroedDataSortedOriginally = helpers._getNewDataSortedOriginally(initialDonutArcsData, oldDataWithZeroedNewKeys),
        pie = helpers._getUnsortedPieData(),
        pieData = pie(zeroedDataSortedOriginally),
        arcWorkpiece = helpers._getArcWorkpieceFromDonutChart(donutChart);

    donutChart
      .select("g")
      .selectAll(".arc")
      .data(pieData, function (datum) {
        return datum.data.key;
      })
      .enter()
      .append("path")
        .attr({
          "class": "arc",
          d: arcWorkpiece
        })
        .style({
          fill: function (datum, datumIndex) {
            return colors(datumIndex);
          }
        })

    return [donutChart, data];
  };

  helpers._animateSegmentsWidthChange = function (donutChart, data) {
    if (!data) {
      data = donutChart[1];
      donutChart = donutChart[0];
    }

    var arcs = donutChart.selectAll(".arc"),
        initialDonutArcsData = arcs.data();
    var newDataSortedOriginally = helpers._getNewDataSortedOriginally(initialDonutArcsData, data),
        pie = helpers._getUnsortedPieData(),
        pieData = pie(newDataSortedOriginally);

    var arcWorkpiece = helpers._getArcWorkpieceFromDonutChart(donutChart);

    var initialDonutData = initialDonutArcsData.map(function (arcDatum) {
      return arcDatum.data;
    });

    var animationPromise = new Promise(function (resolve, reject) {
      arcs
        .transition()
        .duration(1000)
        .attrTween("d", function(arcDatum) {
          var newDatum = pieData[
            helpers.getFirstObjectWithKeyIndex(arcDatum.data.key, newDataSortedOriginally)
          ];
          var getInterpolationValue = d3.interpolate(arcDatum, newDatum);

          return function(timePassed) {
            return arcWorkpiece(
              getInterpolationValue(timePassed)
            );
          };
        })
        .each("end", function (datum, datumIndex) {
          if (datumIndex === pieData.length - 1) {
            var chartAndData = [];
            chartAndData.push(donutChart, data);
            resolve(chartAndData);
          }
        });
    });

    animationPromise.then(function () {
      arcs.data(pieData, function (datum) {
        return datum.data.key;
      });
    });

    return animationPromise;
  };

  helpers._removeZeroData = function (donutChart, data) {
    if (!data) {
      data = donutChart[1];
      donutChart = donutChart[0];
    }

    var arcs = donutChart.selectAll(".arc"),
        initialDonutArcsData = arcs.data();

    var dataWithoutZeroes = helpers._getDataWithRemovedZeroValues(data),
        dataWithoutZeroesSortedOriginally = helpers._getNewDataSortedOriginally(initialDonutArcsData, dataWithoutZeroes),
        pie = helpers._getUnsortedPieData(),
        pieData = pie(dataWithoutZeroesSortedOriginally),
        arcWorkpiece = helpers._getArcWorkpieceFromDonutChart(donutChart);

    donutChart
      .select("g")
      .selectAll(".arc")
      .data(pieData, function (datum) {
        return datum.data.key;
      })
      .exit()
      .remove();

    return [donutChart, data];
  };

  helpers._animateSegmentsThicknessDecrease = function (donutChart, data) {
    if (!data) {
      data = donutChart[1];
      donutChart = donutChart[0];
    }

    var style = donutChart.style,
        radiusCandidate = Math.min(
          style.width,
          style.height
        ) / 2;

    var arcs = donutChart.selectAll(".arc");

    var initialDonutArcsData = arcs.data();

    var dataWithoutZeroes = helpers._getDataWithRemovedZeroValues(data),
        sortedCopyOfData = helpers._getNewDataSortedOriginally(initialDonutArcsData, dataWithoutZeroes),
        layeredData = helpers._getObjectsWithLayersData(sortedCopyOfData);

    var animationPromise = new Promise(function (resolve, reject) {
      arcs
        .transition()
        .duration(1000)
        .attrTween("d", function (arcDatum) {
          var oldInnerRadius = helpers._getInnerRadiusFromArc(this) / radiusCandidate,
              oldOuterRadius = helpers._getOuterRadiusFromArc(this) / radiusCandidate,
              key = arcDatum.data.key,
              layeredDatum = helpers.getFirstObjectWithKey(key, layeredData);

          var newInnerRadius = (
            oldInnerRadius +
            (oldOuterRadius - oldInnerRadius) * layeredDatum.innerRadius
          );

          var newOuterRadius = (
            oldInnerRadius +
            (oldOuterRadius - oldInnerRadius) * layeredDatum.outerRadius
          );

          var oldRadiuses = {
            innerRadius: oldInnerRadius,
            outerRadius: oldOuterRadius
          };

          var newRadiuses = {
            innerRadius: newInnerRadius,
            outerRadius: newOuterRadius
          };

          var getInterpolationValue = d3.interpolateObject(oldRadiuses, newRadiuses);

          return function (time) {
            var currentRadiuses = getInterpolationValue(time);
            arcWorkpiece = helpers._modifyArcWorkpiece(donutChart, currentRadiuses);

            return arcWorkpiece(arcDatum);
          };
        })
        .each("end", function (datum, datumIndex) {
          if (datumIndex === initialDonutArcsData.length - 1) {
            var chartAndData = [];
            chartAndData.push(donutChart, data);
            resolve(chartAndData);
          }
        });
    });

    return animationPromise;
  };

  helpers._animateSegmentsDescendingOrder = function (donutChart, data) {
    if (!data) {
      data = donutChart[1];
      donutChart = donutChart[0];
    }
    var sortedDescendingData = helpers._sortByValueDescending(data);

    var arcs = donutChart.selectAll(".arc"),
        initialDonutArcsData = arcs.data();

    var pie = helpers._getUnsortedPieData();
    var sortedPieData = pie(sortedDescendingData);

    var arcWorkpiece = helpers._getArcWorkpieceFromDonutChart(donutChart);

    var sortedDonutData = sortedPieData.map(function (arcDatum) {
      return arcDatum.data;
    });

    var animationPromise = new Promise(function (resolve, reject) {
      arcs
        .transition()
        .duration(1000)
        .attrTween("d", function (arcDatum) {
          var newDatum = sortedPieData[
            helpers.getFirstObjectWithKeyIndex(arcDatum.data.key, sortedDonutData)
          ];
          var getInterpolationValue = d3.interpolate(arcDatum, newDatum);

          return function(timePassed) {
            return arcWorkpiece(
              getInterpolationValue(timePassed)
            );
          };
        })
        .each("end", function (datum, datumIndex) {
          if (datumIndex === initialDonutArcsData.length - 1) {
            var chartAndData = [];
            chartAndData.push(donutChart, data);
            resolve(chartAndData);
          }
        });
    });

    animationPromise.then(function () {
      arcs.data(sortedPieData, function (datum) {
        return datum.data.key;
      });
    });


    return animationPromise;
  };

  helpers._animateSegmentsThicknessIncrease = function (donutChart, data) {
    if (!data) {
      data = donutChart[1];
      donutChart = donutChart[0];
    }

    var style = donutChart.style,
        radiusCandidate = Math.min(
          style.width,
          style.height
        ) / 2;

    var arcs = donutChart.selectAll(".arc"),
        initialDonutArcsData = arcs.data();

    var animationPromise = new Promise(function (resolve, reject) {
      arcs
        .transition()
        .duration(1000)
        .attrTween("d", function (arcDatum) {
          var oldInnerRadius = helpers._getInnerRadiusFromArc(this) / radiusCandidate,
              oldOuterRadius = helpers._getOuterRadiusFromArc(this) / radiusCandidate;

          var newInnerRadius = style.innerRadius;

          var newOuterRadius = style.outerRadius;

          var oldRadiuses = {
            innerRadius: oldInnerRadius,
            outerRadius: oldOuterRadius
          };

          var newRadiuses = {
            innerRadius: newInnerRadius,
            outerRadius: newOuterRadius
          };

          var getInterpolationValue = d3.interpolateObject(oldRadiuses, newRadiuses);

          return function (time) {
            var currentRadiuses = getInterpolationValue(time);

            arcWorkpiece = helpers._modifyArcWorkpiece(donutChart, currentRadiuses);

            return arcWorkpiece(arcDatum);
          };
        })
        .each("end", function (datum, datumIndex) {
          if (datumIndex === initialDonutArcsData.length - 1) {
            var chartAndData = [];
            chartAndData.push(donutChart, data);
            resolve(chartAndData);
          }
        });
    });

    return animationPromise;
  };

  helpers._updateColors = function (donutChart, data) {
    if (!data) {
      data = donutChart[1];
      donutChart = donutChart[0];
    }

    var arcs = donutChart.selectAll(".arc"),
        initialDonutArcsData = arcs.data(),
        colors = helpers._getColors(donutChart.style),
        sortedCopyOfData = helpers._getNewDataSortedOriginally(initialDonutArcsData, data),
        pie = helpers._getUnsortedPieData(),
        pieData = pie(sortedCopyOfData);

    var animationPromise = new Promise(function (resolve, reject) {
      arcs
        .data(pieData, function (datum) {
          return datum.data.key;
        })
        .transition()
        .duration(1000)
        .attrTween("style", function (datum, datumIndex) {
          var currentFill = d3.rgb(d3.select(this).style("fill")),
              newRGB = d3.rgb(colors(datumIndex)),
              getInterpolationValue = d3.interpolateRgb(currentFill, newRGB);

          return function (progress) {
            return `fill: ${getInterpolationValue(progress)}`;
          };
        })
        .each("end", function (datum, datumIndex) {
          if (datumIndex === initialDonutArcsData.length - 1) {
            var chartAndData = [];
            chartAndData.push(donutChart, data);
            resolve(chartAndData);
          }
        });
    });

    return animationPromise;
  };

  helpers._getObjectsWithLayersData = function (data) {
    var dataWithLayers = [],
        dataCopy = [];

    for (let datumIndex = 0, dataLength = data.length; datumIndex < dataLength; datumIndex++) {
      let datum = data[datumIndex];
      dataCopy.push(datum);
    }

    var layers = [],
        minimumIndex,
        secondMinimumIndex;

    while (dataCopy.length > 0) {
      let layer = [];
      layers.push(layer);

      do {
        minimumIndex = helpers.getIndexOfLastKeyValueMinimum(dataCopy);

        let currentMinimum = dataCopy.splice(minimumIndex, 1)[0];
        layer.push(currentMinimum);

        secondMinimumIndex = helpers.getIndexOfLastKeyValueMinimum(dataCopy);
      } while (secondMinimumIndex < minimumIndex && secondMinimumIndex >= 0);
    }

    var layerThickness = 1 / layers.length,
        layerStart = 0;

    for (let layerIndex = 0, layersLength = layers.length; layerIndex < layersLength; layerIndex++) {
      let layer = layers[layerIndex],
          layerEnd = layerStart + layerThickness;

      if (layerIndex === layersLength - 1) {
        layerEnd = 1;
      }

      for (let datumIndex = 0, layerLength = layer.length; datumIndex < layerLength; datumIndex++) {
        let datumOrigin = layer[datumIndex],
            datum = {};

        datum.key = datumOrigin.key;
        datum.value = datumOrigin.value;
        datum.innerRadius = layerStart;
        datum.outerRadius = layerEnd;

        dataWithLayers.push(datum);
      }

      layerStart = layerEnd;
    }

    return dataWithLayers;
  };

  helpers._getUnsortedPieData = function () {
    var pie = (
      d3.layout
        .pie()
        .sort(null)
        .value(function(datum, datumIndex) {
          var value = parseFloat(datum.value);
          return value;
        })
    );

    return pie;
  };

  helpers._getArcWorkpiece = function (style) {
    var radiusCandidate,
        arcWorkpiece;

    if (!style.hasOwnProperty(length)) {
      radiusCandidate = Math.min(
        style.width,
        style.height
      ) / 2;
      const RADIUS = !isNaN(radiusCandidate) ? radiusCandidate : 60;

      var innerRadius = helpers.getNumberValueOrDefault(style.innerRadius, 0.6);
          outerRadius = helpers.getNumberValueOrDefault(style.outerRadius, 1.0);

      arcWorkpiece = (
        d3.svg
          .arc()
          .innerRadius(RADIUS * innerRadius)
          .outerRadius(RADIUS * outerRadius)
      );
    } else if (style.hasOwnProperty(length)) {
      var arcIndex = 0,
          styleLength = style.length;
      radiusCandidate = Math.min(
        style[0].width,
        style[0].height
      ) / 2;
      const RADIUS = !isNaN(radiusCandidate) ? radiusCandidate : 60;

      arcWorkpiece = (
        d3.svg
          .arc()
          .innerRadius(function (datum) {
            arcIndex %= styleLength;

            var currentStyle = style[arcIndex];
            var innerRadius = helpers.getNumberValueOrDefault(currentStyle.innerRadius, 0.6);


            return RADIUS * innerRadius;
          })
          .outerRadius(function (datum) {
            var currentStyle = style[arcIndex];
            var outerRadius = helpers.getNumberValueOrDefault(currentStyle.outerRadius, 1.0);

            arcIndex++;

            return RADIUS * outerRadius;
          })
      );
    }

    return arcWorkpiece;
  };

  helpers._getArcWorkpieceFromDonutChart = function (donutChart) {
    var style = donutChart.style;
    var arcsStyles = [];

    var arcs = donutChart.selectAll(".arc");

    for (let arcIndex = 0, arcsLength = arcs[0].length; arcIndex < arcsLength; arcIndex++) {
      let arcStyle = helpers._mergeStyles(style, {}),
          arc = arcs[0][arcIndex],
          radiusCandidate = Math.min(
            style.width,
            style.height
          ) / 2;

      let arcRadiuses = {
        innerRadius: helpers._getInnerRadiusFromArc(arc) / radiusCandidate,
        outerRadius: helpers._getOuterRadiusFromArc(arc) / radiusCandidate
      };

      arcStyle = helpers._mergeStyles(arcRadiuses, arcStyle);

      arcsStyles.push(arcStyle);
    }

    var arcWorkpiece = helpers._getArcWorkpiece(arcsStyles);

    return arcWorkpiece;
  };

  helpers._modifyArcWorkpiece = function (donutChart, style) {
    var finalStyle = {},
        currentStyle = donutChart.style;

    finalStyle = helpers._mergeStyles(currentStyle, finalStyle);
    finalStyle = helpers._mergeStyles(style, finalStyle);

    var arcWorkpiece = helpers._getArcWorkpiece(finalStyle);

    return arcWorkpiece;
  };

  helpers._getInnerRadiusFromArc = function (arc) {
    var numbersInPattern = helpers._getArcNumbers(arc);

    if (numbersInPattern.length < 4) {
      return 0;
    }

    var innerRadius = Math.min.apply(null, numbersInPattern);

    return innerRadius;
  };

  helpers._getOuterRadiusFromArc = function (arc) {
    var numbersInPattern = helpers._getArcNumbers(arc);

    if (numbersInPattern.length < 2) {
      return 0;
    }

    var outerRadius = Math.max.apply(null, numbersInPattern);

    return outerRadius;
  };

  helpers._getArcNumbers = function (arc) {
    var pathDescription = arc.getAttribute("d");

    const numberRegExp = /[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/g;
    var arcPattern = new RegExp("A" + numberRegExp.source + "," + numberRegExp.source, "g");
    var arcParameters = pathDescription.match(arcPattern);

    var numbersInPattern = [];

    if (arcParameters === null) {
      return numbersInPattern;
    }

    for (let parameterIndex = 0; parameterIndex < arcParameters.length; parameterIndex++) {
      let parameter = arcParameters[parameterIndex];

      let numbers = parameter.match(numberRegExp);

      if (numbers !== null) {
        numbersInPattern = numbersInPattern.concat(numbers);
      }
    }

    numbersInPattern = numbersInPattern.map(function (numberString) {
      return parseFloat(numberString);
    });

    return numbersInPattern;
  };

  helpers._mergeStyles = function (styleSource, styleDestination) {
    var finalStyle = {};
    if (!styleSource.hasOwnProperty(length)) {
      helpers.copyObjectLight(styleDestination, finalStyle);
      helpers.copyObjectLight(styleSource, finalStyle);
    } else {
      let styleBufferArray = [];

      for (
        let styleIndex = 0,
            styleSourceLength = styleSource.length;
        styleIndex < styleSourceLength;
        styleIndex++
      ) {
        let style = styleSource[styleIndex];

        let bufferStyle = {};
        helpers.copyObjectLight(styleDestination, bufferStyle);
        helpers.copyObjectLight(style, bufferStyle);

        styleBufferArray.push(bufferStyle);
      }

      finalStyle = styleBufferArray;
    }

    return finalStyle;
  };

  helpers._getNewDataSortedOriginally = function (initialData, newData, parameter = "startAngle") {
    var newDataSortedOriginally = [],
        newDatumElements = [];

    var sortedCopiedInitialData = helpers._getSortedAscendingCopyOfData(initialData, parameter),
        copiedNewData = helpers.copyArrayLight(newData, newDatumElements);

    for (
      let datumIndex = 0, initialDataLength = sortedCopiedInitialData.length;
      datumIndex < initialDataLength;
      datumIndex++
    ) {
      let key = sortedCopiedInitialData[datumIndex].data.key,
          datumFromNewDataIndex = helpers.getFirstObjectWithKeyIndex(key, copiedNewData);

      if (datumFromNewDataIndex > -1) {
        datumFromNewData = copiedNewData.splice(datumFromNewDataIndex, 1)[0];
      } else {
        datumFromNewData = null;
      }

      if (datumFromNewData) {
        newDataSortedOriginally.push(datumFromNewData);
      }
    }

    newDataSortedOriginally = newDataSortedOriginally.concat(copiedNewData);

    return newDataSortedOriginally;
  };

  helpers._getSortedAscendingCopyOfData = function (data, parameter = "startAngle") {
    var copiedData = [];

    helpers.copyArrayLight(data, copiedData);

    copiedData.sort(function (a, b) {
      return a[parameter] - b[parameter];
    });

    return copiedData;
  };

  helpers._getDataWithZeroedNewProperties = function (initialData, newData) {
    var copiedNewData = [],
        zeroedNewData = [];
    helpers.copyArrayLight(newData, copiedNewData);

    for (
      let datumIndex = 0, initialDataLength = initialData.length;
      datumIndex < initialDataLength;
      datumIndex++
    ) {
      let datum = initialData[datumIndex],
          newDatumIndex = helpers.getFirstObjectWithKeyIndex(datum.key, copiedNewData);


      if (newDatumIndex > -1) {
        copiedNewData.splice(newDatumIndex, 1);
      }

      zeroedNewData.push(datum);
    }

    for (
      let datumIndex = 0, addedDataLength = copiedNewData.length;
      datumIndex < addedDataLength;
      datumIndex++
    ) {
      let newDatum = copiedNewData[datumIndex],
          addedDatum = {};
      helpers.copyObjectLight(newDatum, addedDatum);

      addedDatum.value = 0;

      zeroedNewData.push(addedDatum);
    }

    return zeroedNewData;
  };

  helpers._getDataWithRemovedZeroValues = function (data) {
    var dataWithoutZeroes = [];

    for (
      let datumIndex = 0, dataLength = data.length;
      datumIndex < dataLength;
      datumIndex++
    ) {
      let datum = data[datumIndex];

      if (datum.value !== 0) {
        dataWithoutZeroes.push(datum);
      }
    }

    return dataWithoutZeroes;
  };

  helpers._getColors = function (style) {
    var colors;

    if (style.colors) {
      colors = (
        d3.scale
          .ordinal()
          .range(style.colors)
      );
    } else {
      colors = (
        d3.scale
          .category20c()
      );
    }

    return colors;
  };
};