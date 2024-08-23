import {Proxy} from "./proxy.js";
import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import fs from 'node:fs';
import uglifyJS from 'uglify-js';
const __dirname = process.cwd();
const proxyServer = new Proxy({
    default: "rammerhead",
    uv: true,
    scramjet: false,
    rammerhead: true,
    hostname_blacklist: [ /google\.com/, /reddit\.com/ ],
    hostname_whitelist: [ /example\.com/ ]
});
const appMiddleware = express();
var pathToFiles = ["/uv/uv.handler.js", "/uv/uv.config.js", "/rammerhead.js", "/hammerhead.js", "/transport-wroker.js"];
appMiddleware.use(express.json());
appMiddleware.use(express.urlencoded({ extended: true }));
pathToFiles.forEach(function(elem){
  appMiddleware.get(elem, (req, res) => {
    const code = fs.readFileSync(__dirname + "/middlewareFiles" + elem, 'utf8');
    const minified = uglifyJS.minify(code);
    if (minified.error) {
      console.log('An error occurred during minification:', minified.error);
      res.sendFile(__dirname + "/middlewareFiles" + elem);
    } else{
      fs.writeFileSync(__dirname + "/middlewareFiles" + elem, minified.code);
      res.sendFile(__dirname + "/middlewareFiles" + elem);
    }
  });
});
var string = "req.url == '" + pathToFiles[0] + "'";
for(var i = 1; i < pathToFiles.length; i++){
  string += " || req.url == '" + pathToFiles[i] + "'";
}
proxyServer.createExpressMiddleware(string, appMiddleware);
const port = process.env.PORT || 80;
proxyServer.app.use(express.json());
proxyServer.app.use(express.urlencoded({ extended: true }));
proxyServer.app.all('/check-favicon/*', async (req, res) => {
  const url = req.url.replace("/check-favicon/", "");

  if (!url) {
      return res.status(400).send('URL parameter is required');
  }

  try {
      const faviconUrl = new URL('/favicon.ico', url).href;
      const response = await axios.get(faviconUrl);
      if (response.status === 200) {
          res.json({"message": true});
      } else {
          res.send({"message": false});
      }
  } catch (error) {
      res.send({"message": false});
  }
});
proxyServer.app.post("/searchResults", async (req, res) => {
  var array = [];
  var response = await axios.get("https://duckduckgo.com/ac/?q=" + req.body.query);
  response.data.forEach((element, index) => {
    if(index < 5){
      array.push(Object.values(element)[0]);
    }
  });
  res.json(array);
});
proxyServer.app.use(
  express.static("static", {
    index: "index.html",
    extensions: ["html"],
  })
);
proxyServer.server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});