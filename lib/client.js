const _  = require('lodash');
const amqp = require('amqplib');
const Job = require('./model/Job');

const DEFAULT_JOB_TTL = 5 * 60 * 1000; // 5min
const DEFAULT_MAX_PRIORITY = 100

class AbstractClient {
	constructor (config) {
		this.config = config;
	}

	/**
	 *  connect to rabbitMQ server
	 */
	async connect() {
		const host = _.get(this.config, 'host');
		const port = _.get(this.config, 'port');
		const username = _.get(this.config, 'username');
		const password = _.get(this.config, 'password');
		const vhost = _.get(this.config, 'vhost');
		const queueName = _.get(this.config, 'queueName');
		const jobTTL = _.get(this.config, 'jobTTL') || DEFAULT_JOB_TTL;
		const maxPriority = _.get(this.config, 'maxPriority') || DEFAULT_MAX_PRIORITY;
		// set bury queue name
		const buryQueueName = `${queueName}_bury`;
		this.config.buryQueueName = buryQueueName;

		// open connection
		const amqpURL = `amqp://${username}:${password}@${host}:${port}/${vhost}`;
		this.connection = await amqp.connect(amqpURL);

		// open channel
		this.channel = await this.connection.createChannel();

		// define delay-job exchange
		await this.channel.assertExchange('delayed-message-exchange', 'x-delayed-message', {
			arguments: {
				'x-delayed-type': 'direct'
			}
		});

		// assert queue
		await this.channel.assertQueue(queueName, {
			messageTtl: jobTTL,
			maxPriority: maxPriority
		});

		// assert bury queue
		await this.channel.assertQueue(buryQueueName, {
			messageTtl: jobTTL,
			maxPriority: maxPriority
		});

		// bind queue to the delayed-message-exchange
		await this.channel.bindQueue(queueName, 'delayed-message-exchange');
	}

	/**
	 * close connection
	 */
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

	/**
	 * pick one job from the queue
	 */
	async consume() {
		if (!this.isConnected()) {
			throw new Error('Connection is not estabalished.');
		}
		const msg = await this.channel.get(this.config.queueName);
		if (msg) {
			return new Job(msg);
		}
		return null;
	}

	/**
	 * put one job to the queue
	 * @param {*} payload the data to put to the queue
	 * @param {*} options 
	 * {
	 *     priority: int
	 *     delay(ms): int
	 *     ttl(ms): int
	 * }
	 */
	async put(payload, options) {
		if (!this.isConnected()) {
			throw new Error('Connection is not estabalished.');
		}
		await this.channel.publish('delayed-message-exchange', '', Buffer.from(payload), {
			priority: _.get(options, 'priority'),
			headers: {
				'x-delay': _.get(options, 'delay')
			},
			expiration: _.get(options, 'ttl')
		});
	}

	/**
	 * delete the job 
	 * will send ack to the msg
	 * @param {*} job 
	 */
	async delete(job) {
		if (!this.isConnected()) {
			throw new Error('Connection is not estabalished.');
		}
		await this.channel.ack(job.msg);
	}

	/**
	 * bury the job 
	 * will put a new msg to the bury queue
	 * and then delete the job
	 * @param {*} job 
	 */
	async bury(job) {
		if (!this.isConnected()) {
			throw new Error('Connection is not estabalished.');
		}
		// put job to bury queue
		this.channel.sendToQueue(this.config.buryQueueName, Buffer.from(job.content));
		// delete job
		await this.delete(job);
	}

	/**
	 * kick jobs from bury queue
	 * @param {Number} numJobs 
	 */
	async kick(numJobs) {
		if (!this.isConnected()) {
			throw new Error('Connection is not estabalished.');
		}
		for (let i = 0; i < numJobs; i++) {
			const msg = await this.channel.get(this.config.buryQueueName);
			if(msg) {
				await this.channel.sendToQueue(this.config.queueName, Buffer.from(msg.content));
				await this.channel.ack(msg);
			}
			
		}
	}

	isConnected() {
		return this.channel && this.connection;
	}
}

module.exports = AbstractClient;
