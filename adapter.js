'use strict';

const crypto = require('crypto');
const {
  Adapter,
  Database,
  Device,
  Event,
  Property,
} = require('gateway-addon');
const WebhookEventsAPIHandler = require('./api-handler');
const manifest = require('./manifest.json');

class WebhookEventsDevice extends Device {
  constructor(adapter, config) {
    super(adapter, 'webhook-events');

    this.name = 'Webhook Events';
    this.config = config;

    for (const hook of config.hooks) {
      if (hook.propertyKey) {
        this.addEvent(
          hook.name,
          {
            title: hook.name,
            type: hook.propertyValueType,
          }
        );
        this.properties.set(
          hook.name,
          new Property(
            this,
            hook.name,
            {
              title: hook.name,
              type: hook.propertyValueType,
              readOnly: true,
            }
          )
        );
      } else {
        this.addEvent(hook.name, {title: hook.name});
      }
    }

    this.links.push({
      rel: 'alternate',
      mediaType: 'text/html',
      // eslint-disable-next-line max-len
      href: `/extensions/webhook-events?thingId=${encodeURIComponent(this.id)}`,
    });
  }

  triggerEvent(id, value) {
    for (const hook of this.config.hooks) {
      if (id === hook.id) {
        this.eventNotify(new Event(this, hook.name, value));

        if (this.properties.has(hook.name)) {
          const property = this.properties.get(hook.name);
          property.setCachedValueAndNotify(value);
        }
      }
    }
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
      if (!config.hooks) {
        config.hooks = [];
      }

      for (const hook of config.hooks) {
        if (!hook.id) {
          hook.id = `${crypto.randomBytes(16).toString('hex')}`;
        }
      }

      this.config = config;
      return db.saveConfig(config);
    }).then(() => {
      this.device = new WebhookEventsDevice(this, this.config);
      this.handleDeviceAdded(this.device);
      this.apiHandler = new WebhookEventsAPIHandler(
        addonManager,
        this,
        this.config
      );
    }).catch(console.error);
  }

  startPairing() {
    if (!this.devices.hasOwnProperty(this.device.id)) {
      this.handleDeviceAdded(this.device);
    }
  }
}

module.exports = WebhookEventsAdapter;
