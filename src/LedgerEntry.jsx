import React from 'react';
import ModernLedger,{demoStorage} from './ModernLedger';

// Keep the character engine and bundled rule data behind the ledger entry point.
// The sign-in screen can render without downloading those catalogs first.
export default function LedgerEntry({demo,demoRef,storage,...props}) {
  if(demo&&!demoRef.current)demoRef.current=demoStorage();
  window.storage=demo?demoRef.current:storage;
  return <ModernLedger {...props} demo={demo}/>;
}
