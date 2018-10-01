/* @flow */
import * as React from 'react';

type PropsMatrixType = {|
  props: Object,
|};

type ChapterType = string | number | void;

type CreateChapterParams = {|
  Component: React.ComponentType<any>,
  chapters: Array<string | void>,
  children?: any,
  createPropsMatrix: (any) => Array<PropsMatrixType>,
  otherChapterProps?: Object,
  otherSectionProps?: Object,
|};

const getPropString = (props: PropsMatrixType) => {
  return JSON.stringify(props, null, ' ').replace(/[{}]/g, '');
};

export const createChapters = ({
  Component,
  chapters,
  createPropsMatrix,
  children = 'Hello Text',
  otherChapterProps = {},
  otherSectionProps = {},
}: CreateChapterParams = {}): Array<PropsMatrixType> => {
  return chapters.map((chapter: ChapterType) => {
    return {
      title: chapter,
      sections: createPropsMatrix(chapter).map((section: PropsMatrixType) => {
        const propsString = getPropString(section.props);

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
