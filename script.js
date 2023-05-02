// Set dimensions for the SVG
const width = 960;
const height = 500;

// Define the projection and path
const projection = d3
  .geoEquirectangular()
  .translate([width / 2, height / 2])
  .scale(153);

const path = d3.geoPath().projection(projection);

// Create the SVG container
const svg = d3.select("#map").attr("width", width).attr("height", height);

// Load the world GeoJSON data
d3.json("https://d3js.org/world-110m.v1.json").then((world) => {
  const countries = topojson.feature(world, world.objects.countries).features;

  // Draw the map
  svg
    .selectAll("path")
    .data(countries)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "lightgrey")
    .attr("stroke", "white");

  // Get the sun's position using a public API
  getSunPosition();

  // Update the sun's position every minute
  setInterval(getSunPosition, 1000);
});
// timeJump is 1 hour
const timeJump = 60 * 60 * 1000;
let time = new Date().getTime() - timeJump;
function getSunPosition() {
  const date = (time += timeJump);
  const lat = 0;
  const lng = 0;
  const sunPositionRaw = SunCalc.getPosition(date, lat, lng);
  const sunPosition = {
    latitude: sunPositionRaw.altitude * (180 / Math.PI),
    longitude: sunPositionRaw.azimuth * (180 / Math.PI),
  };

  // Clear previous sun line
  svg.selectAll(".sun-line").remove();

  // Calculate the line of the sun
  const sunLine = getSunLine(sunPosition);

  // Draw the sun line
  svg
    .append("path")
    .datum(sunLine)
    .attr("class", "sun-line")
    .attr("d", path)
    .attr("stroke", "orange")
    .attr("stroke-width", 2)
    .attr("fill", "none");

  // Highlight countries in daylight
  svg
    .selectAll("path")
    .attr("fill", (d) => (isDaylight(sunPosition, d) ? "yellow" : "lightgrey"));
}

function getSunLine(sunPosition) {
  // Calculate the line of the sun based on the sun's position
  // You can use more accurate algorithms, but this is a simple approximation
  const lat = sunPosition.latitude;
  const lng = sunPosition.longitude;

  return [
    {
      type: "LineString",
      coordinates: [
        [-180, lat],
        [lng, lat],
        [180, lat],
      ],
    },
  ];
}

function isDaylight(sunPosition, country) {
  // This is a simple approximation and may not be accurate for all locations
  const sunLat = sunPosition.latitude;
  const sunLng = sunPosition.longitude;

  // Get the centroid of the country
  const centroid = d3.geoCentroid(country);

  // Check if the country's centroid is within the range of daylight
  const latDiff = Math.abs(centroid[1] - sunLat);
  const lngDiff = Math.abs(centroid[0] - sunLng);

  // You can adjust the following thresholds for a more accurate representation of daylight
  const latThreshold = 90;
  const lngThreshold = 180;

  return latDiff <= latThreshold && lngDiff <= lngThreshold;
}
