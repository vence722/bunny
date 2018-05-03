const _  = require('lodash');
const config = require('config');
const {Producer, Consumer} = require('./index');

const rabbitMQConfig = _.merge({}, config.get('rabbitMQ'), {
	queueName: 'testQueue'
});

function sleep(time) {
	return new Promise(function (resolve) {
		setTimeout(resolve, time);
	});
}

async function demoProducer() {
	const producer = new Producer(rabbitMQConfig);
	try {
		await producer.connect();
		while (true) {
			await producer.putJob("" + new Date().getTime());
			await sleep(100);
		}
	} catch (e) {
		console.log(e);
	}
	await producer.close();
}

async function demoConsumer() {
	const consumer = new Consumer(rabbitMQConfig);
	try {
		await consumer.connect();
		while (true) {
			const msg = await consumer.consume();
			if (msg) {
				console.log(`messageId: ${msg.messageId}, content: ${msg.content.toString()}`);
			}
		}
	}catch (e) {
		console.log(e);
	}
	await consumer.close();
}

demoProducer();
demoConsumer();
