// @ts-check
import { setColorTheme, blueDarkTheme, purpleTheme } from "./theming.js";

/**
 * A user-generated piece of textual information.
 * @param {string} title
 * @returns { {title: string, parentTitles: string[], childrenTitles: string[] }}
 */
function entry(title) {
  const alreadyExistingEntry = entries.find((ent) => ent.title === title);
  if (alreadyExistingEntry) {
    return alreadyExistingEntry;
  } else {
    const newEntry = { title, parentTitles: [], childrenTitles: [] };
    entries.push(newEntry);
    return newEntry;
  }
}

/**
 * Places the given entries into localstorage, returning their string counterpart.
 * @param {{title: string, parentTitles: string[], childrenTitles: string[] }[]} entries
 * @returns {string} the JSON-stringified data.
 */
function save(entries) {
  const data = JSON.stringify(entries);
  localStorage.setItem("entries", data);
  return data;
}
/**
 * Retrieves the entries from localstorage and returns them as a parsed object.
 * @returns {{title: string, parentTitles: string[], childrenTitles: string[] }[] | []} the data as an object.
 */
function getFromLocalStorage() {
  let newEntries;
  const data = localStorage.getItem("entries");
  if (data) newEntries = JSON.parse(data);
  else newEntries = [];
  return newEntries;
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
      arrayToAddTo.push(thingToAdd);
    }
  }
  /**
   * Checks to see if something is within the array, and removes it if it is.
   * @param {any} thingToRemove
   * @param {any[]} arrayToRemoveFrom
   */
  function removeFromArrayIfPresent(thingToRemove, arrayToRemoveFrom) {
    if (arrayToRemoveFrom.includes(thingToRemove)) {
      arrayToRemoveFrom.splice(arrayToRemoveFrom.indexOf(thingToRemove), 1);
    }
  }
  return {
    aChild(childTitle) {
      removeFromArrayIfPresent(childTitle, entry(entryTitle).parentTitles);
      addUnlessAlreadyPresent(childTitle, entry(entryTitle).childrenTitles);
      removeFromArrayIfPresent(entryTitle, entry(childTitle).childrenTitles);
      addUnlessAlreadyPresent(entryTitle, entry(childTitle).parentTitles);
    },
    aParent(parentTitle) {
      removeFromArrayIfPresent(parentTitle, entry(entryTitle).childrenTitles);
      addUnlessAlreadyPresent(parentTitle, entry(entryTitle).parentTitles);
      removeFromArrayIfPresent(entryTitle, entry(parentTitle).parentTitles);
      addUnlessAlreadyPresent(entryTitle, entry(parentTitle).childrenTitles);
    },
  };
}
/**
 * Ensures that the shallow parts of an array are equal - doesn't go very deep.
 * @param {any[]} A
 * @param {any[]} B
 * @returns {boolean}
 */
function deepishArraysAreEqual(A, B, showComments = false) {
  let m = A.map((a) => JSON.stringify(Object.entries(a)));
  let n = B.map((b) => JSON.stringify(Object.entries(b)));
  let isEqual = true;
  m.forEach((mm) => {
    n.forEach((nn) => {
      if (!n.includes(mm) || !m.includes(nn)) {
        if (showComments) {
          console.log("comparing '" + mm + "' and '" + nn + "'");
          console.log("Does n have mm?", n.includes(mm));
          console.log("Does m have nn?", m.includes(nn));
        }
        isEqual = false;
      }
    });
  });
  return isEqual;
}
let leftToRights = [];
/**
 * Finds the relations from a given entry to all other entries given.
 * @param {string} entryTitle
 * @param {string[]} arrayOfTitlesToFindTheRelationTo
 * @returns {{d: string[], u: string[], dd: string[], uu: string[], du: string[], ud: string[], ddu: string[], dud: string[], udd: string[], duu: string[], uud: string[], udu: string[]}}
 */
function getRelations(entryTitle, arrayOfTitlesToFindTheRelationTo) {
  // d is down, u is up.
  // for example dd is 'down down', or 'a child of a child' (a grandchild).

  let parentEs = entry(entryTitle).parentTitles.map((parentT) =>
    entry(parentT)
  );
  let parentTs = entry(entryTitle).parentTitles;
  let childEs = entry(entryTitle).childrenTitles.map((childT) => entry(childT));
  let childTs = entry(entryTitle).childrenTitles;
  let grandchildEs = childEs.flatMap((childE) => {
    // add grandchildren to the canvas for linkage as children of focused entry's children
    childE.childrenTitles.forEach((gcT) =>
      leftToRights.push([childE.title, gcT])
    );
    // give the Es back
    return childE.childrenTitles.map((gcT) => entry(gcT));
  });
  let grandparentEs = parentEs.flatMap((parentE) => {
    // add grandparents to the canvas for linkage as parents of focused entry's parents
    parentE.parentTitles.forEach((gpT) =>
      leftToRights.push([gpT, parentE.title])
    );
    // give the Es back
    return parentE.parentTitles.map((gpT) => entry(gpT));
  });
  let grandchildTs = grandchildEs.map((entry) => entry.title);
  let grandparentTs = grandparentEs.map((entry) => entry.title);

  function calculateBasic1GenAway() {
    // children and parents - one generation away. There are others one gen away, but these are the simplest.
    let d = entry(entryTitle).childrenTitles; // children
    // add children to the canvas for linkage as children of the focused entry
    d.forEach((childTitle) => leftToRights.push([entryTitle, childTitle]));
    let u = entry(entryTitle).parentTitles; // parents
    // add parents to the canvas for linkage as parents of the focused entry
    u.forEach((parentTitle) => leftToRights.push([parentTitle, entryTitle]));
    return [d, u];
  }
  function calculate2GensAway() {
    // 2 ds or 2 us (all two generations away from current)
    // grandchildren and grandparents were already added to the canvas in the base of the method
    let dd = grandchildEs.map((e) => e.title); // grandchildren
    let uu = grandparentEs.map((e) => e.title); // grandparents
    return [dd, uu];
  }

  function calculateSameGen() {
    // 1 u, 1 d (within the same generation the current)
    let du = childEs
      .flatMap((cE) => {
        // add spouses to the canvas for linkage as parents of focused entry's children
        cE.parentTitles.forEach((pT) => leftToRights.push([pT, cE.title]));
        return cE.parentTitles;
      })
      .filter((pT) => pT !== entryTitle); // spouses
    let ud = parentEs
      .flatMap((pE) => {
        // add siblings to the canvas for linkage as descendents of parents
        pE.childrenTitles.forEach((sibT) =>
          leftToRights.push([pE.title, sibT])
        );
        return pE.childrenTitles;
      })
      .filter((cT) => cT !== entryTitle); // siblings
    return [du, ud];
  }

  function calculateChildGen() {
    // 2 ds, 1 u (essentially all children in some way or another)
    let ddu = [];
    // children in law
    ddu = grandchildEs
      .flatMap((gcE) => {
        // add children-in-law to the canvas for linkage as parents of focused entry's grandchildren
        gcE.parentTitles.forEach((cilT) =>
          leftToRights.push([cilT, gcE.title])
        );
        return gcE.parentTitles;
      })
      .filter((childinlawT) => !childTs.includes(childinlawT));
    let dud = childEs // stepchildren
      .flatMap((cE) => cE.parentTitles) // step-parents' canvas links are calculated in the step-parent section
      .filter((pT) => pT !== entryTitle) // ensure we ignore the current entry
      .flatMap((spT) => entry(spT))
      .flatMap((spE) => {
        // add stepchildren to the canvas for linkage as children of focused entry's spouses
        spE.childrenTitles.forEach((stepcT) =>
          leftToRights.push([spE.title, stepcT])
        );
        return spE.childrenTitles;
      })
      .filter((stepcT) => !childTs.includes(stepcT));
    let udd = parentEs // niblings
      .flatMap((pE) => pE.childrenTitles)
      .filter((cT) => cT !== entryTitle) // ensure we ignore the current entry
      .flatMap((sibT) => entry(sibT))
      .flatMap((sibE) => {
        // add niblings to the canvas for linkage as children of focused entry's siblings
        sibE.childrenTitles.forEach((nibT) =>
          leftToRights.push([sibE.title, nibT])
        );
        return sibE.childrenTitles;
      })
      .filter((nibT) => !childTs.includes(nibT));
    // is it possible for niblings and stepchildren to be the same? Hmmm...
    return [ddu, dud, udd];
  }

  function calculateParentGen() {
    // 1 d, 2 us (essentially all parents in some way or another)
    let duu = // parent-in-laws
      childEs
        .flatMap((cE) => cE.parentTitles)
        .flatMap((spT) => entry(spT))
        .flatMap((spE) => {
          // add parent-in-laws to the canvas for linkage as parents of focused entry's spouses
          spE.parentTitles.forEach((pilT) =>
            leftToRights.push([pilT, spE.title])
          );
          return spE.parentTitles;
        })
        .filter((pilT) => !parentTs.includes(pilT));
    let uud = parentEs // auncles
      .flatMap((pE) => pE.parentTitles)
      .flatMap((gpT) => {
        // add auncles to the canvas for linkage as children of focused entry's grandparents
        entry(gpT).childrenTitles.forEach((auncleT) =>
          leftToRights.push([entry(gpT).title, auncleT])
        );
        return entry(gpT).childrenTitles;
      })
      .filter((aunc) => !parentTs.includes(aunc));
    let udu = parentEs // stepparents
      .flatMap((pE) => pE.childrenTitles)
      .flatMap((sibT) => entry(sibT))
      .flatMap((sibE) => {
        // add stepparents to the canvas for linkage as parents of focused entry's siblings
        sibE.parentTitles.forEach((steppT) =>
          leftToRights.push([steppT, sibE.title])
        );
        return sibE.parentTitles;
      })
      .filter((pT) => !parentTs.includes(pT));
    return [duu, uud, udu];
  }
  let [d, u] = calculateBasic1GenAway();
  let [dd, uu] = calculate2GensAway();
  let [du, ud] = calculateSameGen();
  let [ddu, dud, udd] = calculateChildGen();
  let [duu, uud, udu] = calculateParentGen();
  const relations = { d, u, dd, uu, du, ud, ddu, dud, udd, duu, uud, udu };
  return relations;
}
function runTests() {
  /**
   * A shortcut for "console.assert".
   * @param {boolean} what
   * @param {string} message
   */
  function ensure(what, message) {
    console.assert(what, message);
  }
  function test_entry() {
    // the entries array must start clean.
    entries.length = 0;
    // ensure that the entry gets added to the global array
    const helloEntry = entry("hello");
    ensure(
      entries.includes(helloEntry) && entries.length === 1,
      "The new entry didn't get added to the global array!"
    );
    // entries should not be duplicated, instead return the same object
    const helloEntry2 = entry("hello");
    ensure(entries.length !== 2, "The entry was added twice!");
    ensure(
      entries.length === 1,
      "The length should be 1, but it's " + entries.length
    );
  }
  function test_parentAndChildGiving() {
    // test parents
    entries.length = 0;
    give("hello").aParent("kittens");
    ensure(
      entry("kittens").childrenTitles.includes("hello"),
      "entry 'kittens' does not have the child 'hello'."
    );
    ensure(
      entry("hello").parentTitles.includes("kittens"),
      "entry 'hello' does not have the parent 'kittens'."
    );
    // test children
    entries.length = 0;
    give("hello").aChild("kittens");
    ensure(
      entry("hello").childrenTitles.includes("kittens"),
      "The entry 'hello' does not have the child 'kittens'."
    );
    ensure(
      entry("kittens").parentTitles.includes("hello"),
      "The entry 'kittens' does not have the parents 'hello'."
    );
  }
  function test_noParentAndChildDupes() {
    entries.length = 0;
    // parent and child relations to the same entry cannot exist; they are instead just the newest relation defined.
    give("A").aChild("B");
    give("B").aChild("A");
    ensure(
      !entry("A").childrenTitles.includes("B"),
      "A should not have B as a title, but it does!"
    );
    ensure(
      !entry("B").parentTitles.includes("A"),
      "B should not have A as a parent, but it does!"
    );
    ensure(
      entry("A").parentTitles.includes("B"),
      "A should have B as a title, but it doesn't!"
    );
    ensure(
      entry("B").childrenTitles.includes("A"),
      "B should have A as a parent, but it doesn't!"
    );
    ensure(
      entry("A").childrenTitles.length === 0,
      "A shouldn't have children, but it does!"
    );
    ensure(
      entry("A").parentTitles.length === 1,
      "A doesn't have exactly 1 parent."
    );
    ensure(
      entry("B").childrenTitles.length === 1,
      "B should have one child, but it doesn't."
    );
    ensure(
      entry("B").parentTitles.length === 0,
      "B shouldn't have children, but it does!"
    );
  }
  function test_saving_and_loading() {
    entries.length = 0;
    give("A").aChild("B");
    give("B").aChild("C");
    give("A").aChild("D");
    give("C").aParent("E");
    const dataBeforeSavingAndLoading = entries;
    const dataAfterSavingAndLoading = getFromLocalStorage();
    ensure(
      dataAfterSavingAndLoading !== undefined &&
        dataAfterSavingAndLoading !== null,
      "The data doesn't exist!"
    );
    ensure(
      deepishArraysAreEqual(
        dataBeforeSavingAndLoading,
        dataAfterSavingAndLoading
      ),
      "The entries being loaded after are NOT the same as the entries that were saved!"
    );
    entries.length = 0;
  }
  function test_arrayEqualsMethod() {
    ensure(
      !deepishArraysAreEqual(
        [1, 2, 3, { title: "red" }],
        [1, 2, 3, { title: "red", entries }]
      ),
      "Nope."
    );
    ensure(
      deepishArraysAreEqual(
        [1, 2, 3, { title: "red" }],
        [1, 2, 3, { title: "red" }]
      ),
      "Nope."
    );
  }
  function test_getRelations() {
    entries.length = 0;
    // must test every relation: d, u, dd, uu, du, ud, ddu, dud, udd, duu, uud, and udu
    give("A").aChild("B");
    give("B").aChild("C");
    give("B").aChild("D");
    give("B").aParent("E");
    give("A").aParent("F");
    give("F").aChild("G");
    give("F").aParent("K");
    give("E").aParent("H");
    give("E").aChild("L");
    give("H").aParent("I");
    give("D").aParent("J");
    give("G").aChild("M");
    give("G").aParent("N");
    let Arelations = getRelations(
      "A",
      entries.map((e) => e.title)
    );
    let Crelations = getRelations(
      "C",
      entries.map((e) => e.title)
    );
    // DO NOT FORGET TO TEST RELATIONS THAT SHOULD _NOT_ BE INCLUDED, LIKE CHILDREN VS NIBLINGS
    // d - child
    ensure(Arelations.d.includes("B"), "B isn't A's child, but it should be!");
    // u - parent
    ensure(Arelations.u.includes("F"), "F isn't A's parent, but it should be!");
    // dd - grandchild
    ensure(
      Arelations.dd.includes("C"),
      "C isn't A's grandchild, but it should be!"
    );
    ensure(
      Arelations.dd.includes("D"),
      "D isn't A's grandchild, but it should be!"
    );
    ensure(
      Arelations.dd.length === 2,
      "There aren't exactly 2 grandchildren, as there should be!"
    );
    // uu - grandparent
    ensure(Arelations.uu.includes("K"), "K was not a gp as it should be!");
    // du - spouse
    ensure(Arelations.du.includes("E"), "A should have E as a spouse!");
    // ud - sibling
    ensure(
      Arelations.ud.includes("G"),
      "A doesn't have a sibling, but it should!"
    );
    // ddu - child-in-law
    ensure(
      Arelations.ddu.includes("J"),
      "J isn't in there, but it should be!!"
    );
    // dud - stepchild
    ensure(
      Arelations.dud.includes("L"),
      "L is not a stepchild, but it should be!"
    );
    // udd - niblings
    ensure(
      Arelations.udd.includes("M"),
      "M is not a nibling, but it should be!"
    );
    // duu - parent in law
    ensure(
      Arelations.duu.includes("H"),
      "It does not contain H as a parent in law!"
    );
    ensure(
      !Arelations.duu.includes("F"),
      "F is a parent, and should not be a parent in law!"
    );
    // udu - stepparent
    ensure(
      Arelations.udu.includes("N"),
      "N is not a stepparent, but it should be!"
    );
    // uud - auncle
    ensure(
      Crelations.uud.includes("L"),
      "L should be a child of C, but it's not!"
    );
  }
  function test_entryElementsLocation() {
    entries.length = 0;
    function shouldBeWithin(what, cNum) {
      let col = document.querySelectorAll(".column")[cNum];
      ensure(
        Array.from(col.children).includes(what),
        "The entry " + what + " wasn't found within " + col
      );
    }
    shouldBeWithin(createElementForEntry("this should be within gp", "uu"), 0);
    shouldBeWithin(
      createElementForEntry("this should be within parents", "u"),
      1
    );
    shouldBeWithin(
      createElementForEntry("this should be within children", "d"),
      3
    );
    shouldBeWithin(
      createElementForEntry("this should be within self", "du"),
      2
    );
    shouldBeWithin(
      createElementForEntry("this should be within self, too", "ud"),
      2
    );
    shouldBeWithin(createElementForEntry("this should be within gc", "dd"), 4);
    entries.length = 0;
  }
  function test_extraneousRelationsRenderToo() {
    clearColumns();
    give("A").aChild("B");
    give("B").aChild("C");
    give("B").aChild("D");
    give("B").aParent("E");
    give("A").aParent("F");
    give("F").aChild("G");
    give("F").aParent("K");
    give("E").aParent("H");
    give("E").aChild("L");
    give("H").aParent("I");
    give("D").aParent("J");
    give("G").aChild("M");
    give("G").aParent("N");
    renderEntries("A");
  }
  // run all tests
  [
    test_entry,
    test_parentAndChildGiving,
    test_noParentAndChildDupes,
    test_saving_and_loading,
    test_arrayEqualsMethod,
    test_getRelations,
    test_entryElementsLocation,
    test_extraneousRelationsRenderToo,
  ].forEach((test) => test());
  // entries.length = 0 // ensure the entries are reset before ending tests.
}
function renderAndClear(focusedTitle) {
  clearColumns();
  renderEntries(focusedTitle);
}
function renderEntries(/** @type {string} */ focusedTitle) {
  /** @type {{d: string[], u: string[], dd: string[], uu: string[], du: string[], ud: string[], ddu: string[], dud: string[], udd: string[], duu: string[], uud: string[], udu: string[]}} */
  let relations = getRelations(
    focusedTitle,
    entries.map((e) => e.title)
  );
  focused = entry(focusedTitle);
  createElementForEntry(focusedTitle, "self");
  let rels = Object.entries(relations).forEach((relationArray) => {
    relationArray[1].forEach((kind) => {
      createElementForEntry(kind, relationArray[0]);
    });
  });

  leftToRights.forEach((leftRight) => {
    let isDupe = false;
    let leftRightsThatMatchThisOne = leftToRights.filter(
      (LR) => LR[0] === leftRight[0] && LR[1] === leftRight[1]
    );
    if (leftRightsThatMatchThisOne.length > 1)
      leftRightsThatMatchThisOne.forEach((LR, i) => {
        if (i >= 1) {
          let index = leftToRights.indexOf(LR);
          leftToRights.splice(index, 1);
        }
      });
  });
  leftToRights.forEach((leftRight) => {
    drawLink(leftRight[0], leftRight[1]);
  });
}
function createElementForEntry(
  /** @type {string} */ actualTitle,
  /** @type {string} */ relationToFocused,
  /** @type {string} */ altTitle
) {
  let col;
  if (relationToFocused === "uu") {
    col = 0;
  } else if (["u", "duu", "uud", "udu"].includes(relationToFocused)) {
    // dd, uu
    col = 1;
  } else if (["du", "ud"].includes(relationToFocused)) {
    col = 2;
  } else if (["d", "udd", "ddu", "dud"].includes(relationToFocused)) {
    col = 3;
  } else if (relationToFocused === "dd") {
    col = 4;
  } else if (relationToFocused === "self") {
    col = 2;
  }
  if (col !== undefined && col !== null) {
    let entryElement = document.createElement("div");
    if (relationToFocused === "self") entryElement.classList.add("focused");
    entryElement.classList.add("entry");
    entryElement.innerText = altTitle ?? actualTitle;
    entryElement.onclick = () => {
      clearColumns();
      renderEntries(actualTitle);
    };
    let columnElement = document.querySelectorAll(".column")[col];
    columnElement.appendChild(entryElement);
    return entryElement;
  }
  return undefined;
}
function clearColumn(/** @type {number} */ num) {
  document.querySelectorAll(".column")[num].replaceChildren();
}
function clearColumns() {
  leftToRights = [];
  context.clearRect(0, 0, canvas.width, canvas.height);
  [0, 1, 2, 3, 4].forEach((num) => clearColumn(num));
}
function drawLink(leftEntryTitle, rightEntryTitle) {
  let LEnt = entry(leftEntryTitle);
  let REnt = entry(rightEntryTitle);
  /** @type {HTMLElement} */ //@ts-expect-error - it's not right about this
  let RElem = getEntryElement(rightEntryTitle);
  /** @type {HTMLElement} */ //@ts-expect-error - it's not right about this
  let LElem = getEntryElement(leftEntryTitle);
  if (RElem && LElem) {
    /**
     * Returns the average of two numbers.
     * @param {number} a
     * @param {number} b
     * @returns
     */
    function avg(a, b) {
      return (a + b) / 2;
    }
    let LECoords = findNumpadCoords(LElem);
    let RECoords = findNumpadCoords(RElem);
    context.lineWidth = 5;
    if (
      LElem.classList.contains("focused") ||
      RElem.classList.contains("focused")
    ) {
      context.strokeStyle = "gold";
    } else {
      context.strokeStyle = "rgba(0,0,0,0.3)";
    }
    // else {
    //   if (document.querySelectorAll(":hover.entry"))
    //   if (LElem === Object.entries(document.querySelectorAll(":hover.entry"))[0][1])
    //     context.strokeStyle = "rgba(0,0,0,0.3)"
    // }
    context.beginPath();
    context.moveTo(LECoords.six.x, LECoords.six.y);
    context.lineTo(RECoords.four.x, RECoords.four.y);
    context.stroke();
  } else {
    console.log(
      "One of these entries doesn't exist: ",
      leftEntryTitle,
      rightEntryTitle
    );
  }
}
function getEntryElement(title) {
  let entryEls = Object.entries(document.querySelectorAll(".column")).map(
    (colEl) => Object.entries(colEl[1].children).map((c) => c[1])
  );
  return entryEls.flat().find((e) => e.innerHTML === title);
}
/**
 *
 * @param {HTMLElement} element
 * @returns
 */
function findNumpadCoords(element) {
  // For example, 7 is top left, 8 is the top middle, 9 is top right, 4 is middle left, 5 is center, etc.
  let one, two, three, four, five, six, seven, eight, nine;
  one = {
    x: element.offsetLeft,
    y: element.offsetTop + element.clientHeight,
  };
  two = {
    x: one.x + element.clientWidth / 2,
    y: one.y,
  };
  three = { x: one.x + element.offsetWidth, y: one.y };
  four = { x: one.x, y: element.offsetHeight / 2 + element.offsetTop };
  five = { x: two.x, y: four.y };
  six = { x: three.x, y: four.y };
  seven = { x: one.x, y: element.offsetTop };
  eight = { x: two.x, y: seven.y };
  nine = { x: three.x, y: seven.y };
  return { one, two, three, four, five, six, seven, eight, nine };
}
let canvas =
  document.querySelector("canvas") ?? document.createElement("canvas"); // this ternary is preventing TS errors about it possibly being null, which is untrue.
let context = canvas.getContext("2d") ?? new CanvasRenderingContext2D(); // this ternary is preventing TS errors about it possibly being null, which is untrue.
canvas.height = innerHeight;
canvas.width = innerWidth;
setColorTheme(blueDarkTheme);
/** @type {{ title: string; parentTitles: string[]; childrenTitles: string[]; }[]} */
let entries = [];
let focused;
runTests();
entries = [...entries, ...getFromLocalStorage()];
console.log(leftToRights);
Object.entries(document.querySelectorAll(".column"))
  .map((el) => el[1])
  .forEach((el) =>
    el.addEventListener("mousedown", (e) => {
      if (el.id === "d") {
        give(focused.title).aChild("cat");
        renderAndClear(focused.title);
      } else if (el.id === "u") {
        give(focused.title).aParent("cat");
        renderAndClear(focused.title);
      }
    })
  );
