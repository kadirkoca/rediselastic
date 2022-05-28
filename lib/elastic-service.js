const elasticClient = require("./elastic-connection")

const elasticIndex = "weather"

// {
//     id: "1",
//    "city": "Paris",
//    "country": "France",
//    "temperature": 17,
//     weather_descriptions: "Light Rain With Thunderstorm",
//     created_at: "12.05.2022 12:34",
//     updated_at: "12.05.2022 12:34",
// }
exports.storedata = async (data) => {
    const { id, city, country, temperature, weather_descriptions, method } = data
    const created_at = new Date()
    const updated_at = created_at
    
    try {
        switch (method) {
            case "new":
                const elasticNew = await elasticClient.index({
                        index: elasticIndex,
                        body: { city, country, temperature, weather_descriptions, created_at, updated_at },
                    })
                
                if(elasticNew){
                    return {
                        status: 200,
                        data: [{ city, country, temperature, weather_descriptions, created_at, updated_at }],
                        message: "Storing successful, from Elastic Search"
                    }
                }
                break
            case "update":
                const elasticUpdate = await elasticClient.update({
                        index: elasticIndex,
                        id,
                        body: {
                            doc: {
                                city,
                                country,
                                temperature,
                                weather_descriptions,
                                updated_at,
                            },
                        },
                    })
                
                if(elasticUpdate){
                    return { status: 200, data: elasticUpdate, message: "Updating successful, from Elastic Search" }
                }
                break
            case "delete":
                const elasticDelete = await elasticClient.delete({
                        index: elasticIndex,
                        id,
                    })
                
                if(elasticDelete){
                    return { status: 200, data: elasticDelete, message: "Updating successful, from Elastic Search" }
                }
                break
        }
    } catch (error) {
        return { status: 500, data: null, message: error.message }
    }
}

exports.indexdata = async (searchquery) => {    
    const searchText = figureQuery(searchquery)
    const query = { bool: { should: searchText } }
    let response = null
    try {
        response = await elasticClient.search(
                {
                    index: elasticIndex,
                    from: 0,
                    size: 100,
                    body: {
                        query,
                    },
                }
            )
    } catch (error) {
        return { status: 509, data: null, message: error.message }
    }
    
    if(response){
        const data = responseData(response?.hits?.hits)
        if(data){
            return { status: 200, data, message: "Success, from Elastic Search"}
        }else{
            return { status: 404, data: null, message: "Elastic Search could not find data" }
        }
    }else{
        return { status: 500, data: null, message: "Elastic Search could not find data" }
    }
}

const responseData = (data) => {
    const resData = []
    for(let record of data){
        resData.push(record._source)
    }
    return resData.length === 0 ? null : resData
}

const figureQuery = (query) => {
    const searchGroup = []
    const queryFields = query.split(':')

    let fieldset = {}
    fieldset[queryFields[0]] = queryFields[1].trim()
    let match = {}
    match["match"] = fieldset
    searchGroup.push(match)

    return searchGroup
}
