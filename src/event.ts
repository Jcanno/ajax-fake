import { EKey } from "./constants"

// event listener
export const EventTarget = {
  addEventListener(type, handle) {
    const events = this[EKey][type] || (this[EKey][type] = [])
    events.push(handle)
  },
  removeEventListener(type, handle) {
    const handles = this[EKey][type] || []

    let i = handles.length - 1
    while (i >= 0) {
      if (handles[i] === handle) {
        handles.splice(i, 1)
      }
      i--
    }
  },
  dispatchEvent(event: Event) {
    const handles = this[EKey][event.type] || []
    for (let i = 0; i < handles.length; i++) {
      handles[i].call(this, event)
    }

    const onType = `on${event.type}`
    if (this[onType]) this[onType](event)
  },
}