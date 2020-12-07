'use strict';

const {APIHandler, APIResponse} = require('gateway-addon');
const manifest = require('./manifest.json');

class WebhookEventsAPIHandler extends APIHandler {
  constructor(addonManager, adapter) {
    super(addonManager, manifest.id);
    addonManager.addAPIHandler(this);

    this.adapter = adapter;
  }

  async handleRequest(request) {
    if (request.method !== 'GET' || request.path !== '/generate-event') {
      return new APIResponse({status: 404});
    }

    if (!request.query || !request.query.name) {
      return new APIResponse({status: 400});
    }

    if (!this.adapter.device.events.has(request.query.name)) {
      return new APIResponse({status: 404});
    }

    this.adapter.device.triggerEvent(request.query.name);
    return new APIResponse({status: 200});
  }
}

module.exports = WebhookEventsAPIHandler;
