elation.config.set('dependencies.protocol', 'http:'); //document.location.protocol);
elation.config.set('dependencies.host', 'janusweb.metacade.com');
elation.config.set('dependencies.path', elation.config.get('dependencies.protocol') + '//' + elation.config.get('dependencies.host') + '/');
elation.config.set('dependencies.main', 'janusweb.js');
elation.config.set('engine.assets.font.path', elation.config.get('dependencies.path') + 'media/fonts/');
elation.config.set('janusweb.network.host', 'wss://janusweb.lnq.to:5567');
elation.config.set('janusweb.network.corsproxy', 'http://janusweb.lnq.to:8089/');
elation.config.set('janusweb.datapath', elation.config.get('dependencies.path') + 'media/');
