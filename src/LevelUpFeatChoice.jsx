import React from 'react';
import FeatChoices from './FeatChoices';

export default function LevelUpFeatChoice({char,feat,onChange,homebrew=[]}) {
  const existing=char.feats||[];
  return <FeatChoices char={{...char,feats:[...existing,...(feat?[feat]:[])]}}
    homebrew={homebrew} editable lockedCount={existing.length}
    maxFeats={existing.length+1} requireCustomReview
    patch={({feats})=>onChange(feats[existing.length]||null)}/>;
}
