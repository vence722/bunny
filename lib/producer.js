const AbstractClient = require('./abstract_client');

class Producer extends AbstractClient {
	constructor(config) {
		super(config);
	}

	async putJob(payload, options) {
		if (!this.isConnected()) {
			throw new Error('Connection is not estabalished.');
		}
		await this.channel.sendToQueue(this.config.queueName, Buffer.from(payload), options);
	}
}

module.exports = Producer;
