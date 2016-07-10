new d3Helpers(["svg", "data", "allCharts", "donutChart"], function (helpers) {
  var style = {
    margin: 30,
    width: 400,
    height: 400,
    innerRadius: 0.5,
    outerRadius: 1.0
  };
  var data = [
    {abba1: 16},
    {abba2: 2},
    {abba3: 8},
    {abba4: 2},
    {abba13: 2}
  ];
  var someData = helpers.arrayOfObjectsToArrayOfKeyValues(data),
      donutChart = helpers.createDonutChart(someData, style),
      label = document.createElement("div");

  label.className = "label";

  var groupInfo = document.querySelector(".group-info");

  groupInfo.appendChild(donutChart.node());
  groupInfo.appendChild(label);

  var newData = [
    {abba1: 1},
    {abba2: 2},
    {abba3: 3},
    {abba4: 4},
    {abba5: 4},
    {abba6: 4},
    {nadaz: 4},
    {abba13: 6}
  ];

  groupInfo.addEventListener("click", function () {
    helpers.getNewDataAndAnimateDonutChartUpdate(donutChart, newData)
      .then(function () {
        for (let datumIndex = 0; datumIndex < newData.length; datumIndex++) {
          let datum = newData[datumIndex];

          for (let property in datum) {
            if (datum.hasOwnProperty(property)) {
              datum[property] += Math.floor(Math.random() * 20) * Math.round(Math.random() * 2 - 1);
              datum[property] = Math.max(datum[property], 0);
            }
          }
        }
      });
  });
});






