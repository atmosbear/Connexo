
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
export { setColorTheme, purpleTheme, blueDarkTheme, smokeTheme }