(function() {
  class WebhookEventsExtension extends window.Extension {
    constructor() {
      super('webhook-events');
      this.load();
    }

    load() {
      this.content = '';
      return window.API.getJson(
        `/extensions/${this.id}/api/config`
      ).then((config) => {
        this.config = config;
        return fetch(`/extensions/${this.id}/views/content.html`);
      }).then((res) => {
        return res.text();
      }).then((text) => {
        this.content = text;
      }).catch((e) => {
        console.error('Failed to fetch content:', e);
      });
    }

    show(context) {
      this.showBackButton('/things');
      this.view.innerHTML = this.content;

      const params = new URLSearchParams(context.querystring);
      const thingId = params.get('thingId');

      if (!thingId) {
        return;
      }

      const list = document.getElementById(
        'extension-webhook-events-endpoint-list'
      );

      const baseUrl = `${window.location.origin}/extensions/${this.id}/api/`;
      for (const hook of this.config.hooks) {
        const dt = document.createElement('dt');
        dt.innerHTML = `<b>Name:</b> ${hook.name}`;

        const dd = document.createElement('dd');
        dd.innerText = `${baseUrl}${hook.id}?jwt=${window.API.jwt}`;

        list.appendChild(dt);
        list.appendChild(dd);
      }
    }
  }

  new WebhookEventsExtension();
})();
