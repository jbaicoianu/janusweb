elation.config.set('janusweb.network.host', 'wss://presence.janusxr.org:5567');        // Default presence server
elation.config.set('engine.assets.corsproxy', 'https://p.janusxr.org/'); // CORS proxy URL
elation.config.set('engine.assets.workers', 'auto'); // Number of workers to use for asset parsing
//elation.config.set('engine.assets.image.maxsize', 16384); 
elation.config.set('engine.assets.image.anisotropy', 16); 
elation.config.set('engine.assets.image.mipmaps', true); 

elation.config.set('janusweb.tracking.enabled', false);
elation.config.set('janusweb.tracking.clientid', '');
elation.config.set('janusweb.materials.pbr', false);
elation.config.set('janusweb.materials.shadows.enabled', false);
elation.config.set('janusweb.materials.shadows.size', 512);

elation.config.set('dependencies.protocol', 'https:');              // "http:" or "https:"
elation.config.set('dependencies.host', 'bai.dev.supcrit.com');   // Hostname this release will live on
elation.config.set('dependencies.rootdir', '/');                    // Directory this release will live in
elation.config.set('dependencies.main', 'scripts/utils/elation.js');             // The main script file for this release

elation.config.set('demohack.vive', false);

elation.config.set('share.imagebase', '/media/images/share/');
elation.config.set('share.targets.imgur.clientid', '68bc9426b322db4'); // web.janusvr.com
elation.config.set('share.targets.dropbox.clientid', '8u2gus0kinv8172');
elation.config.set('share.targets.googledrive.clientid', '374523350201-p566ctvssq49sa48aj2gistjuak3ci7k.apps.googleusercontent.com');
elation.config.set('share.targets.yahoo.clientid', '374523350201-p566ctvssq49sa48aj2gistjuak3ci7k.apps.googleusercontent.com');
elation.config.set('share.targets.facebook.clientid', '1197654320349894');
elation.config.set('share.targets.file.enabled', true);

elation.config.set('serviceworker.enabled', true);

// FIXME - hack for dev, we should support role-based config
if (typeof document != 'undefined' && document.location.origin == 'https://bai.dev.supcrit.com') {
  elation.config.set('share.imagebase', null);
  elation.config.set('share.targets.imgur.clientid', '96d8f6e2515953a');// bai.dev
  elation.config.set('share.targets.facebook.clientid', '1200979896684003');
}


// You probably don't want to edit past this line unless you know what you're doing
// --------------------------------------------------------------------------------
// These settings can be changed if you want to host your .js and media in non-standard locations

elation.config.set('dependencies.path', elation.config.get('dependencies.protocol') + '//' + elation.config.get('dependencies.host') + elation.config.get('dependencies.rootdir'));
elation.config.set('janusweb.datapath', elation.config.get('dependencies.path') + 'media/janusweb/');
elation.config.set('engine.assets.font.path', elation.config.get('janusweb.datapath') + 'fonts/');

WebVRConfig = {
  FORCE_ENABLE_VR: false,
  MOUSE_KEYBOARD_CONTROLS_DISABLED: true,
  DEFER_INITIALIZATION: false,
  BUFFER_SCALE: 0.5
};

