const { createClient } = require("redis")

const isdocker = process.env.IS_DOCKER === "true"
const redis_url = isdocker
	? process.env.DOCKER_REDIS_URL
	: process.env.REDIS_URL
const redis_host = isdocker
	? process.env.DOCKER_REDIS_HOST
	: process.env.REDIS_HOST

const redis = createClient({
	url: redis_url,
	socket: {
		tls: false,
		servername: redis_host,
	},
})

redis.on("error", (err) => {
	console.log(err.message)
})

redis.on("connect", () => console.log("Connected to Redis!"))
redis.connect()

exports.getData = async (searchTerm) => {
	try {
		const weather = await redis.get(searchTerm)
		if (weather) {
			return {
				status: 200,
				data: JSON.parse(weather),
				message: "Data retrieved from the Redis Cache",
			}
		} else {
			return {
				status: 404,
				data: null,
				message: "Data could not be retrieved from the Redis Cache",
			}
		}
	} catch (err) {
		return {
			status: 500,
			data: null,
			message: err.message,
		}
	}
}


exports.storeData = (searchkey, data) => {
	try {
		const redisStored = redis.setEx(
			searchkey,
			parseInt(process.env.REDIS_CACHE_TIMEOUT),
			JSON.stringify(data)
		)
	
		if(redisStored){
			return {
				status: 200,
				data,
				message: "Data stored in the Redis Cache",
			}
		}
	} catch (error) {
		return {
			status: 500,
			data: null,
			message: error.message,
		}
	}
}