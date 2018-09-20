/* @flow */
import React from 'react';

type CreateChapterParams = {|
  // TODO: look into why React.Node or ~ React.ComponentType<any>
  // doesn't work here :/.
  Component: Function,
  children?: any,
  createPropsMatrix: (any) => Array<Object>,
  sections: Array<any>,
  showChapterTitle?: boolean,
|};

// TODO: Add these (to fix current flow issues).
export type SectionType = {|
  subtitle: string,
  sectionFn: Function,
|};

export type ChapterType = {|
  title: string | void,
  sections: Array<SectionType>,
|};

export const createChapters = ({
  Component,
  sections,
  createPropsMatrix,
  children = 'Hello Text',
  showChapterTitle = true,
}: CreateChapterParams = {}) => {
  return sections.map((type) => {
    return {
      title: showChapterTitle ? type : undefined,
      sections: createPropsMatrix(type).map((section) => {
        const propsString = JSON.stringify(section.props, null, ' ').replace(
          /[{}]/g,
          '',
        );

        return {
          subtitle: propsString !== '' ? propsString : 'default',
          sectionFn: () => <Component {...section.props}>{children}</Component>,
        };
      }),
    };
  });
};

