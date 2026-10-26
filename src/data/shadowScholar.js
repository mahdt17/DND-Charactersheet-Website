export const shadowScholarId='2014:shadow-scholar';
export const shadowScholarStory={
 trait:'You instinctively study your surroundings before acting, always looking for advantageous positions, escape routes, and things others have overlooked.',
 ideal:'Magic becomes dangerous when it is misunderstood. Knowledge is the best weapon against the unknown.',
 bond:'Your mentor disappeared—or died—while researching a forgotten form of elven archery that could bind spells directly into arrows. You still possess part of their research.',
 flaw:'When confronted with forgotten magic or forbidden knowledge, your curiosity can override your better judgment.'
};
export const shadowScholarNotes=`Personality Trait\n${shadowScholarStory.trait}\n\nIdeal — Knowledge\n${shadowScholarStory.ideal}\n\nBond\n${shadowScholarStory.bond}\n\nFlaw\n${shadowScholarStory.flaw}`;
export const shadowScholarItems=[
 {name:'Bottle of black ink',qty:1},
 {name:'Quill',qty:1},
 {name:'Small knife',qty:1},
 {name:'Mysterious letter',qty:1,description:'A letter from a deceased colleague or mentor containing an unanswered magical question. It may hold research into a forgotten elven technique for binding spells directly into arrows.'},
 {name:'Dark common traveling clothes',qty:1},
 {name:'Pouch',qty:1}
];
export const shadowScholarBackground={
 name:'Shadow Scholar',catalogId:shadowScholarId,edition:'2014',source:'Custom background · 2014 rules',
 blurb:'A scholar and marksman trained to seek dangerous magical knowledge, move unseen through ruins, and study forgotten elven spellcraft.',
 skills:'Stealth, Arcana',proficiencies:"Thieves' Tools",languages:['Draconic','Undercommon'],
 equipment:[...shadowScholarItems.map(item=>item.name),'10 gp'].join(', '),
 feature:['Researcher','When you lack a piece of lore, you generally know where or from whom you could learn it, such as an archive, library, or knowledgeable contact. Finding that source does not guarantee access or an immediate answer. Work with your DM to pursue the information.']
};
