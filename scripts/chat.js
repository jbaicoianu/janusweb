elation.requireCSS('janusweb.chat');
elation.require(['ui.window', 'ui.list', 'ui.input', 'elation.collection'], function() {
  elation.template.add('janusweb.chat.message', '[{userId}] {message}');

  elation.component.add('janusweb.chat', function() {
    this.init = function() {
      this.args.title = 'Chat Log';
      this.args.bottom = true;
      this.args.resizable = false;
      this.args.controls = true;
      this.client = this.args.client;
      this.player = this.args.player || this.client.player;
      this.network = this.args.network;

      elation.janusweb.chat.extendclass.init.call(this);

      this.chatbutton = elation.ui.button({classname: 'janusweb_chat', label: 'Chat'});
      elation.events.add(this.chatbutton, 'ui_button_click', elation.bind(this, this.toggleChat));
      this.client.buttons.add('chat', this.chatbutton);

      this.messagecollection = elation.collection.indexed({index: 'timestamp'});
      var panel = elation.ui.panel_vertical({classname: 'janusweb_chat_panel'});
      this.messagelist = elation.ui.list({append: panel, classname: 'janusweb_chat_messages', itemcollection: this.messagecollection, attrs: {itemtemplate: 'janusweb.chat.message'}});
      this.input = elation.ui.input({
        append: panel, 
        classname: 'janusweb_chat_input', 
        placeholder: 'Press T to talk',
        events: {
          ui_input_accept: elation.bind(this, this.sendmessage),
          focus: elation.bind(this, this.focus),
          blur: elation.bind(this, this.blur),
        }
      });

      this.setcontent(panel);
      this.hide();
    }
    this.addmessage = function(msg) {
      if (!msg.timestamp) msg.timestamp = window.performance.now();
      var bottom = this.messagelist.isScrollAtBottom();
      if (elation.utils.isObject(msg.message)) {
        msg.message = msg.message.data;
      }
      this.messagecollection.add(msg);
      if (bottom) {
        this.messagelist.scrollToBottom();
      }
      this.refresh();
    }
    this.sendmessage = function() {
      this.network.send({'method': 'chat', data: this.input.value});
      var msg = {userId: 'me', message: this.input.value, self: true};
      this.addmessage(msg);
      elation.events.fire({element: this, type: 'janusweb_chat_send', data: msg});
      this.input.value = '';
    }
    this.focus = function() {
      if (this.input) {
        this.input.focus();
      }
      if (this.player) {
        this.player.disable();
      }
    }
    this.blur = function() {
      if (this.player) {
        this.player.enable();
      }
    }
    this.toggleChat = function() {
      if (this.hidden) {
        this.show();
        this.refresh();
      } else {
        this.hide();
        this.refresh();
      }
    }
  }, elation.ui.window);
});
