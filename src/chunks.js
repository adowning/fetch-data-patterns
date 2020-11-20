const { getAllAccounts, http, fetchData, chunks } = require('./helpers')

const t0 = Date.now();
const URLs = []

async function buildOrderUrls(accounts) {
  for (let i = 0; i < 1; i++) {
    URLs.push(`/accounts?limit=100&page=${i}`)
  }
}
async function main() {
  const accounts = await getAllAccounts()
  chunks(accounts, fetchData, 50).then((res) => {
    const t1 = Date.now()
    console.log(`Fetch time: ${t1 - t0} ms`)
  })
}

main()