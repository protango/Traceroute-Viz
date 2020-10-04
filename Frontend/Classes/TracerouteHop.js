const { Resolver } = require('dns');
const GeoIP = require('../../GeoIP/GeoIP');
const Dns = require('./Dns');

var resolver = new Resolver();
resolver.setServers(["1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4"]);

class TracerouteHop {
    /** @type {number} */
    ttl
    /** @type {number} */
    roundTripTime
    /** @type {string} */
    ip
    /** @type {number} */
    lat
    /** @type {number} */
    lon
    /** @type {string} */
    city
    /** @type {string} */
    country
    /** @type {string} */
    url

    /**
     * @param {number} ttl 
     * @param {number} rtt 
     * @param {string} ip 
     */
    constructor(ttl, rtt, ip) {
        this.ttl = ttl;
        this.roundTripTime = rtt;
        this.ip = ip;
    }

    async analyse() {
        let geo = await GeoIP.lookup(this.ip);
        this.lat = geo.latitude;
        this.lon = geo.longitude;
        this.city = geo.city;
        this.country = geo.country_name;

        try { this.url = await Dns.reverse(this.ip); }
        catch { this.url = this.ip; }
    }
}

module.exports = TracerouteHop;