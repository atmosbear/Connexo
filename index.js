// @ts-check

/**
 * A user-generated piece of textual information.
 * @param {string} title
 * @returns { {title: string, parentTitles: any[], childrenTitles: any[] }} 
 */
function entry(title) {
  const alreadyExistingEntry = entries.find(ent => ent.title === title)
  if (alreadyExistingEntry) {
    return alreadyExistingEntry
  } else {
    const newEntry = { title, parentTitles: [], childrenTitles: [] }
    entries.push(newEntry)
    return newEntry
  }
}
/**
 * A helper function that returns options for adding relations to entries. 
 * @param {string} title the title of the entry to give a relation to
 * @returns {{aChild(childTitle: string), aParent(parentTitle: string)}
 */
function give(title) {
  const theEntry = entry(title)
  return {
    aChild(childTitle) {
      const childEntry = entry(childTitle)
      if (!theEntry.childrenTitles.includes(childTitle))
        theEntry.childrenTitles.push(childTitle)
      if (!childEntry.parentTitles.includes(theEntry.title))
        childEntry.parentTitles.push(theEntry.title)
    },
    aParent(parentTitle) {
      const parentEntry = entry(parentTitle)
      if (!theEntry.parentTitles.includes(parentTitle))
        theEntry.parentTitles.push(parentTitle)
      if (!parentEntry.childrenTitles.includes(theEntry.title))
        parentEntry.childrenTitles.push(theEntry.title)
    }
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
    // the entries array must start clean.
    entries.length = 0
    // ensure that the entry gets added to the global array
    const helloEntry = entry("hello")
    ensure(entries.includes(helloEntry) && entries.length === 1, "The new entry didn't get added to the global array!")
    // entries should not be duplicated, instead return the same object
    const helloEntry2 = entry("hello")
    ensure(entries.length !== 2, "The entry was added twice!")
    ensure(entries.length === 1, "The length should be 1, but it's " + entries.length)
  }
  function test_give() {
    entries.length = 0
    entry("hello")
    give("hello").aParent("kittens")
    ensure(entry("kittens").childrenTitles.includes("hello"), "entry 'kittens' does not have the child 'hello'.")
    ensure(entry("hello").parentTitles.includes("kittens"), "entry 'hello' does not have the parent 'kittens'.")
    entries.length = 0
    give("hello").aChild("kittens")
    ensure(entry("hello").childrenTitles.includes("kittens"), "The entry 'hello' does not have the child 'kittens'.")
    ensure(entry("kittens").parentTitles.includes("hello"), "The entry 'kittens' does not have the parents 'hello'.")
  }
  [test_entry, test_give].forEach(test => test()) // run all tests
  entries.length = 0 // ensure the entries are reset before ending tests.
}

const entries = []
runTests()