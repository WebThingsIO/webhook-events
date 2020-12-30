'use strict';

const {APIHandler, APIResponse} = require('gateway-addon');
const manifest = require('./manifest.json');

class WebhookEventsAPIHandler extends APIHandler {
  constructor(addonManager, adapter, config) {
    super(addonManager, manifest.id);
    addonManager.addAPIHandler(this);

    this.adapter = adapter;
    this.config = config;
  }

  async handleRequest(request) {
    if (request.method === 'GET') {
      if (request.path === '/config') {
        return new APIResponse({
          status: 200,
          contentType: 'application/json',
          content: JSON.stringify(this.config),
        });
      } else {
        return new APIResponse({status: 404});
      }
    }

    if (request.method !== 'POST') {
      return new APIResponse({status: 404});
    }

    let hook = null;
    for (const h of this.config.hooks) {
      if (request.path === `/${h.id}`) {
        hook = h;
        break;
      }
    }

    if (!hook) {
      return new APIResponse({status: 404});
    }

    if (hook.properties && hook.properties.length > 0) {
      for (const prop of hook.properties) {
        let value = request.body;

        // Decode a top-level 'payload' key, if present.
        if (Object.keys(value).length === 1 &&
            Object.prototype.hasOwnProperty.call(value, 'payload') &&
            typeof value.payload === 'string') {
          value = JSON.parse(value.payload);
        }

        for (const part of prop.key.split('.')) {
          if (!Object.prototype.hasOwnProperty.call(value, part)) {
            value = null;
            break;
          }

          value = value[part];
        }

        console.log('Triggering:', prop.key);
        this.adapter.device.triggerEvent(hook.id, prop.key, value);
      }
    } else {
      this.adapter.device.triggerEvent(hook.id);
    }

    return new APIResponse({status: 201});
  }
}

module.exports = WebhookEventsAPIHandler;
