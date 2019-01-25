/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

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

        const wrapperClassNames = {};
        if (section.wrapperClassNames) {
          section.wrapperClassNames.forEach((className) => {
            wrapperClassNames[className] = className;
          });
        }

        const classnames = makeClassName(
          'section-component-wrapper',
          wrapperClassNames,
        );

        return {
          subtitle: propsString !== '' ? propsString : 'default',
          sectionFn: () => (
            <div className={classnames}>
              <Component {...section.props}>{children}</Component>
              {section.wrapperClassNames && (
                <div className="section-notes">
                  <strong>Note:</strong> &nbsp;
                  <em>{section.wrapperClassNames.join(', ')}</em>
                  {` ${
                    section.wrapperClassNames.length === 1 ? 'has' : 'have'
                  } been
                  added as a wrapper class to pick up it's related styles.`}
                </div>
              )}
            </div>
          ),
          ...otherSectionProps,
        };
      }),
      ...otherChapterProps,
    };
  });
};
