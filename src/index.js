const { getAllAccounts, http, getDB, fetchData, chunks } = require('./helpers')

var t0 = Date.now()
// function getorders() {
//   chunks(getAllAccounts(), fetchData, 50).then((res) => {
//     const t1 = Date.now()
//     console.log(`Fetch time: ${t1 - t0} ms`)
//   })
// }

async function main() {
  let client = await getDB()
  const db = client.db('recipeApp')
  const accountsCollection = db.collection('accounts')
  // @ts-ignore
  accountsCollection.deleteMany()
  const ordersCollection = db.collection('orders')
  // @ts-ignore//     const t1 = Date.now()
  //     console.log(`Fetch time: ${t1 - t0} ms`)
  ordersCollection.deleteMany()

  const bulkAccounts = accountsCollection.initializeUnorderedBulkOp()
  const bulkOrders = ordersCollection.initializeUnorderedBulkOp()
  var bulkAccountsForUpdate = accountsCollection.initializeUnorderedBulkOp()

  let result = await http.get('/accounts')
  let count = result.data.count
  let rounds = Math.floor(count / 100)
  let URLs = []
  for (let i = 1; i < rounds + 2; i++) {
    URLs.push(`/accounts?limit=100&page=${i}`)
  }
  const accounts = await chunks(URLs, fetchData, 50)

  let t1 = Date.now()
  console.log(`Fetch time: ${t1 - t0} ms`)
  const accountList = []
  accounts.forEach((group) => {
    accountList.push(...group)
  })
  accountList.forEach((rawAccount) => {
    // orderURLs.push(`/orders/${rawAccount.accountID}/orders`)
    delete rawAccount.row_number
    bulkAccounts.insert(rawAccount)
  })
  await bulkAccounts.execute()

  // const accountsFromDb = await accountsCollection.find()
  result = await http.get('/orders')
  count = result.data.count
  rounds = Math.floor(count / 100)
  let orderURLs = []
  console.log('rounds ', rounds)
  for (let i = 1; i < rounds + 2; i++) {
    orderURLs.push(`/orders?limit=100&page=${i}`)
  }
  t0 = Date.now()
  let orders = await chunks(orderURLs, fetchData, 10)

  t1 = Date.now()
  console.log(`Fetch time: ${t1 - t0} ms`)
  const ordersList = []
  orders.forEach((group) => {
    ordersList.push(...group)
  })
  ordersList.forEach(async (rawOrder) => {
    delete rawOrder.row_number
    rawOrder.inhouse = false
    if (rawOrder.RefNumber !== undefined) {
      if (rawOrder.RefNumber.toLowerCase().includes('rug')) {
        rawOrder.inhouse = true
      }
    }
    let account = await accountsCollection.findOne({
      accountID: rawOrder.accountID,
    })
    if (account != undefined) {
      if (account.orders != undefined) {
        account.orders.push(rawOrder.orderID)
      } else {
        var list = []
        list.push(rawOrder.orderID)
        account.orders = list
      }
      bulkAccountsForUpdate.insert(account)
    }
    console.log(rawOrder)
    bulkOrders.insert(rawOrder)
  })
  console.log('ordersList ', ordersList.length)
  await bulkOrders.execute()
  await bulkAccountsForUpdate.execute()
}
main()
