const { Client } = require("@elastic/elasticsearch")
const fs = require("fs")

const isdocker = process.env.IS_DOCKER === "true"

const config = {
	user: isdocker ? process.env.DOCKER_ELASTIC_USER : process.env.ELASTIC_USER,
	pass: isdocker ? process.env.DOCKER_ELASTIC_PASS : process.env.ELASTIC_PASS,
	host: isdocker ? process.env.DOCKER_ELASTIC_HOST : process.env.ELASTIC_HOST,
	port: isdocker ? process.env.DOCKER_ELASTIC_PORT : process.env.ELASTIC_PORT,
	cert_path: isdocker ? '/usr/share/elasticsearch/config/certs/ca/ca.crt' : '../../elasticsearch-8.1.1/config/certs/http_ca.crt'
}

const elasticClient = new Client({
	node: `https://${config.host}:${config.port}`,
	auth: {
		username: config.user,
		password: config.pass,
	},
	tls: {
	  	ca: fs.readFileSync(config.cert_path),
	  	rejectUnauthorized: false
	}
})

module.exports = elasticClient
