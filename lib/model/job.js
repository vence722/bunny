class Job {
	constructor(msg) {
		this.msg = msg;
		this.jobId = msg.fields.deliveryTag;
		this.content = msg.content;
	}
}

 module.exports = Job;
 