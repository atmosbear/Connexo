// @ts-check

/**
 * A user-generated piece of textual information.
 * @param {string} title
 * @returns { {title: string, parents: any[], children: any[] }} 
 */
function entry(title) {
  const newEntry = { title, parents: [], children: [] }
  entries.push(entry)
  return newEntry
}
function test_entry() {
  console.assert(entries.length === 0, "Entries is not empty at the start of the test!")
  let a = entry("hello")
  console.assert(entries.includes(a) && entries.length === 1, "The new entry didn't get added to the global array!")
}

const entries = []
test_entry()