/* @flow */
import React from 'react';

type PropsMatrixType = {|
  props: Object,
|};

type ChapterType = string | number | void;

type CreateChapterParams = {|
  // TODO: look into why React.Node or ~ React.ComponentType<any>
  // doesn't work here :/.
  Component: Function,
  chapters: Array<string | void>,
  children?: any,
  createPropsMatrix: (any) => Array<PropsMatrixType>,
  otherChapterProps?: Object,
  otherSectionProps?: Object,
|};

type CreateSectionParams = {|
  // TODO: look into why React.Node or ~ React.ComponentType<any>
  // doesn't work here :/.
  Component: Function,
  children?: any,
  createPropsMatrix: (any) => Array<PropsMatrixType>,
  createPropsMatrixParams?: string | void,
  otherSectionProps?: Object,
|};

const getPropString = (props: PropsMatrixType) => {
  return JSON.stringify(props, null, ' ').replace(/[{}]/g, '');
};

// Create Chapters is if you have an array of an array.
export const createChapters = ({
  Component,
  chapters,
  children = 'Hello Text',
  createPropsMatrix,
  otherChapterProps = {},
  otherSectionProps = {},
}: CreateChapterParams = {}): Array<PropsMatrixType> => {
  return chapters.map((chapter: ChapterType) => {
    return {
      title: chapter,
      sections: createSections({
        Component,
        children,
        createPropsMatrix,
        createPropsMatrixParams: chapter,
        ...otherSectionProps,
      }),
      ...otherChapterProps,
    };
  });
};

// Create Chapters is if you have an array display
export const createSections = ({
  Component,
  children = 'Hello Text',
  createPropsMatrix,
  createPropsMatrixParams,
  otherSectionProps = {},
}: CreateSectionParams = {}): Array<PropsMatrixType> => {
  return createPropsMatrix(createPropsMatrixParams).map(
    (section: PropsMatrixType) => {
      const propsString = getPropString(section.props);
      return {
        subtitle: propsString !== '' ? propsString : 'default',
        sectionFn: () => <Component {...section.props}>{children}</Component>,
        ...otherSectionProps,
      };
    },
  );
};
