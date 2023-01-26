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

function runTests() {
  /**
   * A shortcut for "console.assert".
   * @param {boolean} what 
   * @param {string} message 
   */
  function ensure(what, message) {
    console.assert(what, message)
  }
  function test_entry() {
    // the entries array should be clean.
    entries.length = 0
    // ensure that the entry gets added to the global array
    const helloEntry = entry("hello")
    ensure(entries.includes(helloEntry) && entries.length === 1, "The new entry didn't get added to the global array!")
    // entries should not be duplicated, instead return the same object
    const helloEntry2 = entry("hello")
    ensure(entries.length !== 2, "The entry was added twice!")
    ensure(entries.length === 1, "The length should be one, but it's " + entries.length)
  }
  test_entry()
}

const entries = []
runTests()