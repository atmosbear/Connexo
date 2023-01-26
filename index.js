// @ts-check

/**
 * A user-generated piece of textual information.
 * @param {string} title
 * @returns { {title: string, parentTitles: string[], childrenTitles: string[] }} 
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
 * Places the given entries into localstorage.
 * @param {[{title: string, parentTitles: string[], childrenTitles: string[] }]} entries 
 */
function save(entries) {
  const data = JSON.stringify(entries)
  localStorage.setItem("entries", data)
  return data
}
/**
 * A helper function that returns options for adding relations to entries. 
 * @param {string} entryTitle the title of the entry to give a relation to
 * @returns {{aChild(childTitle: string), aParent(parentTitle: string)}}
 */
function give(entryTitle) {
  function addUnlessAlreadyPresent(thingToAdd, arrayToAddTo) {
    if (!arrayToAddTo.includes(thingToAdd)) {
      arrayToAddTo.push(thingToAdd)
    }
  }
  function removeFromArrayIfPresent(thingToRemove, arrayToRemoveFrom) {
    if (arrayToRemoveFrom.includes(thingToRemove)) {
      arrayToRemoveFrom.splice(arrayToRemoveFrom.indexOf(thingToRemove), 1)
    }
  }
  return {
    aChild(childTitle) {
      removeFromArrayIfPresent(childTitle, entry(entryTitle).parentTitles)
      addUnlessAlreadyPresent(childTitle, entry(entryTitle).childrenTitles)
      removeFromArrayIfPresent(entryTitle, entry(childTitle).childrenTitles)
      addUnlessAlreadyPresent(entryTitle, entry(childTitle).parentTitles)
    },
    aParent(parentTitle) {
      removeFromArrayIfPresent(parentTitle, entry(entryTitle).childrenTitles)
      addUnlessAlreadyPresent(parentTitle, entry(entryTitle).parentTitles)
      removeFromArrayIfPresent(entryTitle, entry(parentTitle).parentTitles)
      addUnlessAlreadyPresent(entryTitle, entry(parentTitle).childrenTitles)
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
  function test_parentAndChildGiving() {
    // test parents
    entries.length = 0
    give("hello").aParent("kittens")
    ensure(entry("kittens").childrenTitles.includes("hello"), "entry 'kittens' does not have the child 'hello'.")
    ensure(entry("hello").parentTitles.includes("kittens"), "entry 'hello' does not have the parent 'kittens'.")
    // test children
    entries.length = 0
    give("hello").aChild("kittens")
    ensure(entry("hello").childrenTitles.includes("kittens"), "The entry 'hello' does not have the child 'kittens'.")
    ensure(entry("kittens").parentTitles.includes("hello"), "The entry 'kittens' does not have the parents 'hello'.")
  }
  function test_noParentAndChildDupes() {
    entries.length = 0
    // parent and child relations to the same entry cannot exist; they are instead just the newest relation defined.
    give("A").aChild("B")
    give("B").aChild("A")
    ensure(!entry("A").childrenTitles.includes("B"), "A should not have B as a title, but it does!")
    ensure(!entry("B").parentTitles.includes("A"), "B should not have A as a parent, but it does!")
    ensure(entry("A").parentTitles.includes("B"), "A should have B as a title, but it doesn't!")
    ensure(entry("B").childrenTitles.includes("A"), "B should have A as a parent, but it doesn't!")
    ensure(entry("A").childrenTitles.length === 0, "A shouldn't have children, but it does!")
    ensure(entry("A").parentTitles.length === 1, "A doesn't have exactly 1 parent.")
    ensure(entry("B").childrenTitles.length === 1, "B should have one child, but it doesn't.")
    ensure(entry("B").parentTitles.length === 0, "B shouldn't have children, but it does!")
  }
  function test_saving() {
    entries.length = 0
    give("A").aChild("B")
    give("B").aChild("C")
    give("A").aChild("D")
    give("C").aParent("E")
    let dataBeforeSavingAndLoading = JSON.stringify(entries)
    let dataAfterSavingAndLoading = load(save(entries))
    ensure(dataBeforeSavingAndLoading === dataAfterSavingAndLoading, "The entries being loaded after are NOT the same as the entries that were saved!")
  }
  [test_entry, test_parentAndChildGiving, test_noParentAndChildDupes].forEach(test => test()) // run all tests
  entries.length = 0 // ensure the entries are reset before ending tests.
}

const entries = []
runTests()