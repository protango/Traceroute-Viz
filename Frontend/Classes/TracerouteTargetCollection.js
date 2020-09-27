const TracerouteTarget = require("./TracerouteTarget");
const GeoIP = require('../../GeoIP/GeoIP');
const publicIp = require('public-ip');
const TracerouteHop = require("./TracerouteHop");

class TracerouteTargetCollection {
    /** @type {TracerouteTarget[]} */
    targets = [];

    /**
     * @param {TracerouteTarget[]} targets 
     */
    constructor(targets) {
        this.targets = targets;
    }

    /**
     * @param {string[]} targets 
     */
    static async parse(targets) {
        return new TracerouteTargetCollection(await Promise.all(targets.map(x => TracerouteTarget.parse(x))));
    }

    async trace() {
        await Promise.all(this.targets.map(x => x.trace()));
    }

    async analyseHops() {
        await Promise.all(this.targets.map(x => Promise.all(x.hops.map(y => y.analyse()))));
    }

    async fixupFirstHops() {
        let extIp = await publicIp.v4();
        let geo = await GeoIP.lookup(extIp);

        for (let t of this.targets) {
            for (let h of t.hops) {
                if (h.lat) break;
                h.lat = geo.latitude;
                h.lon = geo.longitude;
                h.city = geo.city;
            }
        }
    }

    calcStats() {
        /** @type {Object.<string, {hop: TracerouteHop, utilisation: number}>} */
        let hosts = {};

        /** @type {Object.<string, {source: TracerouteHop, sink: TracerouteHop, utilisation: number}>} */
        let links = {};

        let totalHopCount = 0;
        for (let t of this.targets) {
            let lastHop = null;
            for (let h of t.hops) {
                let metaHost = hosts[h.ip];
                if (!metaHost) {
                    hosts[h.ip] = metaHost = {hop: h, utilisation: 0};
                }
                metaHost.utilisation++;

                if (lastHop) {
                    let metaLink = links[lastHop.ip + h.ip];
                    if (!metaLink) {
                        links[lastHop.ip + h.ip] = metaLink = {source: lastHop, sink: h, utilisation: 0};
                    }
                    metaLink.utilisation++;
                }

                totalHopCount++;
                lastHop = h;
            }
        }

        for (let ip in hosts) {
            hosts[ip].utilisation /= totalHopCount;
        }

        for (let ipPair in links) {
            links[ipPair].utilisation /= totalHopCount - this.targets.length;
        }

        return {hosts: Object.values(hosts), links: Object.values(links)};
    }
}

module.exports = TracerouteTargetCollection;