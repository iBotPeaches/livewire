import { describe, it, vi, expect, beforeEach } from 'vitest'
import { debounceByComponent, callAndClearComponentDebounces } from './debounce'
import { debounce } from './directives/wire-model'

describe('Debounce Cancellation', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    describe('debounceByComponent', () => {
        it('cancels previous in-flight requests when a new debounce is triggered', async () => {
            let component = { id: '1' }
            let cancelCalled = false

            let callback = vi.fn(() => {
                return () => {
                    cancelCalled = true
                }
            })

            let debounced = debounceByComponent(component, callback, 100)

            // Trigger first time
            debounced()
            vi.advanceTimersByTime(100)
            expect(callback).toHaveBeenCalledTimes(1)
            expect(cancelCalled).toBe(false)

            // Trigger second time - this should trigger the cancel hook from the first execution
            debounced()
            expect(cancelCalled).toBe(true)
        })

        it('cancels in-flight requests when clearing debounces', () => {
            let component = { id: '1' }
            let cancelCalled = false

            let callback = vi.fn(() => {
                return () => {
                    cancelCalled = true
                }
            })

            let debounced = debounceByComponent(component, callback, 100)

            // Trigger and let it execute
            debounced()
            vi.advanceTimersByTime(100)
            expect(callback).toHaveBeenCalledTimes(1)
            expect(cancelCalled).toBe(false)

            // Now clear it
            callAndClearComponentDebounces(component, () => {})
            expect(cancelCalled).toBe(true)
        })
    })

    describe('internal debounce', () => {
        it('cancels previous in-flight requests when a new debounce is triggered', () => {
            let cancelCalled = false
            let callback = vi.fn(() => {
                return () => {
                    cancelCalled = true
                }
            })

            let debounced = debounce(callback, 100)

            // Trigger first time
            debounced()
            vi.advanceTimersByTime(100)
            expect(callback).toHaveBeenCalledTimes(1)
            expect(cancelCalled).toBe(false)

            // Trigger second time - should call cancel
            debounced()
            expect(cancelCalled).toBe(true)
        })
    })
})
