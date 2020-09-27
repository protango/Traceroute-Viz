const isIp = require('is-ip');
const { Resolver } = require('dns');
const ping = require ("net-ping");
const TracerouteHop = require('./TracerouteHop');
const Dns = require('./Dns');

var resolver = new Resolver();
resolver.setServers(["1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4"]);

class TracerouteTarget {
    
    static pingSession = ping.createSession();
    /** @type {string} */
    ip
    /** @type {string} */
    url
    /** @type {TracerouteHop[]} */
    hops = [];
    /** @type {string[]} */
    errors = [];

    /**
     * @param {string} ip The IP
     * @param {string} url The URL
     */
    constructor(ip, url = null) {
        this.ip = ip;
        this.url = url || ip;
    }

    /**
     * @param {string} urlOrIP
     * @returns {Promise<TracerouteTarget>}
     */
    static async parse(urlOrIP) {
        if (!isIp(urlOrIP)) {
            return new TracerouteTarget(await Dns.lookup(urlOrIP), urlOrIP);
        } else {
            /** @type {string} */
            let url;
            try {
                url = await Dns.reverse(urlOrIP);
            } catch {
                url = null;
            }
            return new TracerouteTarget(urlOrIP, url);
        }
    }

    /**
     * @returns {Promise<void>}
     */
    trace() {
        return new Promise(resolve => {
            TracerouteTarget.pingSession.traceRoute(this.ip, 32, (error, target, ttl, sent, rcvd) => {
                var ms = rcvd - sent;
                if (error) {
                    if (error instanceof ping.TimeExceededError) {
                        this.hops.push(new TracerouteHop(ttl, ms, error.source));
                    } else {
                        this.errors.push(error.toString())
                    }
                } else {
                    this.hops.push(new TracerouteHop(ttl, ms, target));
                }
            }, (error, target) => {
                resolve();
            });
        });
    }
}

module.exports = TracerouteTarget;