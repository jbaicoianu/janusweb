#JanusWeb

JanusWeb is a web-based client for JanusVR rooms.  JanusVR rooms are 3D environments 
written in HTML and hosted in the same manner of regular websites.  JanusWeb allows
users to view and interact with others in these environments using only their web
browser.

## Features

- Support for 2D and 3D (sbs3d or ou3d) video textures using HTML5 Video
- 3D positional audio
- Gamepad support via the HTML5 Gamepad API
- Rendering functionality provided by Three.js / WebGL
- Oculus Rift, Vive, and Cardboard support via WebVR API

## Installing

To build JanusWeb, run the following commands:

```bash
$ git clone https://github.com/jbaicoianu/janusweb
$ cd janusweb
$ npm install
$ npm run build
```

This will give you a full build of the latest verson of JanusWeb in your `build/` 
directory.  This directory can be hosted anywhere you would normally host static 
HTML, and you can place your default ```<FireBoxRoom>``` within this file.

See [JanusVR Markup Documentation](http://janusvr.com/guide/markuplanguage/index.html) for a full reference of supported markup.
