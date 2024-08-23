window.proxyLoaded = false;
const mod = (n, m) => ((n % m) + m) % m
const baseDictionary =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~-"
const shuffledIndicator = "_rhs"
const generateDictionary = function () {
    let str = ""
    const split = baseDictionary.split("")
    while (split.length > 0) {
        str += split.splice(Math.floor(Math.random() * split.length), 1)[0]
    }
    return str
}
var globalDictionary;
class StrShuffler {
    constructor(dictionary = generateDictionary()) {
        this.dictionary = dictionary;
        globalDictionary = dictionary;
    }
    shuffle(str) {
        if (str.startsWith(shuffledIndicator)) {
            return str;
        }
        let shuffledStr = '';
        for (let i = 0; i < str.length; i++) {
            const char = str.charAt(i);
            const idx = baseDictionary.indexOf(char);
            if (char === '%' && str.length - i >= 3) {
                shuffledStr += char;
                shuffledStr += str.charAt(++i);
                shuffledStr += str.charAt(++i);
            } else if (idx === -1) {
                shuffledStr += char;
            } else {
                shuffledStr += globalDictionary.charAt(mod(idx + i, baseDictionary.length));
            }
        }
        return shuffledIndicator + shuffledStr;
    }
    unshuffle(str) {
        if (!str.startsWith(shuffledIndicator)) {
            return str;
        }

        str = str.slice(shuffledIndicator.length);

        let unshuffledStr = '';
        for (let i = 0; i < str.length; i++) {
            const char = str.charAt(i);
            const idx = globalDictionary.indexOf(char);
            if (char === '%' && str.length - i >= 3) {
                unshuffledStr += char;
                unshuffledStr += str.charAt(++i);
                unshuffledStr += str.charAt(++i);
            } else if (idx === -1) {
                unshuffledStr += char;
            } else {
                unshuffledStr += baseDictionary.charAt(mod(idx - i, baseDictionary.length));
            }
        }
        return unshuffledStr;
    }
}
function get(url, callback, shush = false) {
    var request = new XMLHttpRequest()
    request.open("GET", url, true)
    request.send()

    request.onerror = function () {
        if (!shush) console.log("Cannot communicate with the server")
    }
    request.onload = function () {
        if (request.status === 200) {
            callback(request.responseText)
        } else {
            if (!shush)
                console.log(
                    'unexpected server response to not match "200". Server says "' +
                    request.responseText +
                    '"'
                )
        }
    }
}
var api = {
    newsession(callback) {
        get("/newsession", callback)
    },
    sessionexists(id, callback) {
        get("/sessionexists?id=" + encodeURIComponent(id), function (res) {
            if (res === "exists") return callback(true)
            if (res === "not found") return callback(false)
            console.log("unexpected response from server. received" + res)
        })
    },
    shuffleDict(id, callback) {
        get("/api/shuffleDict?id=" + encodeURIComponent(id), function (res) {
            callback(JSON.parse(res))
        })
    }
}
var localStorageKey = "rammerhead_sessionids"
var localStorageKeyDefault = "rammerhead_default_sessionid"
var sessionIdsStore = {
    get() {
        var rawData = localStorage.getItem(localStorageKey)
        if (!rawData) return []
        try {
            var data = JSON.parse(rawData)
            if (!Array.isArray(data)) throw "getout"
            return data
        } catch (e) {
            return []
        }
    },
    set(data) {
        if (!data || !Array.isArray(data)) throw new TypeError("must be array")
        localStorage.setItem(localStorageKey, JSON.stringify(data))
    },
    getDefault() {
        var sessionId = localStorage.getItem(localStorageKeyDefault)
        if (sessionId) {
            var data = sessionIdsStore.get()
            data.filter(function (e) {
                return e.id === sessionId
            })
            if (data.length) return data[0]
        }
        return null
    },
    setDefault(id) {
        localStorage.setItem(localStorageKeyDefault, id)
    }
}
function addSession(id) {
    var data = sessionIdsStore.get()
    data.unshift({ id: id, createdOn: new Date().toLocaleString() })
    sessionIdsStore.set(data)
}
function getSessionId() {
    return new Promise(resolve => {
        var id = localStorage.getItem("session-string")
        api.sessionexists(id, function (value) {
            if (!value) {
                console.log("Session validation failed")
                api.newsession(function (id) {
                    get('/editsession?id=' + encodeURIComponent(id) + '&enableShuffling=0', function(){
                        addSession(id)
                        localStorage.setItem("session-string", id)
                        console.log(id)
                        console.log("^ new id")
                        resolve(id)
                    });
                })
            } else {
                resolve(id)
            }
        })
    })
}

window.rammerheadEncode = async function (baseUrl) {
    var ProxyHref;

    return getSessionId().then(id => {
        return new Promise(resolve => {
            api.shuffleDict(id, function (shuffleDict) {
                var shuffler = new StrShuffler(shuffleDict)
                ProxyHref = "/" + id + "/" + baseUrl
                resolve(ProxyHref)
            })
        })
    })
}
window.rammerheadEncodeNoWait = function(baseUrl) {
    var ProxyHref;
    var id = localStorage.getItem("session-string");
    return "/" + id + "/" + baseUrl;
}
window.rammerheadDecodeNoWait = function(baseUrl) {
    var ProxyHref;
    var id = localStorage.getItem("session-string");
    return baseUrl.replace(location.origin, "").replace("/" + id + "/", "");
}

window.rammerheadDecode = async function(baseUrl) {
    return getSessionId().then(id => {
        return new Promise(resolve => {
            api.shuffleDict(id, function (shuffleDict) {
                var shuffler = new StrShuffler(shuffleDict)
                var url = baseUrl;
                if(url.startsWith(location.origin)){
                    url = url.replace(location.origin, "");
                } else if(url.startsWith(location.origin.replace("https", "http"))){
                    url = url.replace(location.origin.replace("https", "http"), "");
                }
                url = url.replace("/" + id + "/", "");
                resolve(url)
            })
        })
    })
}

window.proxyEncode = async function(url, service = defaultService) {
    switch (service) {
        case "uv":
            if (uvEnabled) {
                return (
                    window.location.origin +
                    window.__uv$config.prefix +
                    window.__uv$config.encodeUrl(url)
                );
            }
            break;
        case "rammerhead":
            if (rammerheadEnabled) {
                return window.location.origin + (await rammerheadEncode(url));
            }
            break;
        case "scramjet":
            if (scramjetEnabled) {
                return (
                    window.location.origin +
                    window.__scramjet$config.prefix +
                    window.__scramjet$config.codec.encode(url)
                );
            }
            break;
    }
}
window.proxyEncodeNoWait = function(url, service = defaultService) {
    switch (service) {
        case "uv":
            if (uvEnabled) {
                return (
                    window.location.origin +
                    window.__uv$config.prefix +
                    window.__uv$config.encodeUrl(url)
                );
            }
            break;
        case "rammerhead":
            if (rammerheadEnabled) {
                return window.location.origin + (rammerheadEncodeNoWait(url));
            }
            break;
        case "scramjet":
            if (scramjetEnabled) {
                return (
                    window.location.origin +
                    window.__scramjet$config.prefix +
                    window.__scramjet$config.codec.encode(url)
                );
            }
            break;
    }
}

window.proxyDecode = async function(url, service = defaultService) {
    switch (service) {
        case "uv":
            if (uvEnabled) {
                if(url.startsWith(location.origin)){
                    url = url.replace(location.origin, "");
                } else if(url.startsWith(location.origin.replace("https", "http"))){
                    url = url.replace(location.origin.replace("https", "http"), "");
                }
                return window.__uv$config.decodeUrl(url.replace(window.__uv$config.prefix, ""));
            }
            break;
        case "rammerhead":
            if (rammerheadEnabled) {
                return await rammerheadDecode(url);
            }
            break;
        case "scramjet":
            if (scramjetEnabled) {
                if(url.startsWith(location.origin)){
                    url = url.replace(location.origin, "");
                } else if(url.startsWith(location.origin.replace("https", "http"))){
                    url = url.replace(location.origin.replace("https", "http"), "");
                }
                return window.__scramjet$config.codec.decodeUrl(url.replace(window.__scramjet$config.prefix, ""));
            }
            break;
    }
}
window.proxyDecodeNoWait = function(url, service = defaultService) {
    switch (service) {
        case "uv":
            if (uvEnabled) {
                if(url.startsWith(location.origin)){
                    url = url.replace(location.origin, "");
                } else if(url.startsWith(location.origin.replace("https", "http"))){
                    url = url.replace(location.origin.replace("https", "http"), "");
                }
                return window.__uv$config.decodeUrl(url.replace(window.__uv$config.prefix, ""));
            }
            break;
        case "rammerhead":
            if (rammerheadEnabled) {
                return rammerheadDecodeNoWait(url);
            }
            break;
        case "scramjet":
            if (scramjetEnabled) {
                if(url.startsWith(location.origin)){
                    url = url.replace(location.origin, "");
                } else if(url.startsWith(location.origin.replace("https", "http"))){
                    url = url.replace(location.origin.replace("https", "http"), "");
                }
                return window.__scramjet$config.codec.decodeUrl(url.replace(window.__scramjet$config.prefix, ""));
            }
            break;
    }
}
window.getTransport = function(transport) {
    switch (transport) {
        case "libcurl":
            return "/libcurl/index.mjs"
            break;
        case "epoxy":
            return "/epoxy/index.mjs"
            break;
    }
}

let connection;

let wispURL = document.currentScript.getAttribute("wisp");
let transport = document.currentScript.getAttribute("transport");

async function proxyTransport(transport, wisp) {
    await connection.setTransport(getTransport(transport) || "/libcurl/index.mjs", [{ wisp: wisp || (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/" }]);
}

async function registerSW() {
    connection = new window.BareMux.BareMuxConnection("/baremux/worker.js");
    await proxyTransport();

    if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/proxy.sw.js");
    } else {
        console.error("Service worker failed to register.")
    }
}

async function loadScript(src) {
    await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => {
            resolve();
        };
        script.onerror = () => {
            reject();
        };
        document.head.appendChild(script);
    });
}

(async () => {
    await loadScript("/baremux/index.js");
    if (uvEnabled) {
        await loadScript("/uv/uv.bundle.js");
        await loadScript("/uv/uv.config.js");
    }
    if (scramjetEnabled) {
        await loadScript("/scramjet/scramjet.codecs.js");
        await loadScript("/scramjet/scramjet.config.js");
    }
    await registerSW();
    proxyLoaded = true;
    window.dispatchEvent(new Event("proxyLoaded"));
    await new Promise(() => {
        var id = localStorage.getItem("session-string")
        api.sessionexists(id, function (value) {
            if (!value) {
                console.log("Session invalid!!")
                api.newsession(function (id) {
                    get('/editsession?id=' + encodeURIComponent(id) + '&enableShuffling=0', function(){
                        addSession(id)
                        localStorage.setItem("session-string", id)
                        console.log(id)
                        console.log("^ new id")
                        window.location.reload();
                    });
                })
            }
        })
    })
})();