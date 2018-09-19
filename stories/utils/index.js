/* @flow */
import React from 'react';

type CreateChapterParams = {|
  // TODO: look into what React.Node or ~ React.ComponentType<any>
  // doesn't work here :/.
  Component: Function,
  sections: Array<any>,
  createSections: (any) => Array<Object>,
  children?: any,
  showChapterTitle?: boolean,
|};

// TODO: add these
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
  createSections,
  children = 'Hello Text',
  showChapterTitle = true,
}: CreateChapterParams = {}) => {
  return sections.map(function(type) {
    return {
      title: showChapterTitle ? type : undefined,
      sections: createSections(type).map((section) => {
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
