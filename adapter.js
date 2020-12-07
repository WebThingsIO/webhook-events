'use strict';

const {
  Adapter,
  Database,
  Device,
  Event,
} = require('gateway-addon');
const WebhookEventsAPIHandler = require('./api-handler');
const manifest = require('./manifest.json');

class WebhookEventsDevice extends Device {
  constructor(adapter, config) {
    super(adapter, 'webhook-events');

    this.name = 'Webhook Events';

    for (const event of config.events) {
      this.addEvent(event, {title: event});
    }

    this.links.push({
      rel: 'alternate',
      mediaType: 'text/html',
      // eslint-disable-next-line max-len
      href: `/extensions/webhook-events?thingId=${encodeURIComponent(this.id)}`,
    });
  }

  triggerEvent(name) {
    this.eventNotify(new Event(this, name));
  }
}

class WebhookEventsAdapter extends Adapter {
  constructor(addonManager) {
    super(addonManager, manifest.id, manifest.id);
    addonManager.addAdapter(this);

    const db = new Database(manifest.id);
    db.open().then(() => {
      return db.loadConfig();
    }).then((config) => {
      this.device = new WebhookEventsDevice(this, config);
      this.handleDeviceAdded(this.device);
      this.apiHandler = new WebhookEventsAPIHandler(addonManager, this);
    }).catch(console.error);
  }

  startPairing() {
    if (!this.devices.hasOwnProperty(this.device.id)) {
      this.handleDeviceAdded(this.device);
    }
  }
}

module.exports = WebhookEventsAdapter;
