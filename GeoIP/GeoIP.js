const request = require('request-promise-native');
const fs = require('fs');
const accessKey = "f2603454207d383e882711cb3610a580";
/** @type {Object.<string, GeoIPResult>} */
var cache = null;

class GeoIP {
    /**
     * @param {string} ip 
     */
    static async lookup(ip) {
        return (await this.bulkLookup([ip]))[0];
    }

    /**
     * @param {string[]} ips
     * @returns {Promise<GeoIPResult[]>}
     */
    static async bulkLookup(ips) {
        if (!ips || ips.length === 0) return [];
        if (cache === null) await this.readCache();

        /** @type {GeoIPResult[]} */
        let result = new Array(ips.length);
        /** @type {{ip: string, index: number}[]} */
        let uncached = [];

        for (let i = 0; i < ips.length; i++) {
            let ip = ips[i];
            let cRes = cache[ip];
            result[i] = cRes;
            if (!cRes) {
                uncached.push({ip: ip, index: i});
            }
        }

        /** @type {GeoIPResult[]} */
        let lookupResult = null;
        if (uncached.length > 0) {
            try {
                let result = await request('http://api.ipstack.com/'+uncached.map(x => x.ip).join(",")+'?access_key='+accessKey+'&format=1', { json: true });
                if (result.error) {
                    console.error(result.error);
                } else {
                    if (ips.length === 1) lookupResult = [result];
                    else lookupResult = result;
                }
            } catch (e) {
                console.error(e);
            }
        }

        for (let i = 0; i < uncached.length; i++) {
            let uc = uncached[i];
            result[uc.index] = lookupResult[i];
            cache[uc.ip] = lookupResult[i];
        }

        return result;
    }

    static async readCache() {
        return new Promise(r => {
            fs.readFile("./GeoIP/geoIPCache.json", (err, data) => {
                cache = data ? JSON.parse(data.toString()) : {};
                r();
            });
        });
    }

    static saveCache() {
        fs.writeFile("./GeoIP/geoIPCache.json", JSON.stringify(cache), () => {});
    }
}

module.exports = GeoIP;

/**
 * @typedef {Object} GeoIPResult
 * @property {string} ip
 * @property {string} type
 * @property {string} continent_code
 * @property {string} continent_name
 * @property {string} country_code
 * @property {string} country_name
 * @property {string} region_code
 * @property {string} region_name
 * @property {string} city
 * @property {string} zip
 * @property {number} latitude
 * @property {number} longitude
 * @property {location} location
 * @property {any} error
 */

/**
 * @typedef {Object} location
 * @property {number} geoname_id
 * @property {string} capital
 * @property {language[]} languages
 * @property {string} country_flag
 * @property {string} country_flag_emoji
 * @property {string} country_flag_emoji_unicode
 * @property {string} calling_code
 * @property {boolean} is_eu
 */

/**
 * @typedef {Object} language
 * @property {string} code
 * @property {string} name
 * @property {string} native
 */