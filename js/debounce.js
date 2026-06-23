import { WeakBag } from './utils'

let callbacksByComponent = new WeakBag

export function debounceByComponent(component, callback, time) {
    // Prepare yourself for what's happening here.
    // Any text input with wire:model on it should be "debounced" by ~150ms by default.
    // We can't use a simple debounce function because we need a way to clear all the pending
    // debounces if a user submits a form or performs some other action.
    // This is a modified debounce function that acts just like a debounce, except it stores
    // the pending callbacks in a global property so we can "clear them" on command instead
    // of waiting for their setTimeouts to expire. I know.
    //
    // Additionally, if the callback returns a function, that function is treated as a
    // cancellation hook and will be called before the next debounced execution or
    // when debounces are cleared.

    // This is a "null" callback. Each wire:model will resister one of these upon initialization.
    let callbackRegister = { callback: () => { } }
    callbacksByComponent.add(component, callbackRegister)

    // This is a normal "timeout" for a debounce function.
    var timeout

    return e => {
        // If there's a pending cancellation from the previous execution, call it now.
        // We do this BEFORE clearing the timeout, so that if the user types quickly,
        // we cancel any in-flight request from a PREVIOUSLY COMPLETED debounce.
        if (callbackRegister.cancel) callbackRegister.cancel()

        clearTimeout(timeout)

        timeout = setTimeout(() => {
            let result = callback(e)

            if (typeof result === 'function') {
                // Store the returned cancellation function so we can call it later.
                callbackRegister.cancel = result
            } else {
                callbackRegister.cancel = undefined
            }

            timeout = undefined

            // Because we just called the callback, let's return the
            // callback register to it's normal "null" state.
            callbackRegister.callback = () => { }
        }, time)

        // Register the current callback in the register as a kind-of "escape-hatch".
        callbackRegister.callback = () => {
            // If there's a pending cancellation from the previous execution, call it now.
            if (callbackRegister.cancel) callbackRegister.cancel()

            clearTimeout(timeout)

            let result = callback(e)

            if (typeof result === 'function') {
                // Store the returned cancellation function so we can call it later.
                callbackRegister.cancel = result
            } else {
                callbackRegister.cancel = undefined
            }
        }
    }
}

export function callAndClearComponentDebounces(component, callback) {
    // This is to protect against the following scenario:
    // A user is typing into a debounced input, and hits the enter key.
    // If the enter key submits a form or something, the submission
    // will happen BEFORE the model input finishes syncing because
    // of the debounce. This makes sure to clear anything in the debounce queue.

    callbacksByComponent.each(component, callbackRegister => {
        // If there's a pending cancellation, call it before manually firing the callback.
        if (callbackRegister.cancel) callbackRegister.cancel()

        callbackRegister.callback()
        callbackRegister.callback = () => { }
    })

    callback()
}
