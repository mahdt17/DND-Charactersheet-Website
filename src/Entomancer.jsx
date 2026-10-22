import React,{useState} from 'react';
import SwarmWorkspace from './entomancer/SwarmWorkspace';
import {createSwarmUi} from './lib/entomancerSubsystem';
export {default as EntomancerChoices} from './entomancer/SwarmChoices';
export {entomancerChoicesComplete} from './lib/entomancer';
export default function Entomancer(props){
 const [local,setLocal]=useState(()=>createSwarmUi(props.char));
 return <SwarmWorkspace {...props} ui={props.ui||local} onUiChange={props.onUiChange||setLocal}/>;
}
