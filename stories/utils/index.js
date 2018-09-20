/* @flow */
import React from 'react';

type MatrixType = {|
  props: Object,
|};

type CreateChapterParams = {|
  // TODO: look into why React.Node or ~ React.ComponentType<any>
  // doesn't work here :/.
  Component: Function,
  chapters: Array<string | void>,
  children?: any,
  createPropsMatrix: (any) => Array<MatrixType>,
  otherChapterProps?: Object,
  otherSectionProps?: Object,
|};

// TODO: Add these (to fix current flow issues).
// type SectionType = {|
//   subtitle: string,
//   sectionFn: Function,
// |};

// type ChapterType = {|
//   title: string | void,
//   sections: Array<SectionType>,
// |};

export const createChapters = ({
  Component,
  chapters,
  children = 'Hello Text',
  createPropsMatrix,
  otherChapterProps = {},
  otherSectionProps = {},
}: CreateChapterParams = {}) => {
  return chapters.map((type) => {
    return {
      title: type,
      sections: createPropsMatrix(type).map((section) => {
        const propsString = JSON.stringify(section.props, null, ' ').replace(
          /[{}]/g,
          '',
        );

        return {
          subtitle: propsString !== '' ? propsString : 'default',
          sectionFn: () => <Component {...section.props}>{children}</Component>,
          ...otherSectionProps,
        };
      }),
      ...otherChapterProps,
    };
  });
};
