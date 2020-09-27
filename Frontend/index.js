const $ = require('jquery');
const proj4 = require("proj4");
if (typeof window !== 'undefined') {
    window.proj4 = window.proj4 || proj4;
}

const Highcharts = require('Highcharts');
const Highmaps = require('Highcharts/highmaps');
const ping = require ("net-ping");

///** @type {typeof import("./Classes/TracerouteTarget")} */
//const TracerouteTarget = require('electron').remote.require('./Frontend/Classes/TracerouteTarget');
const TracerouteTarget = require('./Classes/TracerouteTarget');
const GeoIP = require('../GeoIP/GeoIP');
const TracerouteTargetCollection = require('./Classes/TracerouteTargetCollection');
const { readFile } = require('fs');

// @ts-ignore
var chart = Highmaps.mapChart('mapContainer', {
    title: {
        text: 'Geographic Traceroute'
    },

    legend: {
        align: 'left',
        layout: 'vertical',
        floating: true
    },

    mapNavigation: {
        enabled: true
    },

    plotOptions: {
        series: {
            marker: {
                fillColor: '#FFFFFF',
                lineWidth: 2,
                lineColor: Highmaps.getOptions().colors[1]
            },
            stickyTracking: false
        }
    },
    
    series: [{
        // Use the gb-all map with no data as a basemap
        mapData: require('@highcharts/map-collection/custom/world.geo.json'),
        name: 'Basemap',
        borderColor: '#707070',
        nullColor: 'rgba(200, 200, 200, 0.3)',
        showInLegend: false
    }, {
        name: 'Separators',
        type: 'mapline',
        data: Highmaps.geojson(require('@highcharts/map-collection/custom/world.geo.json'), 'mapline'),
        color: '#707070',
        showInLegend: false,
        enableMouseTracking: false
    }]
});

$("#saveGeoCache").on("click", () => {
    GeoIP.saveCache();
});

/** @type {Highcharts.Series[]} */
let chartHosts = [];

$("#test").on("click", async () => {
    /*let r = await TracerouteTargetCollection.parse(["dns.google", "1.1.1.1", "amazon.com", "spotify.com", "netflix.com"]);
    await r.trace();
    await r.analyseHops();
    await r.fixupFirstHops();
    console.log(r);*/

    let data = await new Promise(r => readFile("./sample.json", (err, data) => r(JSON.parse(data.toString()))));
    let r = new TracerouteTargetCollection([]);
    Object.assign(r, data);

    let stats = r.calcStats();

    if (chartHosts.length) chartHosts.forEach(x => x.remove());
    chartHosts = [];

    chartHosts.push(chart.addSeries({
        type: 'mappoint',
        name: 'Hosts',
        dataLabels: {
            format: '{point.name}'
        },
        tooltip: {
            pointFormat: "{point.name}"
        },
        marker: {
            symbol: "circle",
            lineColor: "#000000"
        },
        data: stats.hosts.map(x => ({
            id: x.hop.ip,
            lat: x.hop.lat,
            lon: x.hop.lon,
            name: x.hop.url
        }))
    }));

    let maxUtil = Math.max(...stats.links.map(x => x.utilisation));
    chartHosts.push(chart.addSeries({
        type: 'mapline',
        name: 'Routes',
        lineWidth: 2,
        color: Highcharts.getOptions().colors[5],
        tooltip: {
            pointFormat: "{point.name}<br>{point.description}"
        },
        data: stats.links.map(x => {
            let srcPoint = /** @type {Highcharts.Point} */(chart.get(x.source.ip));
            let snkPoint = /** @type {Highcharts.Point} */(chart.get(x.sink.ip));
            return {
                id: x.source.ip+x.sink.ip,
                path: `M${srcPoint.x} ${srcPoint.y}L${snkPoint.x} ${snkPoint.y}`,
                name: `${x.source.url} -> ${x.sink.url}`,
                color: `rgb(${255*(x.utilisation/maxUtil)},0,0)`,
                description: `${x.utilisation*100}% Utilisation`
            };
        })
    }));
});