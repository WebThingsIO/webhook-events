(function() {
  class WebhookEventsExtension extends window.Extension {
    constructor() {
      super('webhook-events');
      this.load();
    }

    load() {
      this.content = '';
      return fetch(`/extensions/${this.id}/views/content.html`)
        .then((res) => res.text())
        .then((text) => {
          this.content = text;
        })
        .catch((e) => console.error('Failed to fetch content:', e));
    }

    show(context) {
      this.showBackButton('/things');
      this.view.innerHTML = this.content;

      const params = new URLSearchParams(context.querystring);
      const thingId = params.get('thingId');

      if (!thingId) {
        return;
      }

      const description = document.getElementById(
        'extension-webhook-events-thing-description'
      );

      description.innerText =
        `GET ${window.location.origin}/extensions/${
          this.id}/api/generate-event?name=<event-name>&jwt=${window.API.jwt}`;
    }
  }

  new WebhookEventsExtension();
})();
