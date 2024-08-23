import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import express from "express";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { scramjetPath } from "@mercuryworkshop/scramjet";
import createRammerhead from "./rammerheadProxy/src/server/index.js";

const __dirname = process.cwd();

logging.set_level(logging.ERROR)

export class Proxy {
    constructor(options) {
        var middleware = {};
        this.createExpressMiddleware = function(whenShouldDo, app){
            middleware = {
                bool: whenShouldDo,
                expressApp: app
            }
        };
        if (options) {
            if (typeof options !== "object" || Array.isArray(options)) {
                options = {}
                console.error("Error: ProxyServer options invalid.")
            }
        } else {
            options = {}
        }

        if (options.uv == undefined) {
            options.uv = true;
        }

        if (options.scramjet == undefined) {
            options.scramjet = true;
        }

        if (options.rammerhead == undefined) {
            options.rammerhead = true;
        }

        const rh = createRammerhead()

        const rammerheadScopes = [
            "/rammerhead.js",
            "/hammerhead.js",
            "/transport-worker.js",
            "/task.js",
            "/iframe-task.js",
            "/worker-hammerhead.js",
            "/messaging",
            "/sessionexists",
            "/deletesession",
            "/newsession",
            "/editsession",
            "/needpassword",
            "/syncLocalStorage",
            "/api/shuffleDict"
        ]

        const rammerheadSession = /^\/[a-z0-9]{32}/

        const shouldRouteRh = req => {
            const url = new URL(req.url, "http://0.0.0.0")
            return (
                rammerheadScopes.includes(url.pathname) ||
                rammerheadSession.test(url.pathname)
            )
        }

        const routeRhRequest = (req, res) => {
            rh.emit("request", req, res)
        }

        const routeRhUpgrade = (req, socket, head) => {
            rh.emit("upgrade", req, socket, head)
        }

        this.server = createServer();
        this.app = express();
        this.app.get("/proxy.js", async function (req, res) {
            let proxyMain = await readFileSync(__dirname + "/frontend/proxy.js", "utf8");

            if (options.default) {
                if (["uv", "rammerhead", "scramjet"].includes(options.default)) {
                    proxyMain = `const defaultService = "${options.default}";\n\n` + proxyMain
                } else {
                    proxyMain = `const defaultService = "uv";\n\n` + proxyMain
                    console.error("Error: Proxy default option invalid.")
                }
            } else {
                proxyMain = `const defaultService = "uv";\n\n` + proxyMain;
            }

            proxyMain = "const uvEnabled = " + String(options.uv) + ";\n" + proxyMain
            proxyMain = "const scramjetEnabled = " + String(options.scramjet) + ";\n" + proxyMain
            proxyMain = "const rammerheadEnabled = " + String(options.rammerhead) + ";\n" + proxyMain

            res.type("application/javascript");
            return res.send(proxyMain);
        });
        this.app.get("/proxy.sw.js", async function (req, res) {
            let proxySW = await readFileSync(__dirname + "/frontend/proxy.sw.js", "utf8");

            proxySW = "const uvEnabled = " + String(options.uv) + ";\n" + proxySW
            proxySW = "const scramjetEnabled = " + String(options.scramjet) + ";\n" + proxySW
            proxySW = "const rammerheadEnabled = " + String(options.rammerhead) + ";\n" + proxySW

            res.type("application/javascript");
            return res.send(proxySW);
        });
        this.app.use(express.static(__dirname + "/frontend"));
        this.app.use("/baremux/", express.static(baremuxPath));
        this.app.use("/libcurl/", express.static(libcurlPath));
        this.app.use("/epoxy/", express.static(epoxyPath));
        if (options.uv) {
            this.app.use("/uv/", express.static(__dirname + "/config/uv"));
            this.app.use("/uv/", express.static(uvPath));
        }
        if (options.scramjet) {
            this.app.use("/scramjet/", express.static(__dirname + "/config/scramjet"));
            this.app.use("/scramjet/", express.static(scramjetPath));
        }
        this.server.on("request", (req, res) => {
            if(middleware == {}){
                if (options.rammerhead && shouldRouteRh(req)) {
                    routeRhRequest(req, res);
                } else {
                    this.app(req, res);
                }
            } else{
                if(eval(middleware.bool)){
                    middleware.expressApp(req, res);
                } else if (options.rammerhead && shouldRouteRh(req)) {
                    routeRhRequest(req, res);
                } else {
                    this.app(req, res);
                }
            }
        });
        this.server.on("upgrade", (req, socket, head) => {
            if (req.url && req.url.endsWith("/wisp/")) {
                if (options.hostname_blacklist) {
                    wisp.options.hostname_blacklist = options.hostname_blacklist
                }
                if (options.hostname_whitelist) {
                    wisp.options.hostname_whitelist = options.hostname_whitelist
                }
                wisp.routeRequest(req, socket, head);
            } else if (options.rammerhead && shouldRouteRh(req)) {
                routeRhUpgrade(req, socket, head);
            } else {
                socket.end();
            }
        });
    }
}