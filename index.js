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

const entries = []