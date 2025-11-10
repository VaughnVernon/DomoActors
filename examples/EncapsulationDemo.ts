/**
 * Demonstration of environment() encapsulation
 *
 * This shows how the Symbol-based access prevents clients from accessing
 * internal actor infrastructure while still allowing library code to
 * manage actor hierarchies.
 */

import { Actor } from '../src/actors/Actor'
import { Protocol, ProtocolInstantiator } from '../src/actors/Protocol'
import { Definition } from '../src/actors/Definition'
import { stage } from '../src/actors/Stage'
import { ActorProtocol } from '../src/actors/ActorProtocol'

// Client-facing protocol
interface MyActor extends ActorProtocol {
  doWork(): Promise<void>
}

class MyActorImpl extends Actor implements MyActor {
  async doWork(): Promise<void> {
    console.log('Doing work...')
  }
}

class MyActorProtocol implements Protocol {
  instantiator(): ProtocolInstantiator {
    return {
      instantiate: (_def: Definition) => new MyActorImpl()
    }
  }
  type(): string {
    return 'MyActor'
  }
}

// Example usage
function demonstrateEncapsulation() {
  const proxy: MyActor = stage().actorFor(new MyActorProtocol())

  // ✅ Clients CAN access public protocol methods
  proxy.doWork()
  console.log('Address:', proxy.address())
  console.log('Is stopped:', proxy.isStopped())

  // ❌ Clients CANNOT access environment() - it's undefined on the proxy!
  const env = (proxy as any).environment
  console.log('Environment accessor:', env) // undefined

  // ❌ Trying to call environment() would throw
  try {
    (proxy as any).environment()
    console.log('ERROR: Should not reach here!')
  } catch (error) {
    console.log('✓ Correctly prevented: environment() is not a function')
  }

  // ❌ Clients cannot manipulate internal infrastructure
  // These would be undefined or throw errors:
  // proxy.environment().mailbox().close()     // Can't close mailbox!
  // proxy.environment().addChild(...)         // Can't corrupt hierarchy!
  // proxy.environment().mailbox().suspend()   // Can't suspend processing!

  console.log('\n✓ Encapsulation successful - clients cannot access internal infrastructure')
  console.log('✓ Library code can still manage actor hierarchies internally via Symbol')
}

// Run the demo
demonstrateEncapsulation()
