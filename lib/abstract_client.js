const _  = require('lodash');
const amqp = require('amqplib');

class AbstractClient {
	constructor (config) {
		this.config = config;
	}

	async connect() {
		const host = _.get(this.config, 'host');
		const port = _.get(this.config, 'port');
		const username = _.get(this.config, 'username');
		const password = _.get(this.config, 'password');
		const vhost = _.get(this.config, 'vhost');
		const queueName = _.get(this.config, 'queueName');
		// set bury queue name
		const buryQueueName = `${queueName}_bury`;
		this.config.buryQueueName = buryQueueName;

		// open connection
		const amqpURL = `amqp://${username}:${password}@${host}:${port}/${vhost}`;
		this.connection = await amqp.connect(amqpURL);

		// open channel
		this.channel = await this.connection.createChannel();

		// assert queue
		await this.channel.assertQueue(queueName);
		// assert bury queue
		await this.channel.assertQueue(buryQueueName);
	}

	async close() {
		// close channel
		if (this.channel) {
			await this.channel.close();
			this.channel = null;
		}
		// close connection
		if (this.connection) {
			await this.connection.close();
			this.connection = null;
		}
	}

	isConnected() {
		return this.channel && this.connection;
	}
}

module.exports = AbstractClient;
