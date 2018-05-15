const _  = require('lodash');
const config = require('config');
const {Client} = require('../index');

const rabbitMQConfig = _.merge({}, config.get('rabbitMQ'), {
	queueName: 'testQueue'
});

async function demoConsumer() {
	const consumer = new Client(rabbitMQConfig);
	try {
		await consumer.connect();
		while (true) {
			// consume() will wait for 1 job coming 
			const job = await consumer.consume();
			if (job) {
				// do something
				console.log(`messageId: ${job.jobId}, content: ${job.content.toString()}`);
				if (job.jobId % 10 === 0) {
					// bury the job
					consumer.bury(job);
				} else {
					// delete the job
					consumer.delete(job);
				}
			}
		}
	} catch (e) {
		console.log(e);
	}
	
	await consumer.close();
}

demoConsumer();
