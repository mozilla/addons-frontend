import ftl, {selectorRef} from 'fluent-react';

export const simple = ftl.message`Hello World!`;

// name: The name of the user
export const name = ftl.term`World`;

// $ref: A specific reference
export const withVariableReference = ftl.message<{$ref: string}>`Hello ${({$ref}) => $ref}!`;

export const withTermReference = ftl.message`Hello {${name}}!`;

export const genderedStream = ftl.selector<Gender>({
  male: `her stream ${name}`,
  female: 'his stream',
  other: `their stream ${selectorRef}`,
});




enum Gender {
  male = 'male',
  female = 'female',
  other = 'other',
}

/*


*/


