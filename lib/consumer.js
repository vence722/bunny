const AbstractClient = require('./abstract_client');

class Consumer extends AbstractClient {
	constructor(config) {
		super(config);
	}

	async consume() {
		if (!this.isConnected()) {
			throw new Error('Connection is not estabalished.');
		}
		const msg = await this.channel.get(this.config.queueName);
		if (msg) {
			this.channel.ack(msg);
			return {
				messageId: msg.fields.deliveryTag,
				content: msg.content
			};
		}
		return null;
	}
}

module.exports = Consumer;
