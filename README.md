<p align="center"><a href="https://web.janusvr.com" target="_blank"><img width="480" alt="JanusWeb" src="https://imgur.com/ejvyphR.jpg"></a></p>

<p align="center"><b>A web framework/browser for building rich virtual reality experiences.</b></p>

<div align="center">
  <a href="https://janusvr.com">Site</a>
  &mdash;
  <a href="https://vesta.janusvr.com">Vesta</a>
  &mdash;
  <a href="https://github.com/janusvr/janusvr-examples">Examples</a>
  &mdash;
  <a href="https://web.janusvr.com">Demo</a>
  &mdash;
  <a href="https://coderofsalvation.github.io/janus-guide/">Docs</a>
  &mdash;
  <a href="https://discord.gg/7eyK2wE">Discord</a>
</div>


## Examples

<a href="https://github.com/janusvr/janusvr-examples/tree/master/360/3">
  <img alt="Crystalball" target="_blank" src="https://i.imgur.com/mw0Um3C.gif" height="190" width="32%">
</a>
<a href="https://www.augmentedperception.com/">
  <img alt="Augmented Perception" target="_blank" src="https://i.imgur.com/V6fqjVG.gif" height="190" width="32%">
</a>
<a href="https://vesta.janusvr.com/bai/movie-theater-dynamic-lighting">
  <img alt="Cinema" target="_blank" src="https://i.imgur.com/i1nIXI8.gif" height="190" width="32%">
</a>
<a href="https://imgur.com/FX3skXb.gif">
  <img alt="Drag n' Drop" target="_blank" src="https://i.imgur.com/FX3skXb.gif" height="190" width="32%">
</a>
<a href="http://www.metacade.com">
  <img alt="Metacade" target="_blank" src="https://i.imgur.com/9CqBKV5.gif" height="190" width="32%">
</a>
<a href="https://vesta.janusvr.com/bepis/mansion">
  <img alt="Mansion" target="_blank" src="https://imgur.com/pQAQ4yt.gif" height="190" width="32%">
</a>


## Features

- [Open Immersive Web-layer](https://madjin.github.io/janus-guide/#/home/about) for browsing XR experiences across the web 
- Build immersive 3D environments for desktop, mobile, and VR devices using HTML and JS
- Rendering functionality provided by Three.js / WebGL
- Separately host WebXR experiences via ([JML](https://madjin.github.io/janus-guide/#/examples/markup) in) any textfile.
- Oculus Rift, Vive, GearVR, Daydream, and Cardboard support via WebVR API
- [Realtime collaboration](https://madjin.github.io/janus-guide/#/home/usecases) across all devices via built-in networking
- Import Collada, OBJ, glTF, and other popular 3d file formats
- 3D positional audio
- Gamepad support via the HTML5 Gamepad API
- Supports hand tracking peripherals like Leap Motion, Oculus Touch, and Vive controllers
- Support for 2d, sbs3d/ou3d, and 360 degree video textures using HTML5 Video
- Scriptable client enables many customized uses
- And [much more](https://madjin.github.io/janus-guide/#/home/toc)


## Using

There are [several different ways](https://madjin.github.io/janus-guide/#/home/usecases) to use JanusWeb, depending on how much control you want to 
have over the whole system.

### Use our viewer
Our default viewer is always available at https://web.janusvr.com/.  You can write an HTML
page with your [JanusVR Markup](https://janusvr.com/docs/build/introtojml/index.html) and host
it anywhere you would normally host a static website.  Any regular webhost, AWS S3 static 
sites, CDNs, or even more exotic locations like [IPFS distributed filesystems](https://ipfs.io) will work.
You can even put your mark-up onto sites like PasteBin or PiratePad.  Then just load the URL
in our viewer by entering the URL into the navigation bar, and you can link directly to it, share 
on social media, or embed our viewer directly into other webpages, blog posts, or articles.

### Local-first

Run the viewer locally on your desktop, raspberry pi (ARM64) or server?<br>
Use our all-in-one **janusxr.com** multi-platform binary file:

| executable    | platforms |
|-|-|
| [janusxr.com](releases/latest/download/janusxr.com) | <img src="https://i.imgur.com/v7cYVq1.png"/> |

Run `janusxr.com` from anywhere, or put it into a folder with your 3D models or JanusXR rooms:

```
$ chmod +x janusxr.com          # only for non-windows users

$ ./janusxr.com 
I2026-01-19T15:41:10 (srvr) listen http://127.0.0.1:8080
I2026-01-19T15:41:10 (srvr) listen http://192.168.1.168:8080
Launching browser..
```

A browser will popup, and connect to `https://janusxr.org` via Janusweb.<br>
Webbrowsers on the same network can access your node `https://192.168.1.168:8080`

> Optionally, you can expose this janusweb-node to the internet. Check [here](https://redbean.dev) for more commandline options.
</details>

<details>
<summary><b>Usecase:</b> 3D file viewer</summary>
<br>
Make sure `janusxr.com` is in a folder with your 3D models

```
$ ls 
janusxr.com
world1.glb
world2.glb
```

Then make sure you rename `janusxr.com` to whatever you want to set as homepage:

```
$ mv janusxr.com world1.com
$ ./world1.com 
I2026-01-19T15:41:10 (srvr) listen http://127.0.0.1:8080
I2026-01-19T15:41:10 (srvr) listen http://192.168.1.168:8080
✅ detected /world1.glb (setting as spatial home)
Launching browser..
```
</details>

<details>
<summary><b>Usecase:</b> all-in-one JanusXR node</summary>
<br>
Make sure `janusxr.com` is in a folder with your JanusXR rooms or 3D models

```
$ ls 
janusxr.com
world1.html
world2.html
foo.glb
```

Then make sure you rename `janusxr.com` to whatever you want to set as homepage:

```
$ zip -r janusxr.com *              # add janus files to janusxr.com
$ mv janusxr.com world1.com         # hint homepage room (world1.html) sidecarfile
$ ./world1.com                       
✅ detected /world1.html (setting as spatial home)
I2026-01-19T15:41:10 (srvr) listen http://127.0.0.1:8080
I2026-01-19T15:41:10 (srvr) listen http://192.168.1.168:8080
Launching browser..
```

Profit! You can now send `world1.com` to a friend, and his browser will launch straight into world1.html 

> NOTE: you can also point directly to a 3D model (`foo.com` would load `foo.glb`) or PDF-file etc!
</details>

<details>
<summary><b>Usecase:</b> run in docker/OCI container</summary>
<br>

Make sure to run you're in a folder with your JanusXR rooms or 3D models, and `janusxr.com`

```
$ ls 
janusxr.com
world1.html
world2.html
foo.glb

$ unzip janusxr.com          # extract the viewer files

$ docker run -d -v ./:/www -p 8080:8080 --name janusweb busybox:latest /bin/httpd -f -h /www -p 8080
e7928798379e872983b7ec9b89237ebc

$ docker ps
CONTAINER ID  IMAGE                             COMMAND               CREATED         STATUS         PORTS                   NAMES
6711ed9739f3  docker.io/library/busybox:latest  /bin/httpd -f -h ...  16 seconds ago  Up 16 seconds  0.0.0.0:8080->8080/tcp  janusweb
```

Profit! You can now point your browser to `http://127.0.0.1:8080` or configure your reverseproxy for SSL certs/domain etc.

</details>

<details>
<summary><b>Usecase:</b> deploy janusweb as github/gitlab/codeforge webpage</summary>

<br>
*TODO* provide action-files
</details>

<details>
<summary><b>Usecase:</b> get the latest build files</summary>

<br>
Sometimes, developers just want the latest janusweb **files**.<br>
Good news, the executable is also a zip-file.<br>

```
$ ls 
janusxr.com
$ unzip janusxr.com
$ ls
index.html
janusweb.js
(...)

$ janusxr.com 
I2026-01-19T15:41:10 (srvr) listen http://127.0.0.1:8080
I2026-01-19T15:41:10 (srvr) listen http://192.168.1.168:8080
Launching browser..

( the webserver will prioritize the unzipped files )

$ zip janusxr.com index.html   # you can even update the binary 
```

> Profit!

</details>

### Pull our scripts into your page
Using the above method, all of your links would go through community CORS-proxies. If you'd prefer to 
link to your own servers, you can pull our JS into your page and use JanusWeb as a scriptable
client via its API.  This looks something like this:

```html
<html>
  <head>
    <title>My JanusVR Room</title>
  </head>
  <body>
    <script src="https://web.janusvr.com/janusweb.js"></script>
    <janus-viewer>
      <FireBoxRoom>
        <Room use_local_asset="room1">
          <Object id="cube" pos="0 1 5" />
          <Text col="1 0 0" pos="0 2 4">My First Room</Text>
        </Room>
      </FireBoxRoom>
    </janus-viewer>
  </body>
</html>
```

The `elation.janusweb.init()` function can take a number of arguments, and returns a promise which
receives an instance of the client.  This client reference can be controlled via its API:

```html
<html>
  <head>
    <title>My JanusVR Room</title>
  </head>
  <body>
    <script src="https://web.janusvr.com/janusweb.js"></script>
    <script>
        elation.janusweb.init({url: document.location.href })
        .then( (client)=> console.log("rendering this page's virtual twin") )
    </script>

    <!-- 
    <fireboxroom>
      <room use_local_asset="room1">
        <object id="cube" pos="0 1 5" />
        <text col="1 0 0" pos="0 2 4">my first room</text>
      </room>
    </fireboxroom>
    -->

  </body>
</html>
```

> **NOTE**: you can also update the `janusxr.com` binary to your likings: (`unzip janusxr.com index.html && vi index.html && zip janusxr.com index.html` see 'get the latest build files' above)

See the sections on **Arguments** and **Scripting** below.

> See also **Using a specific version of JanusWeb** below.

### Install from NPM
(TODO - we will start shipping official NPM packages of JanusWeb once we release v1.0)
```bash
npm install janusweb
```

### Build from source

If you'd like to build JanusWeb from source, you can check it out from Github and build using the 
following steps:

```bash
$ git clone https://github.com/jbaicoianu/janusweb
$ cd janusweb
$ npm install --only=prod
$ npm run build
```

This will give you a full build of the latest verson of JanusWeb in your `build/` directory.  You 
can then modify `build/index.html` however you see fit, and host it as suggested above.

## Arguments
JanusWeb supports several arguments at initialization time to control how it behaves.

<table>
  <tr><th> Name           </th><th> Description                            </th><th> Default                  </th></tr>

  <tr><td> autostart      </td><td> call `elation.janusweb.init({..})` automatically or manually </td><td> true                     </td></tr>

  <tr><td> autoload      </td><td> Load URL by default or wait for script </td><td> true                     </td></tr>

  <tr><td> crosshair      </td><td> Show player crosshair                  </td><td> true                     </td></tr>

  <tr><td> homepage       </td><td> Default page to go to when user presses 
                                    home button                            </td><td> https://web.janusvr.com/ </td></tr>

  <tr><td> networking     </td><td> Enable networking                      </td><td> true                     </td></tr>

  <tr><td> picking        </td><td> Enable mouse interactions              </td><td> true                     </td></tr>

  <tr><td> resolution     </td><td> If specified, restrict the renderer to 
                                    the specified size                     </td><td> (none)                   </td></tr>

  <tr><td> server         </td><td> Presence server to connect to          </td><td> wss://presence.janusvr.com:5567/</td></tr>

  <tr><td> stats          </td><td> Enable render performance stats        </td><td> false                    </td></tr>

  <tr><td> url            </td><td> Default page to load                   </td><td> (homepage)               </td></tr>

  <tr><td> urltemplate    </td><td> Optional template for generating URLs  </td><td> (none)                   </td></tr>

  <tr><td> useWebVRPolyfill </td><td> Enable WebVR polyfill for mobile 
                                      phone compatibility                  </td><td> true                     </td></tr>

  <tr><td> usevoip        </td><td> Enable or disable VOIP functionality
                                    (NOTE - disabled pending browser support 
                                    for Opus via WebAudio)                 </td><td> false                    </td></tr>
</table>

> NOTE: see [client.js](https://github.com/jbaicoianu/janusweb/blob/master/scripts/client.js#L65) for the most up to date arguments 

## Scripting
After initializing the client, `elation.janusweb.init()` returns a Promise which provides a reference to the client.
You can programatically control this client to do all sorts of things.  For instance, we can make the client load a
URL, wait for the world and all of its assets to load, and then take a screenshot of the world after a specified delay:

```javascript
<janus-viewer autostart="false">     <!-- disable autostart, we will   -->
</janus-viewer>                      <!-- call elation.janusweb.init() -->

<script>
var pageinfo = elation.utils.parseURL(document.location.href),
    urlargs = pageinfo.args || {},
    hashargs = pageinfo.hash || {};

var url = elation.utils.any(hashargs.url, urlargs.url, 'http://www.janusvr.com/index.html'),
    delay = elation.utils.any(hashargs.delay, urlargs.delay, 1000);

elation.janusweb.init({ 
  url: url,
  resolution: '1920x1080',
  uiconfig: "./media/assets/webui/default.json" // tweak ui here
  // more options at https://github.com/jbaicoianu/janusweb/blob/master/scripts/client.js#L93
}).then(function(client) {
  elation.events.add(client.janusweb.currentroom, 'room_load_complete', function() {
    setTimeout(function() {
      client.hideMenu();
      client.screenshot().then(function(imagefile) {
        // upload imagefile somewhere via XHR
        console.log('Screenshot complete!');
      });
    }, delay);
  });
  elation.janusweb.init = function(){} // init only once 
});
</script>

```

Many other aspects of the JanusWeb client can be controlled this way as well.  Our users are
always thinking up new and inventive ways of using the JanusWeb client.  Embed it in your blog
posts, use it to render 3D content behind your 2d webpage, put a virtual security camera in your
world and view a live stream of the virtual world from any web browser.  Control the virtual world
via a web interface.  This is your scriptable live portal into the metaverse, to do with whatever
you please.  The possibilities are endless!

You can even run JanusWeb in NodeJS for headless server-side operations.  Use it to write a bot that
wanders the metaverse, or run your game logic and physics on a server to have one authoritative 
source of state for your world.  If this sounds interesting to you let us know, we will be more
than happy to help you through this (it's all very experimental right now!)

## Using a specific version of JanusWeb
If you need to load a specific version of JanusWeb, all previous versions are stores on the same server, and can be accessed by construction a URL of the form ```https://web.janusvr.com/<version>/```.  This is useful if you have a room which you know works with a specific version, which relies on features which have since been deprecated or changed, or to determine whether bugs have been introduced.  

JanusWeb versions follow the [Semantic Versioning 2.0.0](http://semver.org/) spec, which follows the format ```<major>.<minor>.<patch>``` - for example, at the time of writing (March 2017) the current stable release is **1.0.15**.  So if you want to view this version, you could go to https://web.janusvr.com/1.0.15/ and if you wanted to pull this specific version into your page, you could do so with ```<script src="https://web.janusvr.com/1.0.15/janusweb.js"></script>```.  We also support aliases for the most current version - for instance, https://web.janusvr.com/1.0/ will always refer to the most recent 1.0 release, https://web.janusvr.com/0.9/ the final 0.9 release, etc.

## Ecosystem

Platforms using JanusXR + JanusWeb:

|    | URL | source / docker |
|----|-----|------------|
| <img src="https://imgur.com/JMYi81Z.png"/><br><br> | [vesta.janusxr.org](https://vesta.janusxr.org) | |
| <img src="https://codeberg.org/coderofsalvation/xrforge/media/branch/master/xrforge.jpg"/><br><br> | [xrforge.isvery.ninja](https://xrforge.isvery.ninja) | [codeberg.org](https://codeberg.org/coderofsalvation/xrforge)

Visualisations of hyperlinked Janus clusters across the web:
* [augmentedperception.com](https://augmentedperception.com) 
* [panopticon](https://panopticon.spyduck.net/) 

Extra Tools / Components:
* [custom components](https://github.com/jbaicoianu/janus-custom-components)
* [janusxr-cli](https://github.com/coderofsalvation/janusxr-cli) swiss army CLI knife for room health/preservation #cli
* [corsanywhere](https://github.com/Rob--W/cors-anywhere) for hasslefree hopping clusters #stack
* [janus-gateway](https://janus.conf.meetecho.com/) webrtc/voip-layer [docs](https://janus.conf.meetecho.com/) #stack
* [janus-server](https://github.com/janusvr/janus-server) multiuser presence layer #stack

Reference:
* [quick scripting reference](https://github.com/jbaicoianu/janusweb/wiki/Scripting-Support-2.0)
* [janus guide](https://coderofsalvation.github.io/janus-guide/)

## Contributing
JanusWeb is open source, and we welcome any contributions!  Please do report bugs using GitHub Issues,
and all pull requests will be considered.  We could especially use help with documentation!

## Who is responsible for this?
JanusWeb was created by James Baicoianu, and is now an official open source project of JanusVR, Inc.
The JanusWeb software and its API are published under the MIT license, and are free to use for whatever
uses you can think of.  If you build something cool, let us know!
