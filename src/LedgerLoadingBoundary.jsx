import React from 'react';

export default class LedgerLoadingBoundary extends React.Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className="auth-loading" role="alert"><p>The ledger could not load. Check your connection, then reload to try again.</p><button className="l-button" onClick={()=>window.location.reload()}>Reload ledger</button></div>:this.props.children;}
}
