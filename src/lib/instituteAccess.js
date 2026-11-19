// Only the database grant belongs to the saved sheet. Ignore flags inside its JSON.
export function sheetWithInstituteAccess(row) {
  const {instituteAccess,...sheet}=row.data;
  return row.institute_access===true?{...sheet,instituteAccess:true}:sheet;
}

export const supportsInstitute=c=>c.instituteAccess===true
  && ((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')==='2014';
