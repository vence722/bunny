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
			// console.log('before put job');
			await producer.put("" + new Date().getTime());
			// console.log('after put job');
			await sleep(100);
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
				if (job.jobId % 10 === 0) {
					console.log('bury job, jobId:', job.jobId)
					consumer.bury(job);
					continue;
				}
				consumer.delete(job);
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
			console.log('before kick');
			await client.kick(10);
			console.log('after kick');
		}
	} catch (e) {
		console.log(e);
	}
	await client.close();
}

demoProducer();
// demoConsumer();
// demoKick();
