const _  = require('lodash');
const config = require('config');
const {Producer} = require('./index');

async function demo() {
	const producerConfig = _.merge({}, config.get('rabbitMQ'), {
		queueName: 'testQueue'
	});
	const producer = new Producer(producerConfig);
	try {
		await producer.connect();

		await producer.putJob("sdfsdfsdf");
	} catch (e) {
		console.log(e);
	}
	console.log('3');
	await producer.close();
}

demo();
