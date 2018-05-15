const _  = require('lodash');
const config = require('config');
const {Client} = require('../index');

const rabbitMQConfig = _.merge({}, config.get('rabbitMQ'), {
	queueName: 'testQueue'
});

function sleep(time) {
	return new Promise(function (resolve) {
		setTimeout(resolve, time);
	});
}

async function demoKick() {
	const client = new Client(rabbitMQConfig);
	try {
		await client.connect();
		while (true) {
			await client.kick(10);
			sleep(500);
		}
	} catch (e) {
		console.log(e);
	}
	await client.close();
}

demoKick();
