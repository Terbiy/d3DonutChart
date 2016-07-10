function d3Helpers() {
  "use strict";
  var args = Array.prototype.slice.call(arguments),
      callback = args.pop(),
      modules = (args[0] && typeof args[0] === "string") ? args : args[0],
      moduleName,
      moduleIndex,
      modulesLength;

  if (!(this instanceof d3Helpers)) {
    return new d3Helpers(modules, callback);
  }

  if(!modules || modules === "*") {
    modules = [];
    for (moduleName in d3Helpers.modules) {
      if (d3Helpers.modules.hasOwnProperty(moduleName)) {
        modules.push(moduleName);
      }
    }
  }

  modulesLength = modules.length;

  for (moduleIndex = 0; moduleIndex < modulesLength; moduleIndex++) {
    moduleName = modules[moduleIndex];
    d3Helpers.modules[moduleName](this);
  }

  d3Helpers.modules.essential(this);

  callback(this);
}

d3Helpers.modules = {};

d3Helpers.modules.essential = function (helpers) {
  helpers.getNumberValueOrDefault = function (value, defaultValue) {
    var result;

    if (typeof value == "number") {
      result = value;
    } else if (typeof defaultValue == "number") {
      result = defaultValue;
    } else {
      result = NaN;
    }

    return result;
  };

  helpers.getFirstObjectWithKey = function (key, data) {
    var similarObject = null;
    for (var datumIndex = 0, dataLength = data.length; datumIndex < dataLength; datumIndex++) {
      let currentObject = data[datumIndex];

      if (currentObject.key === key) {
        similarObject = currentObject;
        break;
      }
    }

    return similarObject;
  };

  helpers.getFirstObjectWithKeyIndex = function (key, data) {
    var similarObjectIndex = -1;
    for (var datumIndex = 0, dataLength = data.length; datumIndex < dataLength; datumIndex++) {
      let currentObject = data[datumIndex];

      if (currentObject.key === key) {
        similarObjectIndex = datumIndex;
        break;
      }
    }

      return similarObjectIndex;
  };

  helpers.copyObjectLight = function (objectSource, objectDestination) {
    for (let property in objectSource) {
      if (objectSource.hasOwnProperty(property)) {
        let propertyValue = objectSource[property];

        objectDestination[property] = propertyValue;
      }
    }
  };

  helpers.copyArrayLight = function (arraySource, arrayDestination) {
    for (let index = 0, sourceLength = arraySource.length; index < sourceLength; index++) {
      let element = arraySource[index];

      arrayDestination.push(element);
    }

    return arrayDestination;
  };
};

d3Helpers.modules.svg = function (helpers) {
  helpers.createSVG = function () {
    var svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    return svgElement;
  };
};

d3Helpers.modules.data = function (helpers) {
  helpers.objectToKeyValue = function (object) {
    if (typeof object == "object") {
      return d3.entries(object)[0];
    } else {
      return null;
    }
  };

  helpers.objectPartToKeyValue = function (object, key) {
    if (key && object.hasOwnProperty(key)) {
      var bufferObject = {};

      bufferObject[key] = object[key];

      return d3.entries(bufferObject)[0];
    } else {
      return null;
    }
  };

  helpers.arrayOfObjectsToArrayOfKeyValues = function (array) {
    return arrayTransformationTemplate(array, helpers.objectToKeyValue);
  };

  helpers.arrayOfObjectPartsToArrayOfKeyValues = function (array, key) {
    return arrayTransformationTemplate(array, helpers.objectPartToKeyValue, key);
  };

  function arrayTransformationTemplate(array, transformation) {
    if (Array.isArray(array) && array.length > 0) {
      var keyValueArray = [],
          transformationParameters = [],
          key;

      if (arguments.length > 2) {
        key = arguments[2];
      }

      for (let index = 0, arrayLength = array.length; index < arrayLength; index++) {
        let element = array[index];
        transformationParameters = [];

        transformationParameters.push(element);

        if (key) {
          transformationParameters.push(key);
        }

        let keyValueElement = transformation.apply(null, transformationParameters);

        if (keyValueElement !== null) {
          keyValueArray.push(keyValueElement);
        }
      }

      return keyValueArray;
    } else {
      return null;
    }
  }

  helpers._sortByValueDescending = function (array) {
    return _sortByValue(array, "descending");
  };

  helpers._sortByValueAscending = function (array) {
    return _sortByValue(array, "ascending");
  };

  function _sortByValue(array, sortType) {
    var lowerSortType = sortType.toLowerCase(),
        sortParameters = {
          greater: 0,
          less: 0
        };

    switch (lowerSortType) {
      case "ascending":
        sortParameters.greater = 1;
        sortParameters.less = -1;
        break;
      case "descending":
        sortParameters.greater = -1;
        sortParameters.less = 1;
        break;
      default:
        console.log("Unexpected sort order.");
        break;
    }

    var sortedArray = [];
    helpers.copyArrayLight(array, sortedArray);
    sortedArray.sort(function (currentObject, nextObject) {
      if (currentObject.value > nextObject.value) {
        return sortParameters.greater;
      } else if (currentObject.value < nextObject.value) {
        return sortParameters.less;
      }

      return 0;
    });

    return sortedArray;
  }

  helpers.transformAndSortData = function (array, sortType = "descending") {
    var keyValueSortedArray = [];
    keyValueSortedArray = helpers.arrayOfObjectsToArrayOfKeyValues(array);
    _sortByValue(keyValueSortedArray, sortType);

    return keyValueSortedArray;
  };

  helpers.transformAndSortDataPart = function (array, key, sortType = "descending") {
    var keyValueSortedArray = [];
    keyValueSortedArray = helpers.arrayOfObjectPartsToArrayOfKeyValues(array, key);
    _sortByValue(keyValueSortedArray, sortType);

    return keyValueSortedArray;
  };

  helpers.getIndexOfLastKeyValueMinimum = function (keyValueArray) {
    var minimumIndex = -1,
        minimum = Infinity;

    for (
      let keyValueIndex = 0,
          keyValueArrayLength = keyValueArray.length;
      keyValueIndex < keyValueArrayLength;
      keyValueIndex++
    ) {
      let currentValue = keyValueArray[keyValueIndex].value;

      if (currentValue < minimum) {
        minimum = currentValue;
        minimumIndex = keyValueIndex;
      }
    }

    return minimumIndex;
  };

  helpers.getRefinedKeyValueData = function (data) {
    var refinedData = [],
        allKeyValueData;

    if (helpers.keyValuesAreInData(data)) {
      allKeyValueData = helpers.getUpdatedToKeyValueData(data);
    } else {
      allKeyValueData = helpers.arrayOfObjectsToArrayOfKeyValues(data);
    }

    refinedData = refinedData.concat(allKeyValueData);

    return refinedData;
  };

  helpers.keyValuesAreInData = function (data) {
    var keyValuesAreInData = false;

    if (data.length) {
      for (
        let datumIndex = 0, dataLength = data.length;
        datumIndex < dataLength;
        datumIndex++
      ) {
        let datum = data[datumIndex];

        keyValuesAreInData = keyValuesAreInData || helpers.datumIsKeyValue(datum);

        if (keyValuesAreInData) {
          break;
        }
      }
    } else {
      keyValuesAreInData = helpers.datumIsKeyValue(datum);
    }

    return keyValuesAreInData;
  };

  helpers.datumIsKeyValue = function (datum) {
    var datumHasKey = datum.hasOwnProperty("key"),
        datumHasValue = datum.hasOwnProperty("value");

    return datumHasKey && datumHasValue;
  };

  helpers.getUpdatedToKeyValueData = function (data) {
    var allKeyValueData = [];

    for (
      let datumIndex = 0, dataLength = data.length;
      datumIndex < dataLength;
      datumIndex++
    ) {
      let datum = data[datumIndex];

      if (helpers.datumIsKeyValue(datum)) {
        allKeyValueData.push(datum);
      } else {
        let keyValue = helpers.objectToKeyValue(datum);

        allKeyValueData.push(keyValue);
      }
    }

    return allKeyValueData;
  };
};

d3Helpers.modules.allCharts = function (helpers) {
  helpers.prepareD3SVG = function (style, defaults) {
    const MARGIN = helpers.getNumberValueOrDefault(style.margin, defaults.margin),
          WIDTH = helpers.getNumberValueOrDefault(style.width, defaults.width),
          HEIGHT = helpers.getNumberValueOrDefault(style.height, defaults.height);

    var svgElement = helpers.createSVG(),
        svgAttributes = {
          width: WIDTH + 2 * MARGIN,
          height: HEIGHT + 2 * MARGIN
        };

    var d3SVG = (
      d3.select(svgElement)
        .attr(svgAttributes)
    );

    d3SVG.style = {};
    for (let property in style) {
      if (style.hasOwnProperty(property)) {
        let propertyValue = style[property];

        d3SVG.style[property] = propertyValue;
      }
    }

    d3SVG.style.margin = helpers.getNumberValueOrDefault(d3SVG.style.margin, MARGIN);
    d3SVG.style.width = helpers.getNumberValueOrDefault(d3SVG.style.width, WIDTH);
    d3SVG.style.height = helpers.getNumberValueOrDefault(d3SVG.style.height, HEIGHT);

    d3SVG.append("g");

    return d3SVG;
  };
};

d3Helpers.modules.barChart = function (helpers) {
  helpers.createBarChart = function (data, style = {}) {
    var refinedData = helpers.getRefinedKeyValueData(data),
        defaults = {
          margin: 20,
          width: 400,
          height: 300,
          bandInterval: 0.1,
        };

    var barChart = helpers.prepareD3SVG(style, defaults),
        bandGroup = barChart.select("g");

    var bandGroupAttributes = {
      transform: `translate(${barChart.style.margin}, ${barChart.style.margin})`
    }
    bandGroup.attr(bandGroupAttributes);

    const WIDTH = helpers.getNumberValueOrDefault(style.width, defaults.width),
          HEIGHT = helpers.getNumberValueOrDefault(style.height, defaults.height),
          BAND_INTERVAL = helpers.getNumberValueOrDefault(style.bandInterval, defaults.bandInterval);

    var x = helpers._getX(refinedData, WIDTH, BAND_INTERVAL);

    var y = helpers._getY(refinedData, HEIGHT);

    var xAxis = helpers._getXAxis(x);

    var yAxis = helpers._getYAxis(y);

    var xAxisAttributes = {
      "class": "x axis",
      transform: `translate(0, ${HEIGHT})`
    };
    bandGroup
      .append("g")
      .attr(xAxisAttributes)
      .call(xAxis);

    var yAxisAttributes = {
      "class": "y axis"
    };
    var yAxisTextAttributes = {
      transform: "rotate(-90)",
      y: 6,
      dy: "0.71em"
    };
    var yAxisTextStyle = {
      "text-anchor": "end"
    };
    bandGroup
      .append("g")
      .attr(yAxisAttributes)
      .call(yAxis)
      .append("text")
        .attr(yAxisTextAttributes)
        .style(yAxisTextStyle)
        .text("Надо как-то добавить заголовок.");

    var bandAttributes = {
      "class": "bar",
      x: function (datum) {
        return x(datum.key);
      },
      width: x.rangeBand(),
      y: function (datum) {
        return y(datum.value);
      },
      height: function (datum) {
        return HEIGHT - y(datum.value);
      }
    };
    bandGroup
      .selectAll(".bar")
      .data(refinedData)
      .enter()
      .append("rect")
        .attr(bandAttributes);

    var barTextAttributes = {
      "class": "label",
      x: function (datum) {
        return x(datum.key);
      },
      y: function (datum) {
        return y(datum.value) - 5;
      },
      width: x.rangeBand(),
      "font-family": "sans-serif",
      "font-size": "11px"
    };
    bandGroup
      .selectAll(".label")
      .data(refinedData)
      .enter()
      .append("text")
        .text(function (datum) {
          return datum.value;
        })
        .attr(barTextAttributes);

    return barChart;
  };

  helpers.updateBarChart = function (barChart, data) {
    var refinedData = helpers.getRefinedKeyValueData(data);


    var x = helpers._getX(refinedData, barChart.style.width, barChart.style.bandInterval);

    var y = helpers._getY(refinedData, barChart.style.height);

    var xAxis = helpers._getXAxis(x);

    var yAxis = helpers._getYAxis(y);

    var bandAttributes = {
      "class": "bar",
      x: function (datum) {
        return x(datum.key);
      },
      width: x.rangeBand(),
      y: function (datum) {
        return y(datum.value);
      },
      height: function (datum) {
        return barChart.style.height - y(datum.value);
      }
    };
    barChart
      .select("g")
      .selectAll(".bar")
      .data([])
      .exit()
      .remove()
    barChart
      .select("g")
      .selectAll(".bar")
      .data(refinedData, function (datum) {
        return datum.key;
      })
      .enter()
      .append("rect")
        .attr(bandAttributes)

    var barTextAttributes = {
      "class": "label",
      x: function (datum) {
        return x(datum.key);
      },
      y: function (datum) {
        return y(datum.value) - 5;
      },
      width: x.rangeBand(),
      "font-family": "sans-serif",
      "font-size": "11px"
    };
    barChart
      .select("g")
      .selectAll(".label")
      .data([])
      .exit()
      .remove()
    barChart
      .select("g")
      .selectAll(".label")
      .data(refinedData)
      .enter()
      .append("text")
        .text(function (datum) {
          return datum.value;
        })
        .attr(barTextAttributes);

    barChart
      .select("g.x.axis")
      .call(xAxis);

    barChart
      .select("g.y.axis")
      .call(yAxis);
  };

  helpers._getX = function (data, width, bandInterval) {
    var x = (
      d3.scale
        .ordinal()
        .rangeRoundBands([0, width], bandInterval)
        .domain(data.map(function (datum) {
          return datum.key;
        }))
    );

    return x;
  };

  helpers._getY = function (data, height) {
    var y = (
      d3.scale
        .linear()
        .range([height, 0])
        .domain([
          0,
          d3.max(data, function (datum) {
            return datum.value;
          })
        ])
    );

    return y;
  };

  helpers._getXAxis = function (x) {
    var xAxis = (
      d3.svg
        .axis()
        .scale(x)
        .orient("bottom")
    );

    return xAxis;
  };

  helpers._getYAxis = function (y, ticks = 10) {
    var yAxis = (
      d3.svg
        .axis()
        .scale(y)
        .orient("left")
        .ticks(ticks, "%")
    );

    return yAxis;
  };
};

function printOutKeyValues (array) {
  var string = "";
  for (let index = 0; index < array.length; index++) {
    let datum = array[index];

    string += `${datum.key}: ${datum.value}; `;
  }

  console.log(string);
}