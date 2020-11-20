

const MongoClient = require('mongodb').MongoClient
const axios = require('axios')
const throttleAdapterEnhancer = require('axios-extensions').throttleAdapterEnhancer
// @ts-ignore
const http = axios.create({
  baseURL: 'https://api.servicemonster.net/v1',
  headers: {
    'Cache-Control': 'no-cache',
    authorization: 'Basic NGM4T1JQbk86Q2ppVU1ydHZxZVg0TVN0MA==',
  },
  // @ts-ignore
  adapter: throttleAdapterEnhancer(axios.defaults.adapter, {
    threshold: 2 * 1000,
  }),
})
async function getDB(){
    return await MongoClient.connect(
    'mongodb://localhost:27017',
    { useNewUrlParser: true, useUnifiedTopology: true })
}

const getIdList = (n) => [...new Array(n)].map((item, i) => i + 1)

// const fetchPhoto = (id) => {
//   const url = `https://jsonplaceholder.typicode.com/photos/${id}`
//   return axios.get(url).then((res) => res.data)
// }
function fetchData(url) {
  // const url = `/accounts/${id}/orders`
  return http
    .get(url)
    .then(function (response) {
      return response.data.items
    })
    .catch(function (error) {
      console.log(error)
      return { success: false }
    })
}



function all(items, fn) {
  const promises = items.map((item) => fn(item))
  return Promise.all(promises)
}

function series(items, fn) {
  let result = []
  return items
    .reduce((acc, item) => {
      acc = acc.then(() => {
        return fn(item).then((res) => result.push(res))
      })
      return acc
    }, Promise.resolve())
    .then(() => result)
}

function splitToChunks(items, chunkSize = 50) {
  const result = []
  for (let i = 0; i < items.length; i += chunkSize) {
    result.push(items.slice(i, i + chunkSize))
  }
  return result
}

function chunks(items, fn, chunkSize) {
  let result = []
  const chunks = splitToChunks(items, chunkSize)
  return series(chunks, (chunk) => {
    return all(chunk, fn).then((res) => (result = result.concat(res)))
  }).then(() => result)
}

function getAllAccounts(URLs) {
  return Promise.all(URLs.map(fetchData))
}

module.exports = {
  getIdList,
  fetchData,
    getAllAccounts,
  all,
  getDB,
  http,
  series,
  chunks,
}