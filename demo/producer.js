const _  = require('lodash');
const config = require('config');
const {Client} = require('../index');

const DEFAULT_PRIORITY = 50;

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
			await producer.put("" + new Date().getTime(), {
				priority: DEFAULT_PRIORITY,
				delay: 5000,
				ttl: 300*1000
			});
			console.log('after put job');
			await sleep(500);
		}
	} catch (e) {
		console.log(e);
	}
	await producer.close();
}

demoProducer();
