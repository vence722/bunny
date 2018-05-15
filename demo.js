const _  = require('lodash');
const config = require('config');
const {Client} = require('./index');

const rabbitMQConfig = _.merge({}, config.get('rabbitMQ'), {
	queueName: 'testQueue'
});

function sleep(time) {
	return new Promise(function (resolve) {
		setTimeout(resolve, time);
	});
}

async function demoProducer() {
	const producer = new Client(rabbitMQConfig);
	try {
		await producer.connect();
		while (true) {
			await producer.put("" + new Date().getTime());
		}
	} catch (e) {
		console.log(e);
	}
	await producer.close();
}

async function demoConsumer() {
	const consumer = new Client(rabbitMQConfig);
	try {
		await consumer.connect();
		while (true) {
			const job = await consumer.consume();
			if (job) {
				console.log(`messageId: ${job.jobId}, content: ${job.content.toString()}`);
				consumer.delete(job);
				// consumer.bury(job);
			}
		}
	} catch (e) {
		console.log(e);
	}
	
	await consumer.close();
}

async function demoKick() {
	const client = new Client(rabbitMQConfig);
	try {
		await client.connect();
		while (true) {
			await client.kick(10);
		}
	} catch (e) {
		console.log(e);
	}
	await client.close();
}

// demoProducer();
demoConsumer();
demoKick();
