'use strict';

const FIRST_TAG_OPENER_EXP = /^<([a-zA-Z0-9-_]+)([^>]*)>/;
const ID_ATTR_EXP = /id\s*=\s*['"]([^"']*)['"]/;
const CLASS_ATTR_EXP = /class\s*=\s*['"]([^"']*)['"]/;





export const hasFirstTag = (html) =>
  FIRST_TAG_OPENER_EXP.test(html);




export const replaceFirstTagAttrs = (html, prepareAttrs) =>
  html.replace(FIRST_TAG_OPENER_EXP, ($0, tagName, attrsStr) => {
    attrsStr = prepareAttrs(attrsStr);

    return `<${tagName}${attrsStr}>`;
  });




export const getFirstArgFromString = (str) => {
  let val = null;

  str.replace(ID_ATTR_EXP, ($0, first) => {
    val = first;
  });

  return val;
};




export const insertClassIntoAttrStr = (attrStr, className) => {
  if (CLASS_ATTR_EXP.test(attrStr)) {
    attrStr = attrStr.replace(CLASS_ATTR_EXP, ($0, classString) => {
      if ((` ${classString} `).indexOf(` ${className} `) !== -1) {
        return $0;
      }

      return `class="${classString} ${className}"`;
    });
  } else {
    attrStr = `${attrStr} class="${className}"`;
  }

  return attrStr;
};

