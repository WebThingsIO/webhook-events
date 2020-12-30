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
      if (hook.properties && hook.properties.length > 0) {
        for (const prop of hook.properties) {
          this.addEvent(
            `${hook.name}-${prop.key}`,
            {
              title: `${hook.name} (${prop.key})`,
              type: prop.valueType,
            }
          );
          this.properties.set(
            `${hook.name}-${prop.key}`,
            new Property(
              this,
              `${hook.name}-${prop.key}`,
              {
                title: `${hook.name} (${prop.key})`,
                type: prop.valueType,
                readOnly: true,
              }
            )
          );
        }
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

  triggerEvent(id, key, value) {
    console.log('triggerEvent:', id, key, value);
    for (const hook of this.config.hooks) {
      if (id === hook.id) {
        if (typeof key === 'undefined' || this.events.has(hook.name)) {
          this.eventNotify(new Event(this, hook.name));
        } else if (this.events.has(`${hook.name}-${key}`)) {
          this.eventNotify(new Event(this, `${hook.name}-${key}`, value));
          const property = this.properties.get(`${hook.name}-${key}`);
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

        if (hook.propertyKey || hook.propertyValueType) {
          if (!hook.properties || hook.properties.length === 0) {
            hook.properties = [
              {
                key: hook.propertyKey,
                valueType: hook.propertyValueType,
              },
            ];
          } else {
            delete hook.propertyKey;
            delete hook.propertyValueType;
          }
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
