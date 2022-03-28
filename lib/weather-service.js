const axios = require("axios")

exports.getWeather = async (location) => {
    try {
        const weatherFromAPI = await axios.get(
            `http://api.weatherstack.com/current?access_key=${process.env.WEATHER_API_KEY}&query=${location}`
        )
    
        if (weatherFromAPI.data && !weatherFromAPI.data.error) {
            return {
                status: 200,
                data: weatherFromAPI.data,
                message: "Successfully data fetched from an external API",
            }
        } else {
            return {
                status: 404,
                data: null,
                message: "API not working or Invalid search query",
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
