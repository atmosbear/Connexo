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
 * Places the given entries into localstorage, returning their string counterpart.
 * @param {{title: string, parentTitles: string[], childrenTitles: string[] }[]} entries
 * @returns {string} the JSON-stringified data. 
 */
function save(entries) {
  const data = JSON.stringify(entries)
  localStorage.setItem("entries", data)
  return data
}
/**
 * Retrieves the entries from localstorage and returns them as a parsed object.
 * @returns {{title: string, parentTitles: string[], childrenTitles: string[] }[] | []} the data as an object.
 */
function loadEntries() {
  let newEntries
  const data = localStorage.getItem("entries")
  if (data)
    newEntries = JSON.parse(data)
  else
    newEntries = []
  return newEntries
}
/**
 * A helper function that returns options for adding relations to entries. 
 * @param {string} entryTitle the title of the entry to give a relation to
 * @returns {{aChild(childTitle: string), aParent(parentTitle: string)}}
 */
function give(entryTitle) {
  /**
   * Ensures that something is not within the array before trying to add it; otherwise, does nothing.
   * @param {any} thingToAdd 
   * @param {any[]} arrayToAddTo 
   */
  function addUnlessAlreadyPresent(thingToAdd, arrayToAddTo) {
    if (!arrayToAddTo.includes(thingToAdd)) {
      arrayToAddTo.push(thingToAdd)
    }
  }
  /**
   * Checks to see if something is within the array, and removes it if it is.
   * @param {any} thingToRemove 
   * @param {any[]} arrayToRemoveFrom 
   */
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
/**
 * Ensures that the shallow parts of an array are equal - doesn't go very deep.
 * @param {any[]} A 
 * @param {any[]} B 
 * @returns {boolean}
 */
function deepishArraysAreEqual(A, B, showComments = false) {
  let m = A.map(a => JSON.stringify(Object.entries(a)))
  let n = B.map(b => JSON.stringify(Object.entries(b)))
  let isEqual = true
  m.forEach(mm => {
    n.forEach(nn => {
      if (!n.includes(mm) || !m.includes(nn)) {
        if (showComments) {
          console.log("comparing '" + mm + "' and '" + nn + "'")
          console.log("Does n have mm?", n.includes(mm))
          console.log("Does m have nn?", m.includes(nn))
        } isEqual = false
      }
    })
  })
  return isEqual
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
  function test_saving_and_loading() {
    entries.length = 0
    give("A").aChild("B")
    give("B").aChild("C")
    give("A").aChild("D")
    give("C").aParent("E")
    const dataBeforeSavingAndLoading = entries
    const dataAfterSavingAndLoading = loadEntries()
    ensure(dataAfterSavingAndLoading !== undefined && dataAfterSavingAndLoading !== null, "The data doesn't exist!")
    ensure(deepishArraysAreEqual(dataBeforeSavingAndLoading, dataAfterSavingAndLoading), "The entries being loaded after are NOT the same as the entries that were saved!")
    entries.length = 0
  }
  function test_arrayEqualsMethod() {
    ensure(!deepishArraysAreEqual([1, 2, 3, { title: "red" }], [1, 2, 3, { title: "red", entries }]), "Nope.")
    ensure(deepishArraysAreEqual([1, 2, 3, { title: "red" }], [1, 2, 3, { title: "red" }]), "Nope.")
  }
  [test_entry, test_parentAndChildGiving, test_noParentAndChildDupes, test_saving_and_loading, test_arrayEqualsMethod].forEach(test => test()) // run all tests
  entries.length = 0 // ensure the entries are reset before ending tests.
}

/** @type {{ title: string; parentTitles: string[]; childrenTitles: string[]; }[]} */
let entries = []
runTests()
entries = loadEntries()