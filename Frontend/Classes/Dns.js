const { Resolver } = require('dns');
var resolver = new Resolver();
resolver.setServers(["1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4"]);

/** @type {Object.<string, string>} */
var lookupCache = {};
/** @type {Object.<string, string>} */
var reverseCache = {};

class Dns {
    /**
     * @param {string} url 
     * @returns {Promise<string>}
     */
    static async lookup(url) {
        return new Promise(resolve => {
            let cached = lookupCache[url];
            if (cached) {
                resolve(cached);
            } else {
                resolver.resolve(url, (err, ips) => {
                    if (err) {
                        resolve(null);
                    } else {
                        lookupCache[url] = ips[0];
                        reverseCache[ips[0]] = url;
                        resolve(ips[0]);
                    }
                });
            }
        })
    }

    /**
     * @param {string} ip 
     * @returns {Promise<string>}
     */
    static async reverse(ip) {
        return new Promise(async resolve => {
            let cached = reverseCache[ip];
            if (cached) {
                resolve(cached);
            } else {
                let url = ip;
                try {
                    url = await new Promise(r => resolver.reverse(ip, (err, urls) => r(err ? ip : urls[0])));
                } catch {
                    url = ip;
                }

                if (url !== ip) lookupCache[url] = ip;
                reverseCache[ip] = url;
                resolve(url);
            }
        });
    }
}

module.exports = Dns;