/*
elation.config.set('dependencies.protocol', 'https:');              // "http:" or "https:"
elation.config.set('dependencies.host', 'janusweb.metacade.com');   // Hostname this release will live on
elation.config.set('dependencies.rootdir', '/');                    // Directory this release will live in
elation.config.set('dependencies.main', 'janusweb.js');             // The main script file for this release
*/

elation.config.set('janusweb.network.host', 'wss://presence.janusvr.com:5567');        // Default presence server
elation.config.set('engine.assets.corsproxy', 'https://janusweb.lnq.to:8089/'); // CORS proxy URL
elation.config.set('engine.assets.workers', 2); // CORS proxy URL

elation.config.set('janusweb.tracking.enabled', true);
elation.config.set('janusweb.tracking.clientid', 'UA-49582649-2');

elation.config.set('dependencies.protocol', 'http:');              // "http:" or "https:"
elation.config.set('dependencies.host', 'bai.dev.supcrit.com');   // Hostname this release will live on
elation.config.set('dependencies.rootdir', '/');                    // Directory this release will live in
elation.config.set('dependencies.main', 'scripts/utils/elation.js');             // The main script file for this release

elation.config.set('demohack.vive', false);

// You probably don't want to edit past this line unless you know what you're doing
// --------------------------------------------------------------------------------
// These settings can be changed if you want to host your .js and media in non-standard locations

elation.config.set('dependencies.path', elation.config.get('dependencies.protocol') + '//' + elation.config.get('dependencies.host') + elation.config.get('dependencies.rootdir'));
elation.config.set('janusweb.datapath', elation.config.get('dependencies.path') + 'media/janusweb/');
elation.config.set('engine.assets.font.path', elation.config.get('janusweb.datapath') + 'fonts/');
