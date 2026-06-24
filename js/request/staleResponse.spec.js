import { describe, it, expect, beforeEach } from 'vitest'
import { incrementComponentLiveVersion, getComponentLiveVersion } from './messageBus.js'

// Helper to create a minimal component-like object for WeakMap keying
function makeComponent(id) {
    return { id }
}

describe('Stale model.live response guard', () => {
    it('starts at version 0 for a new component', () => {
        let component = makeComponent('abc')
        expect(getComponentLiveVersion(component)).toBe(0)
    })

    it('increments version each time a model.live request is sent', () => {
        let component = makeComponent('def')
        expect(incrementComponentLiveVersion(component)).toBe(1)
        expect(incrementComponentLiveVersion(component)).toBe(2)
        expect(incrementComponentLiveVersion(component)).toBe(3)
        expect(getComponentLiveVersion(component)).toBe(3)
    })

    it('tracks versions independently per component', () => {
        let componentA = makeComponent('comp-a')
        let componentB = makeComponent('comp-b')

        incrementComponentLiveVersion(componentA)
        incrementComponentLiveVersion(componentA)
        incrementComponentLiveVersion(componentB)

        expect(getComponentLiveVersion(componentA)).toBe(2)
        expect(getComponentLiveVersion(componentB)).toBe(1)
    })

    it('a stale response version is less than the current version', () => {
        let component = makeComponent('comp-stale')

        // Request A sent (version 1)
        let versionA = incrementComponentLiveVersion(component)
        // Request B sent (version 2)
        let versionB = incrementComponentLiveVersion(component)

        // Response B arrives first and is applied (current version == 2)
        let currentVersion = getComponentLiveVersion(component)

        // Response A arrives later - version 1 < current version 2, so it is stale
        expect(versionA < currentVersion).toBe(true)

        // Response B is not stale
        expect(versionB < currentVersion).toBe(false)
    })

    it('a response with the same version as the current version is not stale', () => {
        let component = makeComponent('comp-current')

        let version = incrementComponentLiveVersion(component)
        let currentVersion = getComponentLiveVersion(component)

        // Only one request sent, so version == currentVersion → not stale
        expect(version < currentVersion).toBe(false)
    })

    it('only the very latest request is not stale when multiple requests are in flight', () => {
        let component = makeComponent('comp-multi')

        let versions = []
        for (let i = 0; i < 5; i++) {
            versions.push(incrementComponentLiveVersion(component))
        }

        let currentVersion = getComponentLiveVersion(component)

        // versions 1-4 are stale
        expect(versions[0] < currentVersion).toBe(true)
        expect(versions[1] < currentVersion).toBe(true)
        expect(versions[2] < currentVersion).toBe(true)
        expect(versions[3] < currentVersion).toBe(true)

        // version 5 is the latest and is not stale
        expect(versions[4] < currentVersion).toBe(false)
    })
})
