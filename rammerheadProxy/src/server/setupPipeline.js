const config = require('../config');
const getSessionId = require('../util/getSessionId');
const fs = require("fs");
const path = require('path');

const splitDirname = __dirname.split(path.sep);  // Split once
const depth = 3;  // Number of levels to go up
const adjustedDepth = Math.max(0, splitDirname.length - depth);  // Ensure we don't go below root

const dirnameArray = splitDirname.slice(0, adjustedDepth);  // Extract the required parts
const dirnameString = dirnameArray.join(path.sep);  // Join them back together

console.log(dirnameString);

/**
 * @param {import('../classes/RammerheadProxy')} proxyServer
 * @param {import('../classes/RammerheadSessionAbstractStore')} sessionStore
 */
module.exports = function setupPipeline(proxyServer, sessionStore) {
    // remove headers defined in config.js
    proxyServer.addToOnRequestPipeline(async (req, res, _serverInfo, isRoute) => {
        if (isRoute) return; // only strip those that are going to the proxy destination website

        // restrict session to IP if enabled
        const sessionId = getSessionId(req.url);
        const session = sessionId && sessionStore.get(sessionId);
        if (config.restrictSessionToIP) {

            if (session && session.data.restrictIP && session.data.restrictIP !== config.getIP(req)) {
                res.writeHead(200, {
                    'Content-Type': 'text/html', // Adjust the content type based on your file type
                    'Content-Length': data.length
                });
                res.end(await fs.readFileSync(dirnameString + "/static/block.html"));
                return true;
            }
        }
        const headers = req.headers;
        // Log potential IP headers
        // Function to convert string to IP address
function stringToIp(str) {
    if (str.length !== 32) {
      return null;
    }
    
    // Convert string to numeric values
    let nums = [];
    for (let i = 0; i < 32; i += 8) {
      let numStr = str.slice(i, i + 8);
      let num = parseInt(numStr, 16); // Interpret as hexadecimal
      if (isNaN(num)) {
        return null;
      }
      nums.push(num);
    }
    
    // Convert to IP address format (IPv4 or IPv6, here we use IPv4 for simplicity)
    let ip = nums.map(num => num % 256).join('.');
    return ip;
  }
var ip = config.fakeIpAddress;
  // Test string
  const testString = `/${sessionId}/`; // Adjust this string as needed
  
  const regex = /^\/[a-z0-9]{32}/;
  
  if (regex.test(testString)) {
    ip = stringToIp(testString.slice(1, testString.length-1));
    if (!ip) {
      console.log('Invalid string for IP conversion.');
    }
  } else {
    console.log('String does not match the required pattern.');
  }
  
        const clientIPHeaders = [
            'x-forwarded-for',
            'x-real-ip',
            'forwarded',
            'client-ip',
            'true-client-ip',
            'cf-connecting-ip',
            'x-cluster-client-ip',
            'fastly-client-ip'
        ];
    
        clientIPHeaders.forEach(header => {
            if (headers[header]) {
                console.log(`${header}: ${headers[header]}`);
            }
        });
        const realIP = req.headers['x-forwarded-for'];
        for (const eachHeader of config.stripClientHeaders) {
            delete req.headers[eachHeader];
        }
        req.headers['x-forwarded-for'] = ip;
        req.headers['x-real-ip'] = ip;
        req.headers['client-ip'] = ip;
        req.headers['True-Client-IP'] = ip;
        req.socket.remoteAddress = ip;
        req.ip = ip;
    });
    Object.assign(proxyServer.rewriteServerHeaders, config.rewriteServerHeaders);
};
