elation.config.set('janusweb.network.host', 'wss://presence.janusvr.com:5567');        // Default presence server
elation.config.set('engine.assets.corsproxy', 'https://janusweb.lnq.to:8089/'); // CORS proxy URL
elation.config.set('engine.assets.workers', 4); // Number of workers to use for asset parsing

elation.config.set('janusweb.tracking.enabled', true);
elation.config.set('janusweb.tracking.clientid', 'UA-49582649-2');

elation.config.set('dependencies.protocol', 'http:');              // "http:" or "https:"
elation.config.set('dependencies.host', 'bai.dev.supcrit.com');   // Hostname this release will live on
elation.config.set('dependencies.rootdir', '/');                    // Directory this release will live in
elation.config.set('dependencies.main', 'scripts/utils/elation.js');             // The main script file for this release

elation.config.set('demohack.vive', false);

elation.config.set('share.imagebase', '/media/images/share/');
elation.config.set('share.targets.imgur.clientid', '68bc9426b322db4');
elation.config.set('share.targets.dropbox.clientid', '8u2gus0kinv8172');
elation.config.set('share.targets.google.clientid', '374523350201-p566ctvssq49sa48aj2gistjuak3ci7k.apps.googleusercontent.com');

// You probably don't want to edit past this line unless you know what you're doing
// --------------------------------------------------------------------------------
// These settings can be changed if you want to host your .js and media in non-standard locations

elation.config.set('dependencies.path', elation.config.get('dependencies.protocol') + '//' + elation.config.get('dependencies.host') + elation.config.get('dependencies.rootdir'));
elation.config.set('janusweb.datapath', elation.config.get('dependencies.path') + 'media/janusweb/');
elation.config.set('engine.assets.font.path', elation.config.get('janusweb.datapath') + 'fonts/');
