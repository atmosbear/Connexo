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
/**
 * Finds the relations from a given entry to all other entries given.
 * @param {string} entryTitle 
 * @param {string[]} arrayOfTitlesToFindTheRelationTo 
 * @returns {{d: string[], u: string[], dd: string[], uu: string[], du: string[], ud: string[], ddu: string[], dud: string[], udd: string[], duu: string[], uud: string[], udu: string[]}}
 */
function getRelations(entryTitle, arrayOfTitlesToFindTheRelationTo) {
  // d is down, u is up. 
  // for example dd is 'down down', or 'a child of a child' (a grandchild).

  let parentEs = entry(entryTitle).parentTitles.map(parentT => entry(parentT))
  let parentTs = entry(entryTitle).parentTitles
  let childEs = entry(entryTitle).childrenTitles.map(childT => entry(childT))
  let childTs = entry(entryTitle).childrenTitles
  let grandchildEs = childEs.flatMap(childE => childE.childrenTitles.map(gcT => entry(gcT))) // entry(childE.title))
  let grandparentEs = parentEs.flatMap(parentE => parentE.parentTitles.map(gpT => entry(gpT)))
  let grandchildTs = grandchildEs.map(entry => entry.title)
  let grandparentTs = grandparentEs.map(entry => entry.title)

  function calculateBasic1GenAway() {
    // children and parents - one generation away. There are others one gen away, but these are the simplest.
    let d = entry(entryTitle).childrenTitles // children
    let u = entry(entryTitle).parentTitles // parents
    return [d, u]
  }
  function calculate2GensAway() {
    // 2 ds or 2 us (all two generations away from current)
    let dd = grandchildEs.map(e => e.title) // grandchildren
    let uu = grandparentEs.map(e => e.title) // grandparents
    return [dd, uu]
  }

  function calculateSameGen() {
    // 1 u, 1 d (within the same generation the current)
    let du = childEs
      .flatMap(cE => cE.parentTitles)
      .filter(pT => pT !== entryTitle) // spouses
    let ud = parentEs
      .flatMap(pE => pE.childrenTitles)
      .filter((cT) => cT !== entryTitle) // siblings
    return [du, ud]
  }

  function calculateChildGen() {
    // 2 ds, 1 u (essentially all children in some way or another)
    let ddu = []
    // children in law
    ddu = grandchildEs
      .flatMap(gcE => gcE.parentTitles)
      .filter(childinlawT => !childTs.includes(childinlawT))
    let dud = childEs // stepchildren
      .flatMap(cE => cE.parentTitles)
      .filter(pT => pT !== entryTitle) // ensure we ignore the current entry
      .flatMap(spT => entry(spT))
      .flatMap(spE => spE.childrenTitles)
      .filter(stepcT => !childTs.includes(stepcT))
    let udd = parentEs // niblings
      .flatMap(pE => pE.childrenTitles)
      .filter(cT => cT !== entryTitle) // ensure we ignore the current entry
      .flatMap(sibT => entry(sibT))
      .flatMap(sibE => sibE.childrenTitles)
      .filter(nibT => !childTs.includes(nibT))
    // is it possible for niblings and stepchildren to be the same? Hmmm...
    return [ddu, dud, udd]
  }

  function calculateParentGen() {
    // 1 d, 2 us (essentially all parents in some way or another)
    let duu = // parents-in-laws
      childEs.flatMap((cE) => cE.parentTitles)
        .flatMap(spT => entry(spT))
        .flatMap(spE => spE.parentTitles)
        .filter(pilT => !parentTs.includes(pilT))
    let uud = parentEs  // auncles
      .flatMap(pE => pE.parentTitles)
      .flatMap(pT => entry(pT).childrenTitles)
      .filter(aunc => !parentTs.includes(aunc))
    let udu = parentEs // stepparents
      .flatMap(pE => pE.childrenTitles)
      .flatMap(sibT => entry(sibT))
      .flatMap(sibE => sibE.parentTitles)
      .filter(pT => !parentTs.includes(pT))
    return [duu, uud, udu]
  }
  let [d, u] = calculateBasic1GenAway()
  let [dd, uu] = calculate2GensAway()
  let [du, ud] = calculateSameGen()
  let [ddu, dud, udd] = calculateChildGen()
  let [duu, uud, udu] = calculateParentGen()
  const relations = { d, u, dd, uu, du, ud, ddu, dud, udd, duu, uud, udu }
  return relations
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
  function test_getRelations() {
    entries.length = 0
    // must test every relation: d, u, dd, uu, du, ud, ddu, dud, udd, duu, uud, and udu
    give("A").aChild("B")
    give("B").aChild("C")
    give("B").aChild("D")
    give("B").aParent("E")
    give("A").aParent("F")
    give("F").aChild("G")
    give("F").aParent("K")
    give("E").aParent("H")
    give("E").aChild("L")
    give("H").aParent("I")
    give("D").aParent("J")
    give("G").aChild("M")
    give("G").aParent("N")
    let Arelations = getRelations("A", entries.map(e => e.title))
    let Crelations = getRelations("C", entries.map(e => e.title))
    // DO NOT FORGET TO TEST RELATIONS THAT SHOULD _NOT_ BE INCLUDED, LIKE CHILDREN VS NIBLINGS 
    // d - child
    ensure(Arelations.d.includes("B"), "B isn't A's child, but it should be!")
    // u - parent
    ensure(Arelations.u.includes("F"), "F isn't A's parent, but it should be!")
    // dd - grandchild
    ensure(Arelations.dd.includes("C"), "C isn't A's grandchild, but it should be!")
    ensure(Arelations.dd.includes("D"), "D isn't A's grandchild, but it should be!")
    ensure(Arelations.dd.length === 2, "There aren't exactly 2 grandchildren, as there should be!")
    // uu - grandparent
    ensure(Arelations.uu.includes("K"), "K was not a gp as it should be!")
    // du - spouse
    ensure(Arelations.du.includes("E"), "A should have E as a spouse!")
    // ud - sibling
    ensure(Arelations.ud.includes("G"), "A doesn't have a sibling, but it should!")
    // ddu - child-in-law
    ensure(Arelations.ddu.includes("J"), "J isn't in there, but it should be!!")
    // dud - stepchild
    ensure(Arelations.dud.includes("L"), "L is not a stepchild, but it should be!")
    // udd - niblings
    ensure(Arelations.udd.includes("M"), "M is not a nibling, but it should be!")
    // duu - parent in law
    ensure(Arelations.duu.includes("H"), "It does not contain H as a parent in law!")
    ensure(!Arelations.duu.includes("F"), "F is a parent, and should not be a parent in law!")
    // udu - stepparent
    ensure(Arelations.udu.includes("N"), "N is not a stepparent, but it should be!")
    // uud - auncle
    ensure(Crelations.uud.includes("L"), "L should be a child of C, but it's not!")
  }
  // run all tests
  [test_entry, test_parentAndChildGiving, test_noParentAndChildDupes, test_saving_and_loading, test_arrayEqualsMethod, test_getRelations].forEach(test => test())
  entries.length = 0 // ensure the entries are reset before ending tests.
}

/**
 * Shortcut for getting CSS variables
 * @param {string} type 
 * @returns 
 */
function getSProp(type) {
  return document.querySelector("body")?.style.getPropertyValue(type)
}

/**
 * Shortcut for setting CSS variables
 * @param {string} type 
 * @param {string} value 
 */
function setSProp(type, value) {
  document.querySelector("body")?.style.setProperty(type, value)
}
function setColorTheme(theme) {
  setSProp("--header-text", theme.headerText)
  setSProp("--entry-p", theme.entryP)
  setSProp("--entry-s", theme.entryS)
  setSProp("--entry-text", theme.entryText)
  setSProp("--hover-entry-p", theme.hoverEntryP)
  setSProp("--hover-entry-s", theme.hoverEntryS)
  setSProp("--focused-entry-p", theme.focusedEntryP)
  setSProp("--focused-entry-s", theme.focusedEntryS)
  setSProp("--focused-entry-text", theme.focusedEntryText)
  setSProp("--bg-p", theme.bgP)
  setSProp("--bg-s", theme.bgS)
}
let blueDarkTheme = {
  headerText: "#DDFFFF",
  entryP: "#0357c5",
  entryS: "#134095",
  entryText: "white",
  hoverEntryP: "#135795",
  hoverEntryS: "#00344B",
  focusedEntryP: "#B37410",
  focusedEntryS: "#E49A26",
  focusedEntryText: "white",
  bgP: "#10509B",
  bgS: "#30344B"
}
let THEME_TEMPLATE = {
  headerText: "white",
  entryP: "white",
  entryS: "white",
  entryText: "white",
  hoverEntryP: "white",
  hoverEntryS: "white",
  focusedEntryP: "white",
  focusedEntryS: "white",
  focusedEntryText: "white",
  bgP: "white",
  bgS: "white"
}
let smokeTheme = {
  headerText: "#ab8",
  entryP: "#593B38",
  entryS: "#2E2C25",
  entryText: "white",
  hoverEntryP: "#f80",
  hoverEntryS: "#931",
  focusedEntryS: "#D39F75",
  focusedEntryP: "#AD7345",
  focusedEntryText: "black",
  bgP: "darkslategray",
  bgS: "lightblue"
}
let purpleTheme = {
  headerText: "white",
  entryP: "#4A2E3C",
  entryS: "#441C30",
  entryText: "#fee",
  focusedEntryS: "#AA3C32",
  focusedEntryP: "#3F1011",
  hoverEntryP: "#35263B",
  hoverEntryS: "#2E1836",
  bgP: "#725B7A",
  bgS: "#E6BAD0"
  // #6A123D #460023 #D38DAF  #8D2F5D #B05883
}
setColorTheme(blueDarkTheme)
/** @type {{ title: string; parentTitles: string[]; childrenTitles: string[]; }[]} */
let entries = []
runTests()
entries = loadEntries()
// test for design:
let i = 0
while (i < 3) {
  i++
  let entrydiv = document.createElement("div")
  entrydiv.classList.add("entry")
  entrydiv.innerText = "I'm testing this entry"
  document.querySelector(".column")?.appendChild(entrydiv)
}
let entrydiv2 = document.createElement("div")
entrydiv2.classList.add("entry")
entrydiv2.classList.add("focused")
entrydiv2.innerText = "This is a focused entry"
document.querySelector(".column")?.appendChild(entrydiv2)
i = 0
while (i < 3) {
  i++
  let entrydiv = document.createElement("div")
  entrydiv.classList.add("entry")
  entrydiv.innerText = "I'm testing this entry"
  document.querySelector(".column")?.appendChild(entrydiv)
}
let canvas = document.querySelector("canvas") ?? document.createElement("canvas") // this ternary is preventing TS errors about it possibly being null, which is untrue.
let context = canvas.getContext("2d") ?? new CanvasRenderingContext2D() // this ternary is preventing TS errors about it possibly being null, which is untrue.
canvas.height = innerHeight;
canvas.width = innerWidth
context.fillRect(100, 100, 500, 10)
