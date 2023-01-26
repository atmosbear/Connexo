// @ts-check

/**
 * A user-generated piece of textual information.
 * @param {string} title
 * @returns { {title: string, parents: any[], children: any[] }} 
 */
function entry(title) {
  const alreadyExistingEntry = entries.find(ent => ent.title === title)
  if (alreadyExistingEntry) {
    return alreadyExistingEntry
  } else {
    const newEntry = { title, parents: [], children: [] }
    entries.push(newEntry)
    return newEntry
  }
}
function test_entry() {
  console.assert(entries.length === 0, "Entries is not empty at the start of the test!")
  const helloEntry = entry("hello")
  console.assert(entries.includes(helloEntry) && entries.length === 1, "The new entry didn't get added to the global array!")
  // entries should not be duplicated, instead return the same object
  const helloEntry2 = entry("hello")
  console.assert(entries.length !== 2, "The entry was added twice!")
  console.assert(entries.length === 1, "There's something more in the array!")
}

const entries = []
test_entry()