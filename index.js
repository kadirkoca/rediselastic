require("dotenv").config()
const express = require("express")
const redisService = require("./lib/redis-service")
const elasticService = require("./lib/elastic-service")
const weatherService = require("./lib/weather-service")
const bodyParser = require("body-parser")
const { nanoid } = require("nanoid")

const app = express()

app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)

app.get("/weather", async (req, res) => {
	const searchTerm = req.query.q ? req.query.q.toLowerCase() : null
	if(!searchTerm || !searchTerm.includes(':')){
        return {
            status: 500,
            data: null,
            message: "Error message: Invalid search term"
        }
	}
	
	/*
		step 1: check redis
		step 2: check elastic
		step 3: request an external API service
	*/

	try {
		// STEP 1 REDIS
		const redisData = await redisService.getData(searchTerm.split(':')[1])
		if(redisData.status === 200){			
			return res.status(redisData.status).send(redisData)
		}

		// STEP 2 ELASTIC
		const elasticData = await elasticService.indexdata(searchTerm)
		if(elasticData.status === 200){
			redisService.storeData(searchTerm.split(':')[1], elasticData.data) // SAVE TO REDIS
			return res.status(elasticData.status).send(elasticData)
		}

		// STEP 3 WEATHER
		const weatherAPIData = await weatherService.getWeather(searchTerm.split(':')[1])
		if(weatherAPIData.status === 200){
			const dataToStore = {
				id: nanoid(),
				city: weatherAPIData.data.location.name,
				country: weatherAPIData.data.location.country,
				temperature: weatherAPIData.data.current.temperature,
				weather_descriptions: weatherAPIData.data.current.weather_descriptions[0],
				method: "new"
			}
			const elasticStore = await elasticService.storedata(dataToStore) // SAVE TO ELASTIC
			redisService.storeData(searchTerm.split(':')[1], elasticStore.data) // SAVE TO REDIS
			elasticStore.message = weatherAPIData.message
			res.status(elasticStore.status).send(elasticStore)
		}
	} catch (error) {
		return res.status(500).send({
			status: 500,
			data: null,
			message: error.message
		})
	}
})

app.listen(process.env.PORT || 3000, () => {
	console.log("Node server started")
})