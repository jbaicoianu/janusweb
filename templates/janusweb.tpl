{dependency name="janusweb.client"}
<div data-elation-component="janusweb.client" data-elation-args.homepage="http://www.janusvr.com/index.html" id="default"></div>
{set var="page.title"}JanusWeb{/set}
<script>
window.onload = function() {
  setTimeout(function() {
    elation.ui.button({ append: document.body, classname: 'janusweb_voip', label: 'Toggle VR', events: { click: function() { elation.engine.instances.default.systems.render.views.main.toggleVR() } } });
  }, 1000);
}
</script>
